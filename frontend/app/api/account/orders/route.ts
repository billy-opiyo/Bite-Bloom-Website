import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to view your orders.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  try {
    const orders = await getPrismaClient().order.findMany({
      where: { userId: session.user.id },
      include: { items: { select: { cakeName: true, variantName: true, quantity: true, lineTotal: true } }, shipment: { include: { events: { orderBy: { occurredAt: "asc" } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return apiSuccess(orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentType: order.fulfillmentType,
      total: Number(order.total),
      currency: order.currency,
      placedAt: order.placedAt,
      items: order.items.map((item) => ({ ...item, lineTotal: Number(item.lineTotal) })),
      shipment: order.shipment ? { status: order.shipment.status, courier: order.shipment.courier, trackingNumber: order.shipment.trackingNumber, estimatedAt: order.shipment.estimatedAt, events: order.shipment.events.map((event) => ({ status: event.status, description: event.description, occurredAt: event.occurredAt })) } : null,
    })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Your orders are temporarily unavailable.", 503);
  }
}
