import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseDate(value: string | null, endOfDay: boolean): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+03:00`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function dayKey(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Analytics are not configured yet.", 503);
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 29);
  defaultFrom.setHours(0, 0, 0, 0);
  const from = parseDate(request.nextUrl.searchParams.get("from"), false) ?? defaultFrom;
  const to = parseDate(request.nextUrl.searchParams.get("to"), true) ?? now;
  if (from > to || to.valueOf() - from.valueOf() > 366 * 24 * 60 * 60 * 1000) return apiError("VALIDATION_ERROR", "Choose a date range of up to 366 days.", 400);

  try {
    const orders = await getPrismaClient().order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "FAILED"] } },
      select: { email: true, total: true, status: true, paymentStatus: true, createdAt: true, items: { select: { cakeName: true, quantity: true } } },
      orderBy: { createdAt: "asc" },
      take: 50_000,
    });

    const daily = new Map<string, { orders: number; grossValue: number; paidValue: number }>();
    const customerOrderCounts = new Map<string, number>();
    const cakeTotals = new Map<string, number>();
    let grossOrderValue = 0;
    let paidRevenue = 0;
    let paidOrders = 0;
    for (const order of orders) {
      const total = Number(order.total);
      grossOrderValue += total;
      const isPaid = order.paymentStatus === "PAID";
      if (isPaid) { paidRevenue += total; paidOrders += 1; }
      const key = dayKey(order.createdAt);
      const current = daily.get(key) ?? { orders: 0, grossValue: 0, paidValue: 0 };
      current.orders += 1;
      current.grossValue += total;
      if (isPaid) current.paidValue += total;
      daily.set(key, current);
      customerOrderCounts.set(order.email, (customerOrderCounts.get(order.email) ?? 0) + 1);
      for (const item of order.items) cakeTotals.set(item.cakeName, (cakeTotals.get(item.cakeName) ?? 0) + item.quantity);
    }
    const repeatCustomers = Array.from(customerOrderCounts.values()).filter((count) => count > 1).length;
    const customerCount = customerOrderCounts.size;
    return apiSuccess({
      from,
      to,
      currency: "KES",
      summary: {
        orderCount: orders.length,
        paidOrderCount: paidOrders,
        grossOrderValue,
        paidRevenue,
        averageOrderValue: orders.length ? Math.round(grossOrderValue / orders.length) : 0,
        customerCount,
        repeatCustomerCount: repeatCustomers,
        repeatCustomerRate: customerCount ? Math.round((repeatCustomers / customerCount) * 10_000) / 100 : 0,
      },
      daily: Array.from(daily.entries()).map(([date, values]) => ({ date, ...values })),
      topCakes: Array.from(cakeTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, quantity]) => ({ name, quantity })),
    });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Analytics are temporarily unavailable.", 503);
  }
}
