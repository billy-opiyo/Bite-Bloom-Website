export type CakeSortValue = "featured" | "price-low" | "price-high" | "name";

export default function CakeSort({ value, onChange }: { value: CakeSortValue; onChange: (value: CakeSortValue) => void }) {
  return <label className="catalog-sort">Sort by<select value={value} onChange={(event) => onChange(event.target.value as CakeSortValue)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label>;
}
