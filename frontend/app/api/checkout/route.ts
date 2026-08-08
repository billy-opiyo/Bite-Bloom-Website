import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { getGuestCart } from "../../../lib/server/cart";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { hasMpesaConfiguration, initiateStkPush, normalizeMpesaPhone } from "../../../lib/server/mpesa";
import { getPrismaClient } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckoutInput = { name: string; email: string; phone: string; fulfillmentType: "DELIVERY" | "PICKUP"; address?: string; notes?: string };

class CheckoutError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function parseCheckout(value: unknown): CheckoutInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const text = (item: unknown, min: number, max: number): item is string => typeof item === "string" && item.trim().length >= min && item.trim().length <= max;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fulfillmentType = input.fulfillmentType === "DELIVERY" || input.fulfillmentType === "PICKUP" ? input.fulfillmentType : null;
  if (!text(input.name, 2, 120) || !/^\S+@\S+\.\S+$/.test(email) || !text(input.phone, 7, 32) || !fulfillmentType || (fulfillmentType === "DELIVERY" && !text(input.address, 5, 500))) return null;
  return { name: input.name.trim(), email, phone: input.phone.trim(), fulfillmentType, ...(text(input.address, 1, 500) ? { address: input.address.trim() } : {}), ...(text(input.notes, 1, 2000) ? { notes: input.notes.trim() } : {}) };
}

function orderNumber(): string {
  return `BB-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Checkout is not configured yet.", 503);
  const input = parseCheckout(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Check your contact and delivery details.", 400);
  if (!hasMpesaConfiguration()) return apiError("CONFIGURATION_ERROR", "M-Pesa payments are not configured yet.", 503);
  if (!normalizeMpesaPhone(input.phone)) return apiError("VALIDATION_ERROR", "Enter a valid Kenyan M-Pesa phone number.", 400);

  try {
    const { cart } = await getGuestCart(request);
    const order = await getPrismaClient().$transaction(async (tx) => {
      const freshCart = await tx.cart.findFirst({
        where: { id: cart.id, status: "ACTIVE" },
        include: { items: { include: { variant: { include: { cake: true, inventoryItem: true } } }, orderBy: { createdAt: "asc" } } },
      });
      if (!freshCart || freshCart.items.length === 0) throw new CheckoutError(400, "Your cart is empty or has already been checked out.");

      let subtotal = 0;
      for (const item of freshCart.items) {
        const inventory = item.variant.inventoryItem;
        if (!item.variant.isActive || item.variant.cake.status !== "ACTIVE" || !inventory) throw new CheckoutError(400, `${item.variant.cake.name} is no longer available.`);
        const available = inventory.quantityOnHand - inventory.quantityReserved;
        if (available < item.quantity) throw new CheckoutError(409, `${item.variant.cake.name} does not have enough stock.`);
        subtotal += Number(item.variant.price) * item.quantity;
      }

      const deliveryFee = input.fulfillmentType === "DELIVERY" ? (subtotal >= 6000 ? 0 : 350) : 0;
      const total = subtotal + deliveryFee;
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber(), email: input.email, phone: input.phone, fulfillmentType: input.fulfillmentType,
          subtotal, deliveryFee, total, notes: input.notes,
          cart: { connect: { id: freshCart.id } },
          items: { create: freshCart.items.map((item) => ({ cakeName: item.variant.cake.name, variantName: item.variant.name, sku: item.variant.sku, quantity: item.quantity, unitPrice: item.variant.price, lineTotal: Number(item.variant.price) * item.quantity, customizations: item.customizations as Prisma.InputJsonValue | undefined, cake: { connect: { id: item.variant.cakeId } }, variant: { connect: { id: item.variantId } } })) },
          addresses: { create: { type: "SHIPPING", recipientName: input.name, line1: input.fulfillmentType === "DELIVERY" ? input.address! : "Bite & Bloom studio collection", city: "Nairobi", country: "KE", phone: input.phone } },
          payments: { create: { provider: "MPESA", amount: total, currency: freshCart.currency, status: "PENDING", metadata: { method: "stk_push" } } },
          statusHistory: { create: { toStatus: "PENDING_PAYMENT", reason: "Order submitted" } },
        }, include: { payments: true },
      });

      for (const item of freshCart.items) {
        const inventory = item.variant.inventoryItem!;
        await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityReserved: { increment: item.quantity } } });
        await tx.inventoryReservation.create({ data: { inventoryItemId: inventory.id, orderId: order.id, quantity: item.quantity, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
        await tx.stockMovement.create({ data: { inventoryItemId: inventory.id, type: "RESERVATION", quantityDelta: item.quantity, quantityBefore: inventory.quantityReserved, quantityAfter: inventory.quantityReserved + item.quantity, referenceType: "ORDER", referenceId: order.id, reason: "Checkout inventory reservation" } });
      }

      await tx.cart.update({ where: { id: freshCart.id }, data: { status: "CONVERTED" } });
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    try {
      const payment = order.payments[0];
      const stkPush = await initiateStkPush({ orderNumber: order.orderNumber, amount: Number(order.total), phone: input.phone, description: `Bite & Bloom ${order.orderNumber}` });
      await getPrismaClient().payment.update({ where: { id: payment.id }, data: { providerReference: stkPush.checkoutRequestId, metadata: { merchantRequestId: stkPush.merchantRequestId, checkoutRequestId: stkPush.checkoutRequestId } } });
      return apiSuccess({ orderNumber: order.orderNumber, status: order.status, total: Number(order.total), currency: order.currency, paymentInitiated: true, paymentMessage: stkPush.customerMessage }, { status: 201 });
    } catch {
      return apiSuccess({ orderNumber: order.orderNumber, status: order.status, total: Number(order.total), currency: order.currency, paymentInitiated: false, paymentMessage: "Your order is reserved, but the M-Pesa prompt could not be started. Please contact support to complete payment." }, { status: 202 });
    }
  } catch (error) {
    if (error instanceof CheckoutError) return apiError("VALIDATION_ERROR", error.message, error.status);
    return apiError("DATABASE_UNAVAILABLE", "Unable to place the order right now. Please try again.", 503);
  }
}
