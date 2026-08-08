import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { getPrismaClient } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DatabaseHealth = "not_configured" | "healthy" | "unavailable";

/**
 * A non-sensitive readiness check for deployment probes. It intentionally
 * returns no database URL, credentials, or internal error details.
 */
export async function GET() {
  let database: DatabaseHealth = "not_configured";

  if (hasDatabaseConfiguration()) {
    try {
      await getPrismaClient().$queryRaw`SELECT 1`;
      database = "healthy";
    } catch {
      database = "unavailable";
    }
  }

  const payload = {
    status: database === "healthy" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: { database },
  };

  if (database === "unavailable") {
    return apiError("DATABASE_UNAVAILABLE", "The database is temporarily unavailable.", 503);
  }

  if (database === "not_configured") {
    return apiSuccess(payload, { status: 503 });
  }

  return apiSuccess(payload);
}
