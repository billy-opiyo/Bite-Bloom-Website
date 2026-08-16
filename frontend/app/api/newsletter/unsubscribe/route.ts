import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { enforceRateLimit } from "../../../../lib/server/rate-limit";
import { getPrismaClient } from "../../../../lib/server/prisma";
import { parseEmailAddress } from "../../../../lib/server/public-forms";
import { isJsonContentType } from "../../../../lib/shared/request-limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  const limited = enforceRateLimit(request, "newsletter-unsubscribe", 5, 10 * 60 * 1000);
  if (limited) return limited;
  if (!isJsonContentType(request.headers.get("content-type"))) return apiError("VALIDATION_ERROR", "A JSON request body is required.", 415);
  const email = parseEmailAddress(((await request.json().catch(() => null) as { email?: unknown } | null)?.email));
  if (!email) return apiError("VALIDATION_ERROR", "Enter a valid email address.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Newsletter subscriptions are not configured yet.", 503);
  try {
    await getPrismaClient().newsletterSubscriber.updateMany({ where: { email }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } });
    return apiSuccess({ accepted: true, message: "If that address was subscribed, it has been removed from newsletter updates." });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "We could not update your subscription right now.", 503);
  }
}
