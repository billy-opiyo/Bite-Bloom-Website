export const catalogSorts = ["featured", "name", "price-low", "price-high"] as const;
export type CatalogSort = (typeof catalogSorts)[number];
export type CatalogQuery = { page: number; pageSize: number; query?: string; category?: string; sort: CatalogSort };

function boundedInteger(value: string | null, fallback: number, maximum: number): number | null {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= maximum ? parsed : null;
}

export function parseCatalogQuery(searchParams: URLSearchParams): CatalogQuery | null {
  const page = boundedInteger(searchParams.get("page"), 1, 10000);
  const pageSize = boundedInteger(searchParams.get("pageSize"), 48, 100);
  const rawQuery = searchParams.get("q")?.trim() || undefined;
  const query = rawQuery && rawQuery.length <= 80 ? rawQuery : rawQuery ? null : undefined;
  const rawCategory = searchParams.get("category")?.trim() || undefined;
  const category = rawCategory && /^[a-z0-9-]{1,80}$/.test(rawCategory) ? rawCategory : rawCategory ? null : undefined;
  const rawSort = searchParams.get("sort") || "featured";
  const sort = catalogSorts.includes(rawSort as CatalogSort) ? rawSort as CatalogSort : null;
  if (page === null || pageSize === null || query === null || category === null || sort === null) return null;
  return { page, pageSize, ...(query ? { query } : {}), ...(category ? { category } : {}), sort };
}
