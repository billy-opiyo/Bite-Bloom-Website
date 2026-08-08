import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NewVariant = { name: string; sku: string; price: number; weightGrams?: number };
type NewCake = { name: string; slug: string; description?: string; basePrice: number; categoryIds: string[]; variants: NewVariant[] };

function parseNewCake(value: unknown): NewCake | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const isText = (item: unknown, max: number): item is string => typeof item === "string" && item.trim().length > 0 && item.trim().length <= max;
  const isPrice = (item: unknown): item is number => typeof item === "number" && Number.isFinite(item) && item > 0 && item <= 1_000_000;
  const { name, slug, description, basePrice, categoryIds: rawCategoryIds, variants: rawVariants } = input;
  if (!isText(name, 120) || !isText(slug, 120) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !isPrice(basePrice) || !Array.isArray(rawCategoryIds) || rawCategoryIds.length === 0 || !Array.isArray(rawVariants) || rawVariants.length === 0) return null;
  const categoryIds: string[] = [];
  for (const categoryId of rawCategoryIds) {
    if (!isText(categoryId, 64)) return null;
    if (!categoryIds.includes(categoryId)) categoryIds.push(categoryId);
  }
  const variants: NewVariant[] = [];
  for (const rawVariant of rawVariants) {
    if (!rawVariant || typeof rawVariant !== "object") return null;
    const variant = rawVariant as Record<string, unknown>;
    const weightGrams = variant.weightGrams;
    if (!isText(variant.name, 80) || !isText(variant.sku, 64) || !isPrice(variant.price) || (weightGrams !== undefined && (typeof weightGrams !== "number" || !Number.isInteger(weightGrams) || weightGrams <= 0))) return null;
    variants.push({ name: variant.name.trim(), sku: variant.sku.trim().toUpperCase(), price: variant.price, ...(typeof weightGrams === "number" ? { weightGrams } : {}) });
  }
  return { name: name.trim(), slug, description: isText(description, 4000) ? description.trim() : undefined, basePrice, categoryIds, variants };
}

export async function GET() {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  try {
    const [cakes, categories] = await Promise.all([
      getPrismaClient().cake.findMany({ include: { categories: { include: { category: true } }, variants: { include: { inventoryItem: true } } }, orderBy: { createdAt: "desc" } }),
      getPrismaClient().category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return apiSuccess({ cakes: cakes.map((cake) => ({ id: cake.id, name: cake.name, slug: cake.slug, status: cake.status, basePrice: Number(cake.basePrice), categories: cake.categories.map(({ category }) => ({ id: category.id, name: category.name })), variants: cake.variants.map((variant) => ({ id: variant.id, name: variant.name, sku: variant.sku, price: Number(variant.price), isActive: variant.isActive, stock: variant.inventoryItem?.quantityOnHand ?? 0 })) })), categories });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The catalogue is temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  const input = parseNewCake(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid cake data.", 400);
  try {
    const categoryCount = await getPrismaClient().category.count({ where: { id: { in: input.categoryIds }, isActive: true } });
    if (categoryCount !== input.categoryIds.length) return apiError("VALIDATION_ERROR", "Select valid active categories.", 400);
    const cake = await getPrismaClient().cake.create({ data: { name: input.name, slug: input.slug, shortDescription: input.description, description: input.description, basePrice: input.basePrice, categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) }, variants: { create: input.variants.map((variant, index) => ({ ...variant, isDefault: index === 0 })) } }, include: { variants: true } });
    return apiSuccess({ id: cake.id, slug: cake.slug, variants: cake.variants.map((variant) => ({ id: variant.id, sku: variant.sku })) }, { status: 201 });
  } catch {
    return apiError("INTERNAL_ERROR", "Unable to create the cake. Its slug or SKU may already exist.", 409);
  }
}
