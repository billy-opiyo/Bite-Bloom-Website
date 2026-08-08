import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { listPublishedCakes } from "../../../lib/server/catalog";
import { hasDatabaseConfiguration } from "../../../lib/server/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Returns active cake catalogue data without exposing internal inventory or costs. */
export async function GET() {
  if (!hasDatabaseConfiguration()) {
    return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  }

  try {
    return apiSuccess(await listPublishedCakes());
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The catalogue is temporarily unavailable.", 503);
  }
}
