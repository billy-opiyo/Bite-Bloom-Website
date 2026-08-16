import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { parseContactMessage } from "../../../lib/server/public-forms";
import { getPrismaClient } from "../../../lib/server/prisma";
import { enforceRateLimit } from "../../../lib/server/rate-limit";
import { isJsonContentType } from "../../../lib/shared/request-limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "contact", 5, 10 * 60 * 1000);
  if (limited) return limited;
  if (!isJsonContentType(request.headers.get("content-type"))) return apiError("VALIDATION_ERROR", "A JSON request body is required.", 415);
  const input = parseContactMessage(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Enter your name, email, and message.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Contact messages are not configured yet.", 503);

  try {
    await getPrismaClient().contactMessage.create({ data: input });
    return apiSuccess({ accepted: true }, { status: 201 });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "We could not send your message right now.", 503);
  }
}
