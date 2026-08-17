import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../../lib/server/env";
import { transitionOrder } from "../../../../../../lib/server/order-state";
import { getPrismaClient } from "../../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_: NextRequest, { params }: { params: { orderNumber: string } }) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to cancel this order.", 401);
  const orderNumber = params.orderNumber.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,80}$/.test(orderNumber)) return apiError("VALIDATION_ERROR", "Invalid order number.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Order cancellation is not configured yet.", 503);
  try {
    const prisma = getPrismaClient();
    const order = await prisma.order.findFirst({ where: { orderNumber, userId: session.user.id }, select: { id: true, status: true, paymentStatus: true } });
    if (!order) return apiError("VALIDATION_ERROR", "Order not found.", 404);
    if (order.paymentStatus === "PAID") return apiError("VALIDATION_ERROR", "Paid orders require support review before cancellation so any refund is handled safely.", 409);
    if (order.status !== "PENDING_PAYMENT" && order.status !== "CONFIRMED") return apiError("VALIDATION_ERROR", "This order can no longer be cancelled online.", 409);
    const cancelled = await prisma.$transaction((tx) => transitionOrder(tx, { orderId: order.id, toStatus: "CANCELLED", actorId: session.user.id, reason: "Customer cancellation" }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ orderNumber, status: cancelled.status, message: "Your order has been cancelled." });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TRANSITION") return apiError("VALIDATION_ERROR", "This order can no longer be cancelled online.", 409);
    return apiError("DATABASE_UNAVAILABLE", "Unable to cancel this order right now.", 503);
  }
}
