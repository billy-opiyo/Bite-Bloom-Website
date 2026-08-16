import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("audit:read"))) return apiError("UNAUTHORIZED", "Audit read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Audit records are not configured yet.", 503);
  try {
    const records = await getPrismaClient().auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, actorId: true, action: true, entityType: true, entityId: true, createdAt: true } });
    return apiSuccess(records);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Audit records are temporarily unavailable.", 503);
  }
}
