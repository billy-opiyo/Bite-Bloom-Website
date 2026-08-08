import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function customerEmail(value: string): string | null {
  try {
    const email = decodeURIComponent(value).trim().toLowerCase();
    return /^\S+@\S+\.\S+$/.test(email) && email.length <= 254 ? email : null;
  } catch {
    return null;
  }
}

export async function GET(_: NextRequest, { params }: { params: { email: string } }) {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Customers are not configured yet.", 503);
  const email = customerEmail(params.email);
  if (!email) return apiError("VALIDATION_ERROR", "Invalid customer email.", 400);
  try {
    const prisma = getPrismaClient();
    const [user, orders] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true, loyaltyAccount: { select: { pointsBalance: true, lifetimePoints: true } } } }),
      prisma.order.findMany({
        where: { email },
        include: { items: { select: { cakeName: true, variantName: true, quantity: true, lineTotal: true } }, shipment: { select: { status: true, courier: true, trackingNumber: true } }, addresses: { where: { type: "SHIPPING" }, select: { recipientName: true }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    if (!user && orders.length === 0) return apiError("VALIDATION_ERROR", "Customer not found.", 404);
    const latestOrder = orders[0];
    return apiSuccess({
      customer: {
        email,
        name: user?.name ?? latestOrder?.addresses[0]?.recipientName ?? null,
        phone: user?.phone ?? latestOrder?.phone ?? null,
        accountId: user?.id ?? null,
        accountStatus: user?.status ?? null,
        joinedAt: user?.createdAt ?? latestOrder?.createdAt ?? null,
        loyalty: user?.loyaltyAccount ? { pointsBalance: user.loyaltyAccount.pointsBalance, lifetimePoints: user.loyaltyAccount.lifetimePoints } : null,
        orderCount: orders.length,
        totalSpent: orders.reduce((total, order) => total + Number(order.total), 0),
      },
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentType: order.fulfillmentType,
        total: Number(order.total),
        placedAt: order.placedAt,
        shipment: order.shipment,
        items: order.items.map((item) => ({ ...item, lineTotal: Number(item.lineTotal) })),
      })),
    });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Customer details are temporarily unavailable.", 503);
  }
}
