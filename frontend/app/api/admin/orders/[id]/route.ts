import { OrderStatus, Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { transitionOrder } from "../../../../../lib/server/order-state";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseUpdate(value: unknown): { status: OrderStatus; reason?: string } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.status !== "string" || !Object.values(OrderStatus).includes(input.status as OrderStatus)) return null;
  if (input.reason !== undefined && (typeof input.reason !== "string" || input.reason.length > 1000)) return null;
  return { status: input.status as OrderStatus, ...(typeof input.reason === "string" && input.reason.trim() ? { reason: input.reason.trim() } : {}) };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  const input = parseUpdate(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid order status update.", 400);
  try {
    const order = await getPrismaClient().$transaction((tx) => transitionOrder(tx, { orderId: params.id, toStatus: input.status, actorId: session.user.id, reason: input.reason }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: order.id, status: order.status, paymentStatus: order.paymentStatus });
  } catch (error) {
    const message = error instanceof Error && error.message === "INVALID_TRANSITION" ? "That order status change is not allowed." : "Order not found or could not be updated.";
    return apiError("VALIDATION_ERROR", message, 409);
  }
}
