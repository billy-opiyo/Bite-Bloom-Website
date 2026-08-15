import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { listPublishedCakesPage } from "../../../lib/server/catalog";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { parseCatalogQuery } from "../../../lib/shared/catalog-query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Returns active cake catalogue data without exposing internal inventory or costs. */
export async function GET(request: Request) {
  if (!hasDatabaseConfiguration()) {
    return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  }

  const filters = parseCatalogQuery(new URL(request.url).searchParams);
  if (!filters) {
    return apiError("VALIDATION_ERROR", "Invalid catalogue filters.", 400);
  }

  try {
    return apiSuccess(await listPublishedCakesPage(filters));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The catalogue is temporarily unavailable.", 503);
  }
}
