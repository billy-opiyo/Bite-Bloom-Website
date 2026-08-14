import "server-only";

import { Prisma } from "@prisma/client";

import { getPrismaClient } from "./prisma";

const publishedCakeInclude = {
  categories: { include: { category: true } },
  images: { where: { mediaAsset: { status: "READY", visibility: "PUBLIC" } }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], include: { mediaAsset: { select: { objectKey: true } } } },
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" },
    include: { inventoryItem: { select: { quantityOnHand: true, quantityReserved: true, status: true } } },
  },
} satisfies Prisma.CakeInclude;

const publishedCakeDetailInclude = {
  ...publishedCakeInclude,
  customizations: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { values: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  },
} satisfies Prisma.CakeInclude;

type PublishedCake = Prisma.CakeGetPayload<{ include: typeof publishedCakeInclude }>;
type PublishedCakeDetail = Prisma.CakeGetPayload<{ include: typeof publishedCakeDetailInclude }>;

export type CatalogCake = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ingredients: string | null;
  allergens: string | null;
  price: number;
  currency: string;
  isFeatured: boolean;
  categories: Array<{ name: string; slug: string }>;
  images: Array<{ url: string | null; altText: string | null }>;
  variants: Array<{ id: string; name: string; sku: string; price: number; weightGrams: number | null; available: number; isAvailable: boolean }>;
};

export type CatalogCakeDetail = CatalogCake & {
  fullDescription: string | null;
  preparationTime: number | null;
  customizations: Array<{
    key: string;
    label: string;
    type: string;
    isRequired: boolean;
    priceDelta: number;
    values: Array<{ label: string; value: string; priceDelta: number }>;
  }>;
};

function serializeCake(cake: PublishedCake): CatalogCake {
  const mediaBaseUrl = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  return {
    id: cake.id,
    name: cake.name,
    slug: cake.slug,
    description: cake.shortDescription,
    ingredients: cake.ingredients,
    allergens: cake.allergens,
    price: Number(cake.basePrice),
    currency: cake.currency,
    isFeatured: cake.isFeatured,
    categories: cake.categories.map(({ category }) => ({ name: category.name, slug: category.slug })),
    images: cake.images.map((image) => ({ url: mediaBaseUrl ? `${mediaBaseUrl}/${image.mediaAsset.objectKey.split("/").map(encodeURIComponent).join("/")}` : null, altText: image.altText })),
    variants: cake.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: Number(variant.price),
      weightGrams: variant.weightGrams,
      available: Math.max(0, (variant.inventoryItem?.quantityOnHand ?? 0) - (variant.inventoryItem?.quantityReserved ?? 0)),
      isAvailable: Boolean(variant.inventoryItem && variant.inventoryItem.quantityOnHand > variant.inventoryItem.quantityReserved && variant.inventoryItem.status !== "OUT_OF_STOCK"),
    })),
  };
}

export async function listPublishedCakes(): Promise<CatalogCake[]> {
  const cakes = await getPrismaClient().cake.findMany({
    where: { status: "ACTIVE" },
    include: publishedCakeInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return cakes.map(serializeCake);
}

export async function getPublishedCake(slug: string): Promise<CatalogCakeDetail | null> {
  const cake = await getPrismaClient().cake.findFirst({
    where: { slug, status: "ACTIVE" },
    include: publishedCakeDetailInclude,
  });
  if (!cake) return null;

  return {
    ...serializeCake(cake),
    fullDescription: cake.description,
    preparationTime: cake.preparationTime,
    customizations: cake.customizations.map((customization) => ({
      key: customization.key,
      label: customization.label,
      type: customization.type,
      isRequired: customization.isRequired,
      priceDelta: Number(customization.priceDelta),
      values: customization.values.map((value) => ({
        label: value.label,
        value: value.value,
        priceDelta: Number(value.priceDelta),
      })),
    })),
  };
}
