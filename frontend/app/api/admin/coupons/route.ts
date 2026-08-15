import { DiscountType } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { parsePromotionInput } from "../../../../lib/shared/promotion-input";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("catalog:write"))) return apiError("UNAUTHORIZED", "Catalogue write permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Promotions are not configured yet.", 503);
  try {
    const coupons = await getPrismaClient().coupon.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return apiSuccess(coupons.map((coupon) => ({ id: coupon.id, code: coupon.code, description: coupon.description, discountType: coupon.discountType, value: Number(coupon.value), minimumOrder: coupon.minimumOrder === null ? null : Number(coupon.minimumOrder), maximumDiscount: coupon.maximumDiscount === null ? null : Number(coupon.maximumDiscount), usageLimit: coupon.usageLimit, usageCount: coupon.usageCount, perUserLimit: coupon.perUserLimit, startsAt: coupon.startsAt, endsAt: coupon.endsAt, isActive: coupon.isActive })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Promotions are temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession("catalog:write");
  if (!session) return apiError("UNAUTHORIZED", "Catalogue write permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Promotions are not configured yet.", 503);
  const input = parsePromotionInput(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Check the promotion code, value, dates, and limits.", 400);
  try {
    const coupon = await getPrismaClient().$transaction(async (tx) => {
      const coupon = await tx.coupon.create({ data: { code: input.code, ...(input.description ? { description: input.description } : {}), discountType: input.discountType as DiscountType, value: input.value, minimumOrder: input.minimumOrder, maximumDiscount: input.maximumDiscount, usageLimit: input.usageLimit, perUserLimit: input.perUserLimit, startsAt: input.startsAt, endsAt: input.endsAt, isActive: input.isActive } });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "PROMOTION_CREATED", entityType: "Coupon", entityId: coupon.id, changes: { code: coupon.code, discountType: coupon.discountType, value: Number(coupon.value), isActive: coupon.isActive } } });
      return coupon;
    });
    return apiSuccess({ id: coupon.id, code: coupon.code }, { status: 201 });
  } catch {
    return apiError("VALIDATION_ERROR", "That promotion code may already exist or could not be saved.", 409);
  }
}
