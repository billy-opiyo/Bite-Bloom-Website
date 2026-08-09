import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: { orderNumber: string } }) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to view this order.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  const orderNumber = params.orderNumber.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,80}$/.test(orderNumber)) return apiError("VALIDATION_ERROR", "Invalid order number.", 400);
  try {
    const order = await getPrismaClient().order.findFirst({
      where: { orderNumber, userId: session.user.id },
      include: {
        items: { select: { cakeName: true, variantName: true, sku: true, quantity: true, unitPrice: true, lineTotal: true, customizations: true } },
        addresses: { where: { type: "SHIPPING" }, select: { recipientName: true, line1: true, line2: true, city: true, region: true, postalCode: true, country: true, phone: true } },
        payments: { select: { provider: true, status: true, amount: true, currency: true, paidAt: true } },
        shipment: { include: { events: { orderBy: { occurredAt: "asc" } } } },
        statusHistory: { select: { fromStatus: true, toStatus: true, reason: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) return apiError("VALIDATION_ERROR", "Order not found.", 404);
    return apiSuccess({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      notes: order.notes,
      placedAt: order.placedAt,
      items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
      deliveryAddress: order.addresses[0] ?? null,
      payments: order.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
      shipment: order.shipment ? { status: order.shipment.status, courier: order.shipment.courier, trackingNumber: order.shipment.trackingNumber, estimatedAt: order.shipment.estimatedAt, dispatchedAt: order.shipment.dispatchedAt, deliveredAt: order.shipment.deliveredAt, events: order.shipment.events.map((event) => ({ status: event.status, description: event.description, occurredAt: event.occurredAt })) } : null,
      statusHistory: order.statusHistory.map((entry) => ({ fromStatus: entry.fromStatus, toStatus: entry.toStatus, reason: entry.reason, occurredAt: entry.createdAt })),
    });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Your order details are temporarily unavailable.", 503);
  }
}
