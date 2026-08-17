import { ReviewStatus } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await getAdminSession("review:moderate"))) return apiError("UNAUTHORIZED", "Review moderation permission is required.", 401);
  const rawStatus = request.nextUrl.searchParams.get("status");
  if (rawStatus && !Object.values(ReviewStatus).includes(rawStatus as ReviewStatus)) return apiError("VALIDATION_ERROR", "Choose a valid review status.", 400);
  const status = rawStatus as ReviewStatus | null;
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Reviews are not configured yet.", 503);
  try {
    const reviews = await getPrismaClient().review.findMany({
      where: status ? { status } : undefined,
      include: { cake: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } }, order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return apiSuccess(reviews.map((review) => ({ id: review.id, cake: review.cake, authorName: review.authorName ?? review.user?.name ?? "Verified customer", authorEmail: review.user?.email ?? null, orderNumber: review.order?.orderNumber ?? null, rating: review.rating, title: review.title, body: review.body, status: review.status, createdAt: review.createdAt, updatedAt: review.updatedAt })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Reviews are temporarily unavailable.", 503);
  }
}
