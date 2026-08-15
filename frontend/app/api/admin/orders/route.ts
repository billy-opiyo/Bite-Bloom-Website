import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("order:read"))) return apiError("UNAUTHORIZED", "Order read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  try {
    const orders = await getPrismaClient().order.findMany({
      include: { items: { select: { cakeName: true, variantName: true, quantity: true } }, shipment: { select: { courier: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return apiSuccess(orders.map((order) => ({ id: order.id, orderNumber: order.orderNumber, customer: order.email, phone: order.phone, status: order.status, paymentStatus: order.paymentStatus, fulfillmentType: order.fulfillmentType, total: Number(order.total), placedAt: order.placedAt, courier: order.shipment?.courier ?? null, items: order.items })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Orders are temporarily unavailable.", 503);
  }
}
