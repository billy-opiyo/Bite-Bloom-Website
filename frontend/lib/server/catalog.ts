import "server-only";

import { Prisma } from "@prisma/client";

import { getPrismaClient } from "./prisma";

const publishedCakeInclude = {
  categories: { include: { category: true } },
  variants: { where: { isActive: true }, orderBy: { price: "asc" } },
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
  price: number;
  currency: string;
  isFeatured: boolean;
  categories: Array<{ name: string; slug: string }>;
  variants: Array<{ id: string; name: string; sku: string; price: number; weightGrams: number | null }>;
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
  return {
    id: cake.id,
    name: cake.name,
    slug: cake.slug,
    description: cake.shortDescription,
    price: Number(cake.basePrice),
    currency: cake.currency,
    isFeatured: cake.isFeatured,
    categories: cake.categories.map(({ category }) => ({ name: category.name, slug: category.slug })),
    variants: cake.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: Number(variant.price),
      weightGrams: variant.weightGrams,
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
