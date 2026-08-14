export type CatalogVariant = { id: string; name: string; sku: string; price: number; weightGrams: number | null; available: number; isAvailable: boolean };
export type CatalogCategory = { name: string; slug: string };
export type CatalogCake = { id: string; name: string; slug: string; description: string | null; ingredients: string | null; allergens: string | null; price: number; currency: string; isFeatured: boolean; categories: CatalogCategory[]; images: Array<{ url: string | null; altText: string | null }>; variants: CatalogVariant[] };
export type CatalogCustomization = { key: string; label: string; type: string; isRequired: boolean; priceDelta: number; values: Array<{ label: string; value: string; priceDelta: number }> };
export type CatalogCakeDetail = CatalogCake & { fullDescription: string | null; preparationTime: number | null; customizations: CatalogCustomization[] };
