export default function CakeSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="catalog-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search cakes</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search cakes" type="search" /></label>;
}
