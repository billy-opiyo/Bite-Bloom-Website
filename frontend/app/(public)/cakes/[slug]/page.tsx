"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import PublicFloatingActions from "../../../../components/layout/PublicFloatingActions";
import type { CatalogCakeDetail } from "../../../../types/cake";

type ApiResponse = { data?: CatalogCakeDetail; error?: { message?: string } };
function money(amount: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
function productJsonLd(cake: CatalogCakeDetail, images: CatalogCakeDetail["images"]) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: cake.name,
    description: cake.fullDescription || cake.description || `Freshly baked ${cake.name} from Bite & Bloom.`,
    brand: { "@type": "Brand", name: "Bite & Bloom" },
    ...(images.length > 0 ? { image: images.map((image) => image.url).filter((url): url is string => Boolean(url)) } : {}),
    offers: cake.variants.map((variant) => ({
      "@type": "Offer",
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      priceCurrency: cake.currency,
      availability: `https://schema.org/${variant.isAvailable ? "InStock" : "OutOfStock"}`,
      url: `/cakes/${cake.slug}`,
    })),
  };
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export default function CakeDetailPage() {
  const params = useParams<{ slug: string }>();
  const [cake, setCake] = useState<CatalogCakeDetail | null>(null);
  const [selection, setSelection] = useState<Record<string, string | number>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!params.slug) return;
    const controller = new AbortController();
    async function loadCake() {
      try {
        const response = await fetch(`/api/cakes/${encodeURIComponent(params.slug)}`, { signal: controller.signal });
        const payload = await response.json() as ApiResponse;
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Cake not found.");
        setCake(payload.data);
        setSelection(Object.fromEntries(payload.data.customizations.filter((item) => item.isRequired && item.values[0]).map((item) => [item.key, item.values[0].value])));
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Cake not found."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void loadCake();
    return () => controller.abort();
  }, [params.slug]);

  const selectedVariant = cake?.variants.find((variant) => selection.variantId === variant.id) || cake?.variants[0];
  const selectedPrice = useMemo(() => cake && selectedVariant ? cake.customizations.reduce((total, item) => { const selected = selection[item.key]; const value = item.values.find((option) => option.value === selected); return total + (selected === undefined || selected === "" ? 0 : item.priceDelta + (value?.priceDelta || 0)); }, selectedVariant.price) : 0, [cake, selectedVariant, selection]);
  const images = cake?.images.filter((image) => image.url) || [];

  async function addToCart() {
    if (!cake || !selectedVariant?.isAvailable) return;
    const response = await fetch("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: selectedVariant.id, quantity: 1, customizations: selection }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { error?: { message?: string } } | null;
    setMessage(response?.ok ? "Added to your cart. You can continue browsing or check out when ready." : payload?.error?.message || "We could not add this cake to your cart.");
  }

  if (loading) return <main className="catalog-state"><span className="loading-mark">✦</span><p>Preparing the cake details…</p></main>;
  if (error || !cake) return <main className="catalog-state catalog-error"><h1>That cake is not available.</h1><p>{error}</p><Link className="button button-dark" href="/cakes">Back to the collection</Link></main>;
  const currentImage = images[activeImage] || images[0];

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(cake, images) }} /><main className="product-page"><header className="product-header"><div className="container"><Link className="text-link" href="/cakes">← All cakes</Link></div></header><section className="container product-layout" aria-labelledby="product-title"><div className="product-visual catalog-cake-placeholder">{currentImage?.url ? <><img src={currentImage.url} alt={currentImage.altText || cake.name} /><div className="product-thumbnails">{images.map((image, index) => <button className={index === activeImage ? "active" : ""} key={image.url} type="button" onClick={() => setActiveImage(index)}><img src={image.url || ""} alt={image.altText || `${cake.name} view ${index + 1}`} /></button>)}</div></> : <><span aria-hidden="true">✦</span><small>Product imagery will appear here once media is attached.</small></>}</div><div className="product-copy"><p className="eyebrow">{cake.categories[0]?.name || "Cake"}</p><h1 id="product-title">{cake.name}</h1><p className="product-lede">{cake.fullDescription || cake.description || "Made fresh for your celebration."}</p><strong className="product-route-price">From {money(selectedPrice, cake.currency)}</strong>{cake.preparationTime && <p className="product-prep">Prepared with at least {cake.preparationTime} hours&apos; notice.</p>}<div className="product-options"><div className="product-option"><strong>Choose a size</strong><div className="product-option-grid">{cake.variants.map((variant) => <button aria-disabled={!variant.isAvailable} className={selectedVariant?.id === variant.id ? "selected" : ""} disabled={!variant.isAvailable} key={variant.id} onClick={() => setSelection((current) => ({ ...current, variantId: variant.id }))} type="button">{variant.name}<small>{variant.isAvailable ? money(variant.price, cake.currency) : "Sold out"}</small></button>)}</div></div>{cake.customizations.map((item) => <div className="product-option" key={item.key}><strong>{item.label}{item.isRequired ? " · Required" : ""}</strong>{item.type === "TEXT" ? <textarea value={String(selection[item.key] || "")} onChange={(event) => setSelection((current) => ({ ...current, [item.key]: event.target.value }))} placeholder={`Add ${item.label.toLowerCase()}`} /> : <div className="product-option-grid">{item.values.map((value) => <button className={selection[item.key] === value.value ? "selected" : ""} key={value.value} onClick={() => setSelection((current) => ({ ...current, [item.key]: value.value }))} type="button">{value.label}{value.priceDelta ? <small>+ {money(value.priceDelta, cake.currency)}</small> : null}</button>)}</div>}</div>)}</div>{(cake.ingredients || cake.allergens) && <div className="allergen-note"><strong>Ingredients</strong><p>{cake.ingredients || "Ask our team for ingredients."}</p><span>Allergen note: {cake.allergens || "Please contact us about allergens."}</span></div>}{message && <p className="product-message" role="status">{message}</p>}<button className="button button-dark product-add-button" disabled={!selectedVariant?.isAvailable} onClick={() => void addToCart()} type="button">{selectedVariant?.isAvailable ? `Add to cart · ${money(selectedPrice, cake.currency)}` : "Currently sold out"}</button><p className="product-note">Prices and customization validity are confirmed again by the server when added to cart.</p></div></section><PublicFloatingActions message={`Hi Bite & Bloom, I have a question about ${cake.name}.`} /></main></>;
}
