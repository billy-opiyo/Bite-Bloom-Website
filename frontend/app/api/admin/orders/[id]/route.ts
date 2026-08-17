import { OrderStatus, Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { transitionOrder } from "../../../../../lib/server/order-state";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdminSession("order:read"))) return apiError("UNAUTHORIZED", "Order read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  try {
    const order = await getPrismaClient().order.findFirst({
      where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
      include: {
        items: true,
        addresses: true,
        payments: { orderBy: { createdAt: "desc" }, take: 3, select: { provider: true, status: true, amount: true, paidAt: true, providerReference: true } },
      },
    });
    if (!order) return apiError("NOT_FOUND", "Order not found.", 404);
    return apiSuccess({ id: order.id, orderNumber: order.orderNumber, email: order.email, phone: order.phone, status: order.status, paymentStatus: order.paymentStatus, fulfillmentType: order.fulfillmentType, currency: order.currency, subtotal: Number(order.subtotal), discountTotal: Number(order.discountTotal), deliveryFee: Number(order.deliveryFee), taxTotal: Number(order.taxTotal), total: Number(order.total), notes: order.notes, scheduledFor: order.scheduledFor, deliverySlot: order.deliverySlot, placedAt: order.placedAt, items: order.items.map((item) => ({ cakeName: item.cakeName, variantName: item.variantName, sku: item.sku, quantity: item.quantity, unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal), customizations: item.customizations })), addresses: order.addresses, payments: order.payments.map((payment) => ({ provider: payment.provider, status: payment.status, amount: Number(payment.amount), paidAt: payment.paidAt, providerReference: payment.providerReference })) });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Order details are temporarily unavailable.", 503);
  }
}

function parseUpdate(value: unknown): { status: OrderStatus; reason?: string } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.status !== "string" || !Object.values(OrderStatus).includes(input.status as OrderStatus)) return null;
  if (input.reason !== undefined && (typeof input.reason !== "string" || input.reason.length > 1000)) return null;
  return { status: input.status as OrderStatus, ...(typeof input.reason === "string" && input.reason.trim() ? { reason: input.reason.trim() } : {}) };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession("order:update");
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  const input = parseUpdate(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid order status update.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  try {
    const order = await getPrismaClient().$transaction((tx) => transitionOrder(tx, { orderId: params.id, toStatus: input.status, actorId: session.user.id, reason: input.reason }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: order.id, status: order.status, paymentStatus: order.paymentStatus });
  } catch (error) {
    const message = error instanceof Error && error.message === "INVALID_TRANSITION" ? "That order status change is not allowed." : "Order not found or could not be updated.";
    return apiError("VALIDATION_ERROR", message, 409);
  }
}
