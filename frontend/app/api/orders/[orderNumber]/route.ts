import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";
import { enforceRateLimit } from "../../../../lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  const rateLimitResponse = enforceRateLimit(request, "order-tracking", 30, 10 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;
  const orderNumber = params.orderNumber.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,80}$/.test(orderNumber)) return apiError("VALIDATION_ERROR", "A valid order number is required to track this order.", 400);
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return apiError("VALIDATION_ERROR", "An email address is required to track this order.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Order tracking is not configured yet.", 503);

  try {
    const order = await getPrismaClient().order.findFirst({
      where: { orderNumber, email },
      include: {
        shipment: { include: { events: { orderBy: { occurredAt: "asc" } } } },
        statusHistory: { orderBy: { createdAt: "asc" }, select: { toStatus: true, reason: true, createdAt: true } },
      },
    });
    if (!order) return apiError("VALIDATION_ERROR", "Order not found.", 404);

    return apiSuccess({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentType: order.fulfillmentType,
      scheduledFor: order.scheduledFor,
      deliverySlot: order.deliverySlot,
      placedAt: order.placedAt,
      estimatedAt: order.shipment?.estimatedAt ?? null,
      shipmentStatus: order.shipment?.status ?? null,
      events: order.shipment?.events.map((event) => ({ status: event.status, description: event.description, occurredAt: event.occurredAt })) ?? [],
      statusHistory: order.statusHistory.map((entry) => ({ status: entry.toStatus, reason: entry.reason, occurredAt: entry.createdAt })),
    });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Order tracking is temporarily unavailable.", 503);
  }
}
