import { timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !token) return false;
  const secretBuffer = Buffer.from(secret);
  const tokenBuffer = Buffer.from(token);
  return secretBuffer.length === tokenBuffer.length && timingSafeEqual(secretBuffer, tokenBuffer);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return apiError("UNAUTHORIZED", "Scheduler authorization is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Inventory is not configured yet.", 503);

  try {
    const expired = await getPrismaClient().inventoryReservation.findMany({ where: { status: "ACTIVE", expiresAt: { lt: new Date() } }, select: { id: true }, take: 100, orderBy: { expiresAt: "asc" } });
    let released = 0;
    for (const candidate of expired) {
      const didRelease = await getPrismaClient().$transaction(async (tx) => {
        const reservation = await tx.inventoryReservation.findUnique({ where: { id: candidate.id }, include: { inventoryItem: true } });
        if (!reservation || reservation.status !== "ACTIVE" || reservation.expiresAt >= new Date()) return false;
        const inventory = reservation.inventoryItem;
        await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityReserved: { decrement: reservation.quantity } } });
        await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: "EXPIRED", releasedAt: new Date() } });
        await tx.stockMovement.create({ data: { inventoryItemId: inventory.id, type: "RELEASE", quantityDelta: -reservation.quantity, quantityBefore: inventory.quantityReserved, quantityAfter: inventory.quantityReserved - reservation.quantity, referenceType: reservation.orderId ? "ORDER" : "CART", referenceId: reservation.orderId ?? reservation.cartId, reason: "Expired inventory reservation" } });
        return true;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      if (didRelease) released += 1;
    }
    return apiSuccess({ scanned: expired.length, released });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Expired reservations could not be processed.", 503);
  }
}
