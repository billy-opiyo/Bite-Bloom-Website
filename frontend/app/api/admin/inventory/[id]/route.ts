import { InventoryStatus, Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseAdjustment(value: unknown): { quantityDelta: number; reason: string } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.quantityDelta !== "number" || !Number.isInteger(input.quantityDelta) || input.quantityDelta === 0 || Math.abs(input.quantityDelta) > 100_000 || typeof input.reason !== "string" || input.reason.trim().length < 3 || input.reason.trim().length > 500) return null;
  return { quantityDelta: input.quantityDelta, reason: input.reason.trim() };
}

function statusFor(quantityOnHand: number, quantityReserved: number, reorderLevel: number): InventoryStatus {
  const available = quantityOnHand - quantityReserved;
  if (available <= 0) return "OUT_OF_STOCK";
  return available <= reorderLevel ? "LOW_STOCK" : "IN_STOCK";
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Inventory is not configured yet.", 503);
  const input = parseAdjustment(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Provide a non-zero whole-number adjustment and reason.", 400);
  try {
    const item = await getPrismaClient().$transaction(async (tx) => {
      const current = await tx.inventoryItem.findUnique({ where: { id: params.id } });
      if (!current) throw new Error("NOT_FOUND");
      const nextQuantity = current.quantityOnHand + input.quantityDelta;
      if (nextQuantity < current.quantityReserved || nextQuantity < 0) throw new Error("INSUFFICIENT_STOCK");
      const status = statusFor(nextQuantity, current.quantityReserved, current.reorderLevel);
      const updated = await tx.inventoryItem.update({ where: { id: current.id }, data: { quantityOnHand: nextQuantity, status } });
      await tx.stockMovement.create({ data: { inventoryItemId: current.id, actorId: session.user.id, type: "ADJUSTMENT", quantityDelta: input.quantityDelta, quantityBefore: current.quantityOnHand, quantityAfter: nextQuantity, reason: input.reason } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: item.id, quantityOnHand: item.quantityOnHand, quantityReserved: item.quantityReserved, available: item.quantityOnHand - item.quantityReserved, status: item.status });
  } catch (error) {
    const message = error instanceof Error && error.message === "INSUFFICIENT_STOCK" ? "Stock cannot be reduced below active reservations." : "Inventory item not found or could not be adjusted.";
    return apiError("VALIDATION_ERROR", message, 409);
  }
}
