import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../../lib/server/env";
import { transitionOrder } from "../../../../../../lib/server/order-state";
import { getPrismaClient } from "../../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseShipment(value: unknown): { courier: string; trackingNumber?: string; estimatedAt?: Date } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.courier !== "string" || input.courier.trim().length < 2 || input.courier.trim().length > 120) return null;
  const estimatedAt = typeof input.estimatedAt === "string" ? new Date(input.estimatedAt) : undefined;
  if (estimatedAt && Number.isNaN(estimatedAt.getTime())) return null;
  if (input.trackingNumber !== undefined && (typeof input.trackingNumber !== "string" || input.trackingNumber.trim().length > 120)) return null;
  return { courier: input.courier.trim(), ...(typeof input.trackingNumber === "string" && input.trackingNumber.trim() ? { trackingNumber: input.trackingNumber.trim() } : {}), ...(estimatedAt ? { estimatedAt } : {}) };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession("shipment:update");
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  const input = parseShipment(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid shipment details.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Shipments are not configured yet.", 503);
  try {
    const shipment = await getPrismaClient().$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: params.id }, select: { id: true, status: true, shipment: true } });
      if (!order || order.status !== "READY_FOR_DISPATCH" || order.shipment) throw new Error("SHIPMENT_NOT_ALLOWED");
      const shipment = await tx.shipment.create({ data: { orderId: order.id, status: "DISPATCHED", dispatchedAt: new Date(), ...input } });
      await tx.shipmentEvent.create({ data: { shipmentId: shipment.id, status: "DISPATCHED", description: `Dispatched with ${input.courier}` } });
      await transitionOrder(tx, { orderId: order.id, toStatus: "OUT_FOR_DELIVERY", actorId: session.user.id, reason: "Shipment dispatched" });
      return shipment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: shipment.id, status: shipment.status, courier: shipment.courier }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SHIPMENT_NOT_ALLOWED") return apiError("VALIDATION_ERROR", "This order cannot be dispatched yet or already has a shipment.", 409);
    return apiError("DATABASE_UNAVAILABLE", "Unable to create the shipment right now.", 503);
  }
}
