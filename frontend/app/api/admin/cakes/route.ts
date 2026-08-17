import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";
import { parseAdminCakeInput } from "../../../../lib/shared/admin-cake-input";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("catalog:read"))) return apiError("UNAUTHORIZED", "Catalogue read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  try {
    const [cakes, categories] = await Promise.all([
      getPrismaClient().cake.findMany({ include: { categories: { include: { category: true } }, variants: { include: { inventoryItem: true } } }, orderBy: { createdAt: "desc" } }),
      getPrismaClient().category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return apiSuccess({ cakes: cakes.map((cake) => ({ id: cake.id, name: cake.name, slug: cake.slug, status: cake.status, ingredients: cake.ingredients, allergens: cake.allergens, basePrice: Number(cake.basePrice), categories: cake.categories.map(({ category }) => ({ id: category.id, name: category.name })), variants: cake.variants.map((variant) => ({ id: variant.id, name: variant.name, sku: variant.sku, price: Number(variant.price), isActive: variant.isActive, stock: variant.inventoryItem?.quantityOnHand ?? 0 })) })), categories });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The catalogue is temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession("catalog:write"))) return apiError("UNAUTHORIZED", "Catalogue write permission is required.", 401);
  const input = parseAdminCakeInput(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid cake data.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  try {
    const categoryCount = await getPrismaClient().category.count({ where: { id: { in: input.categoryIds }, isActive: true } });
    if (categoryCount !== input.categoryIds.length) return apiError("VALIDATION_ERROR", "Select valid active categories.", 400);
    const cake = await getPrismaClient().cake.create({ data: { name: input.name, slug: input.slug, shortDescription: input.description, description: input.description, ingredients: input.ingredients, allergens: input.allergens, basePrice: input.basePrice, categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) }, variants: { create: input.variants.map((variant, index) => ({ ...variant, isDefault: index === 0, isActive: input.isAvailable })) } }, include: { variants: true } });
    return apiSuccess({ id: cake.id, slug: cake.slug, variants: cake.variants.map((variant) => ({ id: variant.id, sku: variant.sku })) }, { status: 201 });
  } catch {
    return apiError("INTERNAL_ERROR", "Unable to create the cake. Its slug or SKU may already exist.", 409);
  }
}
