import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { getPrismaClient } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Promotions are not configured yet.", 503);
  const now = new Date();
  try {
    const coupons = await getPrismaClient().coupon.findMany({ where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { endsAt: "asc" }, take: 20, select: { code: true, description: true, discountType: true, value: true, minimumOrder: true, maximumDiscount: true, startsAt: true, endsAt: true } });
    return apiSuccess(coupons.map((coupon) => ({ ...coupon, value: Number(coupon.value), minimumOrder: coupon.minimumOrder === null ? null : Number(coupon.minimumOrder), maximumDiscount: coupon.maximumDiscount === null ? null : Number(coupon.maximumDiscount) })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Promotions are temporarily unavailable.", 503);
  }
}
