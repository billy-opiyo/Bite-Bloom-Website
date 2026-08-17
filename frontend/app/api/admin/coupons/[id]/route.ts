import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession("catalog:write");
  if (!session) return apiError("UNAUTHORIZED", "Catalogue write permission is required.", 401);
  const input = await request.json().catch(() => null) as { isActive?: unknown } | null;
  if (typeof input?.isActive !== "boolean") return apiError("VALIDATION_ERROR", "A boolean active value is required.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Promotions are not configured yet.", 503);
  try {
    const coupon = await getPrismaClient().$transaction(async (tx) => {
      const coupon = await tx.coupon.update({ where: { id: params.id }, data: { isActive: input.isActive } });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "PROMOTION_STATUS_CHANGED", entityType: "Coupon", entityId: coupon.id, changes: { code: coupon.code, isActive: coupon.isActive } } });
      return coupon;
    });
    return apiSuccess({ id: coupon.id, isActive: coupon.isActive });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to update this promotion.", 503);
  }
}
