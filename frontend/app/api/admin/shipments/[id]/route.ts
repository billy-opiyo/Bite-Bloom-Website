import { ShipmentStatus, Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { transitionOrder } from "../../../../../lib/server/order-state";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseUpdate(value: unknown): { status?: ShipmentStatus; description?: string; courier?: string | null; trackingNumber?: string | null; estimatedAt?: Date | null } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (input.status !== undefined && (typeof input.status !== "string" || !Object.values(ShipmentStatus).includes(input.status as ShipmentStatus))) return null;
  if (input.description !== undefined && (typeof input.description !== "string" || input.description.length > 500)) return null;
  if (input.courier !== undefined && input.courier !== null && (typeof input.courier !== "string" || input.courier.trim().length > 120)) return null;
  if (input.trackingNumber !== undefined && input.trackingNumber !== null && (typeof input.trackingNumber !== "string" || input.trackingNumber.trim().length > 120)) return null;
  let estimatedAt: Date | null | undefined;
  if (input.estimatedAt !== undefined) {
    if (input.estimatedAt === null) estimatedAt = null;
    else if (typeof input.estimatedAt === "string") { estimatedAt = new Date(input.estimatedAt); if (Number.isNaN(estimatedAt.valueOf())) return null; }
    else return null;
  }
  const hasUpdate = input.status !== undefined || input.description !== undefined || input.courier !== undefined || input.trackingNumber !== undefined || input.estimatedAt !== undefined;
  if (!hasUpdate) return null;
  return { ...(typeof input.status === "string" ? { status: input.status as ShipmentStatus } : {}), ...(typeof input.description === "string" && input.description.trim() ? { description: input.description.trim() } : {}), ...(input.courier !== undefined ? { courier: typeof input.courier === "string" && input.courier.trim() ? input.courier.trim() : null } : {}), ...(input.trackingNumber !== undefined ? { trackingNumber: typeof input.trackingNumber === "string" && input.trackingNumber.trim() ? input.trackingNumber.trim() : null } : {}), ...(estimatedAt !== undefined ? { estimatedAt } : {}) };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession("shipment:update");
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Shipments are not configured yet.", 503);
  const input = parseUpdate(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid shipment update.", 400);
  try {
    const shipment = await getPrismaClient().$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({ where: { id: params.id }, include: { order: { select: { status: true } } } });
      if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");
      if (input.status === "DELIVERED") {
        if (shipment.order.status !== "OUT_FOR_DELIVERY") throw new Error("INVALID_DELIVERY");
        await transitionOrder(tx, { orderId: shipment.orderId, toStatus: "DELIVERED", actorId: session.user.id, reason: input.description ?? "Delivery confirmed" });
      }
      return tx.shipment.update({ where: { id: shipment.id }, data: { ...(input.status ? { status: input.status } : {}), ...(input.courier !== undefined ? { courier: input.courier } : {}), ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber } : {}), ...(input.estimatedAt !== undefined ? { estimatedAt: input.estimatedAt } : {}), ...(input.status === "DELIVERED" ? { deliveredAt: new Date() } : {}), ...(input.status ? { events: { create: { status: input.status, description: input.description } } } : {}) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: shipment.id, status: shipment.status });
  } catch {
    return apiError("VALIDATION_ERROR", "This shipment update is not allowed.", 409);
  }
}
