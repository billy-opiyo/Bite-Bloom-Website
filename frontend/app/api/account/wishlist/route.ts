import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cakeIdFrom(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const cakeId = (value as Record<string, unknown>).cakeId;
  return typeof cakeId === "string" && cakeId.trim().length > 0 && cakeId.length <= 128 ? cakeId.trim() : null;
}

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to view your wishlist.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Wishlists are not configured yet.", 503);
  try {
    const wishlist = await getPrismaClient().wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { cake: { include: { categories: { include: { category: { select: { name: true, slug: true } } } }, variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 } } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    const items = wishlist?.items.map((item) => ({
      cakeId: item.cakeId,
      addedAt: item.createdAt,
      cake: {
        name: item.cake.name,
        slug: item.cake.slug,
        description: item.cake.shortDescription,
        price: Number(item.cake.basePrice),
        currency: item.cake.currency,
        isAvailable: item.cake.status === "ACTIVE" && item.cake.variants.length > 0,
        categories: item.cake.categories.map(({ category }) => category),
        variant: item.cake.variants[0] ? { id: item.cake.variants[0].id, name: item.cake.variants[0].name, price: Number(item.cake.variants[0].price) } : null,
      },
    })) ?? [];
    return apiSuccess(items);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Your wishlist is temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to save a cake.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Wishlists are not configured yet.", 503);
  const cakeId = cakeIdFrom(await request.json().catch(() => null));
  if (!cakeId) return apiError("VALIDATION_ERROR", "Choose a cake to save.", 400);
  try {
    const prisma = getPrismaClient();
    const item = await prisma.$transaction(async (tx) => {
      const cake = await tx.cake.findFirst({ where: { id: cakeId, status: "ACTIVE" }, select: { id: true } });
      if (!cake) return null;
      const wishlist = await tx.wishlist.upsert({ where: { userId: session.user.id }, update: {}, create: { userId: session.user.id } });
      return tx.wishlistItem.upsert({ where: { wishlistId_cakeId: { wishlistId: wishlist.id, cakeId: cake.id } }, update: {}, create: { wishlistId: wishlist.id, cakeId: cake.id }, select: { cakeId: true, createdAt: true } });
    });
    if (!item) return apiError("VALIDATION_ERROR", "Cake not found or unavailable.", 404);
    return apiSuccess({ ...item, saved: true }, { status: 201 });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to save that cake right now.", 503);
  }
}
