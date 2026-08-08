import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getPublishedCake } from "../../../../lib/server/catalog";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  if (!hasDatabaseConfiguration()) {
    return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  }

  try {
    const cake = await getPublishedCake(params.slug);
    if (!cake) return apiError("VALIDATION_ERROR", "Cake not found.", 404);
    return apiSuccess(cake);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The catalogue is temporarily unavailable.", 503);
  }
}
