import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_: NextRequest, { params }: { params: { cakeId: string } }) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to update your wishlist.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Wishlists are not configured yet.", 503);
  if (!params.cakeId || params.cakeId.length > 128) return apiError("VALIDATION_ERROR", "Invalid cake.", 400);
  try {
    const prisma = getPrismaClient();
    const wishlist = await prisma.wishlist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!wishlist) return apiSuccess({ cakeId: params.cakeId, deleted: false });
    const deleted = await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, cakeId: params.cakeId } });
    return apiSuccess({ cakeId: params.cakeId, deleted: deleted.count > 0 });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to update your wishlist right now.", 503);
  }
}
