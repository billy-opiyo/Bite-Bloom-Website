import type { CatalogCategory } from "../../types/cake";

export default function CakeFilters({ categories, value, onChange }: { categories: CatalogCategory[]; value: string; onChange: (value: string) => void }) {
  return <div className="catalog-filters" role="group" aria-label="Cake categories"><button aria-pressed={value === "all"} className={value === "all" ? "active" : ""} onClick={() => onChange("all")} type="button">All cakes</button>{categories.map((category) => <button aria-pressed={value === category.slug} className={value === category.slug ? "active" : ""} key={category.slug} onClick={() => onChange(category.slug)} type="button">{category.name}</button>)}</div>;
}
