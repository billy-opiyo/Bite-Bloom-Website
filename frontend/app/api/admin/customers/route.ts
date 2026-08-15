import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession("customer:read"))) return apiError("UNAUTHORIZED", "Customer read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Customers are not configured yet.", 503);
  const page = positiveInteger(request.nextUrl.searchParams.get("page"), 1, 10_000);
  const pageSize = positiveInteger(request.nextUrl.searchParams.get("pageSize"), 25, 100);
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || undefined;

  try {
    const prisma = getPrismaClient();
    const groupedOrders = await prisma.order.groupBy({
      by: ["email"],
      where: query ? { OR: [{ email: { contains: query, mode: "insensitive" } }, { addresses: { some: { recipientName: { contains: query, mode: "insensitive" } } } }] } : undefined,
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    const hasMore = groupedOrders.length > pageSize;
    const rows = groupedOrders.slice(0, pageSize);
    const emails = rows.map((row) => row.email);
    const [users, recentOrders] = await Promise.all([
      prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true, name: true, phone: true, createdAt: true, status: true } }),
      prisma.order.findMany({ where: { email: { in: emails } }, include: { addresses: { where: { type: "SHIPPING" }, select: { recipientName: true }, take: 1 } }, orderBy: { createdAt: "desc" } }),
    ]);
    const usersByEmail = new Map(users.flatMap((user) => user.email ? [[user.email.toLowerCase(), user] as const] : []));
    const recentOrderByEmail = new Map<string, typeof recentOrders[number]>();
    for (const order of recentOrders) if (!recentOrderByEmail.has(order.email.toLowerCase())) recentOrderByEmail.set(order.email.toLowerCase(), order);

    return apiSuccess({
      customers: rows.map((row) => {
        const email = row.email.toLowerCase();
        const user = usersByEmail.get(email);
        const recentOrder = recentOrderByEmail.get(email);
        return {
          email: row.email,
          name: user?.name ?? recentOrder?.addresses[0]?.recipientName ?? null,
          phone: user?.phone ?? recentOrder?.phone ?? null,
          accountId: user?.id ?? null,
          accountStatus: user?.status ?? null,
          orderCount: row._count.id,
          totalSpent: Number(row._sum.total ?? 0),
          lastOrderAt: row._max.createdAt,
        };
      }),
      page,
      pageSize,
      hasMore,
    });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Customers are temporarily unavailable.", 503);
  }
}
