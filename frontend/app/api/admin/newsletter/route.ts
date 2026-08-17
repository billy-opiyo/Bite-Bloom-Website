import { NewsletterSubscriberStatus } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await getAdminSession("customer:read"))) return apiError("UNAUTHORIZED", "Customer read permission is required.", 401);
  const status = request.nextUrl.searchParams.get("status");
  if (status && !Object.values(NewsletterSubscriberStatus).includes(status as NewsletterSubscriberStatus)) return apiError("VALIDATION_ERROR", "Choose a valid newsletter status.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Newsletter subscribers are not configured yet.", 503);
  try {
    const subscribers = await getPrismaClient().newsletterSubscriber.findMany({ where: status ? { status: status as NewsletterSubscriberStatus } : undefined, orderBy: { subscribedAt: "desc" }, take: 100, select: { id: true, email: true, status: true, subscribedAt: true, unsubscribedAt: true } });
    return apiSuccess(subscribers);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Newsletter subscribers are temporarily unavailable.", 503);
  }
}
