import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("role:manage"))) return apiError("UNAUTHORIZED", "Role management permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Roles are not configured yet.", 503);
  try {
    const roles = await getPrismaClient().role.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
      include: { permissions: { orderBy: { permission: { key: "asc" } }, include: { permission: { select: { key: true, resource: true, action: true, description: true } } } } },
    });
    return apiSuccess(roles.map((role) => ({ key: role.key, name: role.name, description: role.description, permissions: role.permissions.map(({ permission }) => permission) })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Role permissions are temporarily unavailable.", 503);
  }
}
