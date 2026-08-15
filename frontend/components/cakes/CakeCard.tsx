import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";
import type { CatalogCake } from "../../types/cake";
import { whatsappLink } from "../../lib/site-config";
import WishlistButton from "./WishlistButton";

function money(amount: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }

export default function CakeCard({ cake }: { cake: CatalogCake }) {
  const category = cake.categories[0]?.name ?? "Cake";
  const variant = cake.variants[0];
  const image = cake.images.find((item) => item.url);
  return <article className="cake-card catalog-cake-card"><div className="cake-image-wrap catalog-cake-placeholder"><Link href={`/cakes/${cake.slug}`} aria-label={`View ${cake.name}`}>{image?.url ? <img src={image.url} alt={image.altText || cake.name} loading="lazy" /> : <span aria-hidden="true">✦</span>}</Link><WishlistButton cakeId={cake.id} cakeName={cake.name} />{cake.isFeatured && <b className="cake-tag">Featured</b>}</div><div className="cake-card-body"><div className="cake-meta"><span>{category}</span><span>{cake.variants.length} size{cake.variants.length === 1 ? "" : "s"}</span></div><h3><Link href={`/cakes/${cake.slug}`}>{cake.name}</Link></h3><p className="catalog-cake-description">{cake.description || "Made fresh for your celebration."}</p><div className="cake-price-row"><strong>{variant ? money(variant.price, cake.currency) : money(cake.price, cake.currency)}</strong><span className="catalog-card-actions"><Link className="catalog-view-link" href={`/cakes/${cake.slug}`}>View cake <span aria-hidden="true">↗</span></Link><a className="catalog-whatsapp-link" href={whatsappLink(`Hi Bite & Bloom, I would like to order the ${cake.name} (${cake.slug}).`)} target="_blank" rel="noreferrer" aria-label={`Order ${cake.name} on WhatsApp`}><FaWhatsapp aria-hidden="true" /></a></span></div></div></article>;
}
