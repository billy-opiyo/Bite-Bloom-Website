"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WishlistItem = { cakeId: string; cake: { name: string; slug: string; description: string | null; price: number; currency: string; isAvailable: boolean } };

function money(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadWishlist() {
      const response = await fetch("/api/account/wishlist").catch(() => null);
      if (!response) {
        setMessage("Your wishlist is unavailable right now.");
        setLoading(false);
        return;
      }
      if (response.status === 401) {
        router.replace("/login?callbackUrl=/account/wishlist");
        return;
      }
      const payload = await response.json().catch(() => null) as { data?: WishlistItem[] } | null;
      if (!response.ok) setMessage("Your wishlist is unavailable right now.");
      setItems(payload?.data ?? []);
      setLoading(false);
    }

    void loadWishlist();
  }, [router]);

  async function removeItem(cakeId: string) {
    const response = await fetch(`/api/account/wishlist/${encodeURIComponent(cakeId)}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setMessage("Unable to update your wishlist right now.");
      return;
    }
    setItems((current) => current.filter((item) => item.cakeId !== cakeId));
  }

  return <main className="info-page wishlist-page"><header className="info-header"><div className="container"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><p className="eyebrow">Saved for later</p><h1>Your <em>wishlist.</em></h1><p>Keep the cakes you love close until the moment is right.</p></div></header><section className="container info-content"><div className="info-panel">{loading && <p role="status">Loading your wishlist…</p>}{!loading && message && <p role="alert">{message}</p>}{!loading && !message && items.length === 0 && <><h2>Your wishlist is waiting.</h2><p>Save a cake from the shop and it will appear here.</p><Link className="button button-dark" href="/cakes">Browse cakes</Link></>}{!loading && !message && items.length > 0 && <div className="wishlist-grid">{items.map((item) => <article className="wishlist-card" key={item.cakeId}><div><p className="eyebrow">Favorite cake</p><h2><Link href={`/cakes/${item.cake.slug}`}>{item.cake.name}</Link></h2><p>{item.cake.description || "Made fresh for your celebration."}</p><strong>{money(item.cake.price, item.cake.currency)}</strong></div><div className="wishlist-card-actions"><Link className="button button-dark" href={`/cakes/${item.cake.slug}`}>View cake</Link><button className="button button-outline" onClick={() => void removeItem(item.cakeId)} type="button">Remove</button></div></article>)}</div>}</div></section></main>;
}
