import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../lib/server/access";
import { getGuestCart } from "../../../lib/server/cart";
import { couponDiscount, couponIsActive } from "../../../lib/server/coupons";
import { CustomizationValidationError, resolvedCustomizationUnitPrice } from "../../../lib/server/customizations";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { hasMpesaConfiguration, initiateStkPush, normalizeMpesaPhone } from "../../../lib/server/mpesa";
import { mergePaymentMetadata } from "../../../lib/server/payment-metadata";
import { getDeliverySlotAvailability } from "../../../lib/server/delivery-slots";
import { getPrismaClient } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckoutInput = { name: string; email: string; phone: string; fulfillmentType: "DELIVERY" | "PICKUP"; paymentMethod: "MPESA" | "CASH_ON_DELIVERY"; address?: string; notes?: string; scheduledFor: Date; deliverySlot: string; idempotencyKey?: string };

class CheckoutError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function parseCheckout(value: unknown): CheckoutInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const text = (item: unknown, min: number, max: number): item is string => typeof item === "string" && item.trim().length >= min && item.trim().length <= max;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fulfillmentType = input.fulfillmentType === "DELIVERY" || input.fulfillmentType === "PICKUP" ? input.fulfillmentType : null;
  const paymentMethod = input.paymentMethod === "MPESA" || input.paymentMethod === "CASH_ON_DELIVERY" ? input.paymentMethod : null;
  const scheduledDate = typeof input.scheduledDate === "string" ? input.scheduledDate : "";
  const deliverySlot = typeof input.deliverySlot === "string" ? input.deliverySlot : "";
  const scheduledFor = /^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ? new Date(`${scheduledDate}T00:00:00+03:00`) : null;
  const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date(tomorrow); maxDate.setDate(maxDate.getDate() + 90);
  const validSlot = ["10:00am – 12:00pm", "12:00pm – 2:00pm", "3:00pm – 5:00pm"].includes(deliverySlot);
  const idempotencyKey = typeof input.idempotencyKey === "string" && /^[A-Za-z0-9_-]{16,120}$/.test(input.idempotencyKey) ? input.idempotencyKey : undefined;
  if (!text(input.name, 2, 120) || !/^\S+@\S+\.\S+$/.test(email) || !text(input.phone, 7, 32) || !fulfillmentType || !paymentMethod || !scheduledFor || Number.isNaN(scheduledFor.getTime()) || scheduledFor < tomorrow || scheduledFor > maxDate || !validSlot || (fulfillmentType === "DELIVERY" && !text(input.address, 5, 500))) return null;
  return { name: input.name.trim(), email, phone: input.phone.trim(), fulfillmentType, paymentMethod, scheduledFor, deliverySlot, ...(idempotencyKey ? { idempotencyKey } : {}), ...(text(input.address, 1, 500) ? { address: input.address.trim() } : {}), ...(text(input.notes, 1, 2000) ? { notes: input.notes.trim() } : {}) };
}

function orderNumber(): string {
  return `BB-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const input = parseCheckout(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Check your contact and delivery details.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Checkout is not configured yet.", 503);
  if (input.paymentMethod === "MPESA" && !hasMpesaConfiguration()) return apiError("CONFIGURATION_ERROR", "M-Pesa payments are not configured yet.", 503);
  if (input.paymentMethod === "MPESA" && !normalizeMpesaPhone(input.phone)) return apiError("VALIDATION_ERROR", "Enter a valid Kenyan M-Pesa phone number.", 400);

  try {
    if (input.idempotencyKey) {
      const existing = await getPrismaClient().order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { orderNumber: true, status: true, total: true, currency: true } });
      if (existing) return apiSuccess({ orderNumber: existing.orderNumber, status: existing.status, total: Number(existing.total), currency: existing.currency, paymentInitiated: false, paymentMessage: "This checkout was already received." });
    }
    const session = await getAuthenticatedSession();
    const { cart } = await getGuestCart(request);
    const order = await getPrismaClient().$transaction(async (tx) => {
      const freshCart = await tx.cart.findFirst({
        where: { id: cart.id, status: "ACTIVE" },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  cake: { include: { customizations: { where: { isActive: true }, include: { values: { where: { isActive: true } } } } } },
                  inventoryItem: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          appliedCoupons: { include: { coupon: true } },
        },
      });
      if (!freshCart || freshCart.items.length === 0) throw new CheckoutError(400, "Your cart is empty or has already been checked out.");

      const selectedSlot = (await getDeliverySlotAvailability(input.scheduledFor)).find((slot) => slot.slot === input.deliverySlot);
      if (!selectedSlot?.available) throw new CheckoutError(409, "That delivery slot is full. Please choose another time.");

      let subtotal = 0;
      for (const item of freshCart.items) {
        const inventory = item.variant.inventoryItem;
        if (!item.variant.isActive || item.variant.cake.status !== "ACTIVE" || !inventory) throw new CheckoutError(400, `${item.variant.cake.name} is no longer available.`);
        const available = inventory.quantityOnHand - inventory.quantityReserved;
        if (available < item.quantity) throw new CheckoutError(409, `${item.variant.cake.name} does not have enough stock.`);
        try {
          subtotal += resolvedCustomizationUnitPrice({ basePrice: item.variant.price, customizations: item.customizations, definitions: item.variant.cake.customizations }) * item.quantity;
        } catch (error) {
          if (error instanceof CustomizationValidationError) throw new CheckoutError(400, error.message);
          throw error;
        }
      }

      if (freshCart.appliedCoupons.length > 1) throw new CheckoutError(400, "Only one coupon can be used per order.");
      const appliedCoupon = freshCart.appliedCoupons[0]?.coupon;
      let discountTotal = 0;
      if (appliedCoupon) {
        if (!couponIsActive(appliedCoupon)) throw new CheckoutError(400, "Your coupon is no longer active.");
        const discount = couponDiscount(appliedCoupon, subtotal);
        if (discount === null) throw new CheckoutError(400, "Your coupon does not apply to this order total.");
        if (appliedCoupon.perUserLimit !== null && session) {
          const redemptions = await tx.couponRedemption.count({ where: { couponId: appliedCoupon.id, userId: session.user.id } });
          if (redemptions >= appliedCoupon.perUserLimit) throw new CheckoutError(400, "You have already used this coupon the maximum number of times.");
        }
        discountTotal = discount;
      }

      const deliveryFee = input.fulfillmentType === "DELIVERY" ? (subtotal >= 6000 ? 0 : 350) : 0;
      const total = subtotal + deliveryFee - discountTotal;
      const initialStatus = input.paymentMethod === "CASH_ON_DELIVERY" ? "CONFIRMED" : "PENDING_PAYMENT";
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber(), idempotencyKey: input.idempotencyKey, email: input.email, phone: input.phone, fulfillmentType: input.fulfillmentType, scheduledFor: input.scheduledFor, deliverySlot: input.deliverySlot,
          ...(session ? { user: { connect: { id: session.user.id } } } : {}), status: initialStatus, subtotal, discountTotal, deliveryFee, total, notes: input.notes,
          cart: { connect: { id: freshCart.id } },
          items: { create: freshCart.items.map((item) => { const unitPrice = resolvedCustomizationUnitPrice({ basePrice: item.variant.price, customizations: item.customizations, definitions: item.variant.cake.customizations }); return { cakeName: item.variant.cake.name, variantName: item.variant.name, sku: item.variant.sku, quantity: item.quantity, unitPrice, lineTotal: unitPrice * item.quantity, customizations: item.customizations as Prisma.InputJsonValue | undefined, cake: { connect: { id: item.variant.cakeId } }, variant: { connect: { id: item.variantId } } }; }) },
          addresses: { create: { type: "SHIPPING", recipientName: input.name, line1: input.fulfillmentType === "DELIVERY" ? input.address! : "Bite & Bloom studio collection", city: "Nairobi", country: "KE", phone: input.phone } },
          payments: { create: { provider: input.paymentMethod === "MPESA" ? "MPESA" : "CASH", amount: total, currency: freshCart.currency, status: "PENDING", metadata: { method: input.paymentMethod === "MPESA" ? "stk_push" : "cash_on_delivery" } } },
          statusHistory: { create: { toStatus: initialStatus, reason: input.paymentMethod === "MPESA" ? "Order submitted" : "Cash on delivery order submitted" } },
          notifications: { create: [{ channel: "EMAIL", template: "ORDER_RECEIVED", recipient: input.email, payload: { scheduledFor: input.scheduledFor.toISOString(), deliverySlot: input.deliverySlot } }, { channel: "WHATSAPP", template: "ORDER_RECEIVED", recipient: input.phone, payload: { scheduledFor: input.scheduledFor.toISOString(), deliverySlot: input.deliverySlot } }] },
        }, include: { payments: true },
      });

      if (appliedCoupon) {
        if (appliedCoupon.usageLimit !== null) {
          const claimed = await tx.coupon.updateMany({ where: { id: appliedCoupon.id, usageCount: { lt: appliedCoupon.usageLimit } }, data: { usageCount: { increment: 1 } } });
          if (claimed.count !== 1) throw new CheckoutError(400, "This coupon has reached its usage limit.");
        } else {
          await tx.coupon.update({ where: { id: appliedCoupon.id }, data: { usageCount: { increment: 1 } } });
        }
        await tx.couponRedemption.create({ data: { couponId: appliedCoupon.id, orderId: order.id, ...(session ? { userId: session.user.id } : {}), amount: discountTotal } });
      }

      for (const item of freshCart.items) {
        const inventory = item.variant.inventoryItem!;
        await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityReserved: { increment: item.quantity } } });
        await tx.inventoryReservation.create({ data: { inventoryItemId: inventory.id, orderId: order.id, quantity: item.quantity, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
        await tx.stockMovement.create({ data: { inventoryItemId: inventory.id, type: "RESERVATION", quantityDelta: item.quantity, quantityBefore: inventory.quantityReserved, quantityAfter: inventory.quantityReserved + item.quantity, referenceType: "ORDER", referenceId: order.id, reason: "Checkout inventory reservation" } });
      }

      await tx.cart.update({ where: { id: freshCart.id }, data: { status: "CONVERTED" } });
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (input.paymentMethod === "CASH_ON_DELIVERY") {
      return apiSuccess({ orderNumber: order.orderNumber, status: order.status, total: Number(order.total), currency: order.currency, paymentInitiated: false, paymentMethod: "CASH_ON_DELIVERY", paymentMessage: "Cash on delivery selected. We will confirm your order on WhatsApp." }, { status: 201 });
    }

    try {
      const payment = order.payments[0];
      const stkPush = await initiateStkPush({ orderNumber: order.orderNumber, amount: Number(order.total), phone: input.phone, description: `Bite & Bloom ${order.orderNumber}` });
      await getPrismaClient().payment.update({ where: { id: payment.id }, data: { providerReference: stkPush.checkoutRequestId, metadata: mergePaymentMetadata(payment.metadata, { merchantRequestId: stkPush.merchantRequestId, checkoutRequestId: stkPush.checkoutRequestId }) } });
      return apiSuccess({ orderNumber: order.orderNumber, status: order.status, total: Number(order.total), currency: order.currency, paymentInitiated: true, paymentMethod: "MPESA", paymentMessage: stkPush.customerMessage }, { status: 201 });
    } catch {
      return apiSuccess({ orderNumber: order.orderNumber, status: order.status, total: Number(order.total), currency: order.currency, paymentInitiated: false, paymentMethod: "MPESA", paymentMessage: "Your order is reserved, but the M-Pesa prompt could not be started. Please contact support to complete payment." }, { status: 202 });
    }
  } catch (error) {
    if (error instanceof CheckoutError) return apiError("VALIDATION_ERROR", error.message, error.status);
    if (input.idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await getPrismaClient().order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { orderNumber: true, status: true, total: true, currency: true } }).catch(() => null);
      if (existing) return apiSuccess({ orderNumber: existing.orderNumber, status: existing.status, total: Number(existing.total), currency: existing.currency, paymentInitiated: false, paymentMessage: "This checkout was already received." });
    }
    return apiError("DATABASE_UNAVAILABLE", "Unable to place the order right now. Please try again.", 503);
  }
}
