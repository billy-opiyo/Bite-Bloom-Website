export type AdminCakeVariantInput = { name: string; sku: string; price: number; weightGrams?: number };

export type AdminCakeInput = {
  name: string;
  slug: string;
  description?: string;
  ingredients?: string;
  allergens?: string;
  basePrice: number;
  categoryIds: string[];
  variants: AdminCakeVariantInput[];
  isAvailable: boolean;
};

export function parseAdminCakeInput(value: unknown): AdminCakeInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const isText = (item: unknown, max: number): item is string => typeof item === "string" && item.trim().length > 0 && item.trim().length <= max;
  const isPrice = (item: unknown): item is number => typeof item === "number" && Number.isFinite(item) && item > 0 && item <= 1_000_000;
  const { name, slug, description, ingredients, allergens, basePrice, categoryIds: rawCategoryIds, variants: rawVariants } = input;
  if (!isText(name, 120) || !isText(slug, 120) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !isPrice(basePrice) || !Array.isArray(rawCategoryIds) || rawCategoryIds.length === 0 || !Array.isArray(rawVariants) || rawVariants.length === 0 || (input.isAvailable !== undefined && typeof input.isAvailable !== "boolean")) return null;

  const categoryIds: string[] = [];
  for (const categoryId of rawCategoryIds) {
    if (!isText(categoryId, 64)) return null;
    if (!categoryIds.includes(categoryId)) categoryIds.push(categoryId);
  }

  const variants: AdminCakeVariantInput[] = [];
  for (const rawVariant of rawVariants) {
    if (!rawVariant || typeof rawVariant !== "object") return null;
    const variant = rawVariant as Record<string, unknown>;
    const weightGrams = variant.weightGrams;
    if (!isText(variant.name, 80) || !isText(variant.sku, 64) || !isPrice(variant.price) || (weightGrams !== undefined && (typeof weightGrams !== "number" || !Number.isInteger(weightGrams) || weightGrams <= 0))) return null;
    variants.push({ name: variant.name.trim(), sku: variant.sku.trim().toUpperCase(), price: variant.price, ...(typeof weightGrams === "number" ? { weightGrams } : {}) });
  }

  return { name: name.trim(), slug, description: isText(description, 4000) ? description.trim() : undefined, ingredients: isText(ingredients, 4000) ? ingredients.trim() : undefined, allergens: isText(allergens, 2000) ? allergens.trim() : undefined, basePrice, categoryIds, variants, isAvailable: input.isAvailable === undefined ? true : input.isAvailable as boolean };
}
