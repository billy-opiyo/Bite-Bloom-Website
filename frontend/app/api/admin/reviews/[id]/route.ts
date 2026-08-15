import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ModerationStatus = "PUBLISHED" | "REJECTED";

function parseUpdate(value: unknown): ModerationStatus | null {
  if (!value || typeof value !== "object") return null;
  const status = (value as Record<string, unknown>).status;
  return status === "PUBLISHED" || status === "REJECTED" ? status : null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession("review:moderate");
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Reviews are not configured yet.", 503);
  const status = parseUpdate(await request.json().catch(() => null));
  if (!status) return apiError("VALIDATION_ERROR", "Choose PUBLISHED or REJECTED.", 400);
  try {
    const prisma = getPrismaClient();
    const review = await prisma.$transaction(async (tx) => {
      const current = await tx.review.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
      if (!current) return null;
      const updated = await tx.review.update({ where: { id: current.id }, data: { status }, select: { id: true, status: true, updatedAt: true } });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "REVIEW_MODERATED", entityType: "Review", entityId: current.id, changes: { from: current.status, to: status } } });
      return updated;
    });
    if (!review) return apiError("VALIDATION_ERROR", "Review not found.", 404);
    return apiSuccess(review);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to moderate that review right now.", 503);
  }
}
