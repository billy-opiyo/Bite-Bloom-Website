import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("order:read"))) return apiError("UNAUTHORIZED", "Order read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Shipments are not configured yet.", 503);
  try {
    const shipments = await getPrismaClient().shipment.findMany({
      include: { order: { select: { orderNumber: true, email: true, status: true, fulfillmentType: true } }, events: { orderBy: { occurredAt: "desc" }, take: 10 } },
      orderBy: { updatedAt: "desc" }, take: 100,
    });
    return apiSuccess(shipments.map((shipment) => ({ id: shipment.id, orderId: shipment.orderId, orderNumber: shipment.order.orderNumber, customer: shipment.order.email, orderStatus: shipment.order.status, fulfillmentType: shipment.order.fulfillmentType, status: shipment.status, courier: shipment.courier, trackingNumber: shipment.trackingNumber, estimatedAt: shipment.estimatedAt, events: shipment.events.map((event) => ({ status: event.status, description: event.description, occurredAt: event.occurredAt })) })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Shipments are temporarily unavailable.", 503);
  }
}
