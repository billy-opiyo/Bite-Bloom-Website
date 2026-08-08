import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Inventory is not configured yet.", 503);
  try {
    const items = await getPrismaClient().inventoryItem.findMany({
      include: { variant: { include: { cake: { select: { name: true, slug: true } } } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
    return apiSuccess(items.map((item) => ({ id: item.id, variantId: item.variantId, cakeName: item.variant.cake.name, cakeSlug: item.variant.cake.slug, variantName: item.variant.name, sku: item.variant.sku, quantityOnHand: item.quantityOnHand, quantityReserved: item.quantityReserved, available: item.quantityOnHand - item.quantityReserved, reorderLevel: item.reorderLevel, status: item.status, updatedAt: item.updatedAt })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Inventory is temporarily unavailable.", 503);
  }
}
