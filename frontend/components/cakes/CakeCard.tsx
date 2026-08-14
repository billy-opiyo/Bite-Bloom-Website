import Link from "next/link";
import type { CatalogCake } from "../../types/cake";

function money(amount: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }

export default function CakeCard({ cake }: { cake: CatalogCake }) {
  const category = cake.categories[0]?.name ?? "Cake";
  const variant = cake.variants[0];
  return <article className="cake-card catalog-cake-card"><Link className="cake-image-wrap catalog-cake-placeholder" href={`/cakes/${cake.slug}`} aria-label={`View ${cake.name}`}><span aria-hidden="true">✦</span>{cake.isFeatured && <b className="cake-tag">Featured</b>}</Link><div className="cake-card-body"><div className="cake-meta"><span>{category}</span><span>{cake.variants.length} size{cake.variants.length === 1 ? "" : "s"}</span></div><h3><Link href={`/cakes/${cake.slug}`}>{cake.name}</Link></h3><p className="catalog-cake-description">{cake.description || "Made fresh for your celebration."}</p><div className="cake-price-row"><strong>{variant ? money(variant.price, cake.currency) : money(cake.price, cake.currency)}</strong><Link className="catalog-view-link" href={`/cakes/${cake.slug}`}>View cake <span aria-hidden="true">↗</span></Link></div></div></article>;
}
