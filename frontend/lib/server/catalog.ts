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
  customizations: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { values: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
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
  customizations: Array<{ key: string; label: string; type: string; isRequired: boolean; priceDelta: number; values: Array<{ label: string; value: string; priceDelta: number }> }>;
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

export type CatalogListOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  sort?: "featured" | "name" | "price-low" | "price-high";
};

export type CatalogPage = { items: CatalogCake[]; page: number; pageSize: number; total: number; hasMore: boolean };

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
    customizations: cake.customizations.map((customization) => ({
      key: customization.key,
      label: customization.label,
      type: customization.type,
      isRequired: customization.isRequired,
      priceDelta: Number(customization.priceDelta),
      values: customization.values.map((value) => ({ label: value.label, value: value.value, priceDelta: Number(value.priceDelta) })),
    })),
  };
}

export async function listPublishedCakes(): Promise<CatalogCake[]> {
  return (await listPublishedCakesPage({ page: 1, pageSize: 100 })).items;
}

export async function listPublishedCakesPage(options: CatalogListOptions = {}): Promise<CatalogPage> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize ?? 48)));
  const query = options.query?.trim();
  const where: Prisma.CakeWhereInput = {
    status: "ACTIVE",
    ...(options.category ? { categories: { some: { category: { slug: options.category } } } } : {}),
    ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }, { shortDescription: { contains: query, mode: "insensitive" } }] } : {}),
  };
  const orderBy: Prisma.CakeOrderByWithRelationInput[] = options.sort === "name"
    ? [{ name: "asc" }]
    : options.sort === "price-low"
      ? [{ basePrice: "asc" }, { name: "asc" }]
      : options.sort === "price-high"
        ? [{ basePrice: "desc" }, { name: "asc" }]
        : [{ isFeatured: "desc" }, { createdAt: "desc" }];
  const [total, cakes] = await Promise.all([
    getPrismaClient().cake.count({ where }),
    getPrismaClient().cake.findMany({ where, include: publishedCakeInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { items: cakes.map(serializeCake), page, pageSize, total, hasMore: page * pageSize < total };
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
