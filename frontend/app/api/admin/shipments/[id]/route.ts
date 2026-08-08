import { ShipmentStatus, Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { transitionOrder } from "../../../../../lib/server/order-state";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseUpdate(value: unknown): { status: ShipmentStatus; description?: string } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.status !== "string" || !Object.values(ShipmentStatus).includes(input.status as ShipmentStatus)) return null;
  if (input.description !== undefined && (typeof input.description !== "string" || input.description.length > 500)) return null;
  return { status: input.status as ShipmentStatus, ...(typeof input.description === "string" && input.description.trim() ? { description: input.description.trim() } : {}) };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
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
      return tx.shipment.update({ where: { id: shipment.id }, data: { status: input.status, ...(input.status === "DELIVERED" ? { deliveredAt: new Date() } : {}), events: { create: { status: input.status, description: input.description } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: shipment.id, status: shipment.status });
  } catch {
    return apiError("VALIDATION_ERROR", "This shipment update is not allowed.", 409);
  }
}
