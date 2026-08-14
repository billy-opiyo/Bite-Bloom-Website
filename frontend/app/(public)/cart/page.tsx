"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Cart = { items: Array<{ id: string; quantity: number; unitPrice: number; variantName: string; cakeName: string; cakeSlug: string; customizations: unknown }>; subtotal: number; currency: string; coupons: Array<{ code: string }> };

function money(amount: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  async function load() { const response = await fetch("/api/cart"); const payload = await response.json() as { data?: Cart; error?: { message?: string } }; if (!response.ok) throw new Error(payload.error?.message || "Cart unavailable."); setCart(payload.data || null); }
  useEffect(() => { void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Cart unavailable.")); }, []);
  async function update(id: string, quantity: number) { setBusy(id); const response = await fetch(`/api/cart/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity }) }); if (response.ok) await load(); setBusy(""); }
  async function remove(id: string) { setBusy(id); const response = await fetch(`/api/cart/items/${id}`, { method: "DELETE" }); if (response.ok) await load(); setBusy(""); }
  return <main className="info-page"><header className="info-header"><div className="container"><Link className="text-link" href="/cakes">← Continue shopping</Link><p className="eyebrow">Your sweet selection</p><h1>Your <em>cart.</em></h1><p>Review your cakes before checkout.</p></div></header><section className="container info-content">{error && <div className="info-panel"><p role="alert">{error}</p></div>}{!error && cart && cart.items.length === 0 && <div className="info-panel"><h2>Your cart is empty.</h2><p>Find something lovely for your next celebration.</p><Link className="button button-dark" href="/cakes">Browse cakes</Link></div>}{cart && cart.items.length > 0 && <div className="info-panel"><div className="cart-route-items">{cart.items.map((item) => <div className="cart-route-item" key={item.id}><div><Link href={`/cakes/${item.cakeSlug}`}><strong>{item.cakeName}</strong></Link><small>{item.variantName} · {money(item.unitPrice, cart.currency)} each</small></div><div className="cart-route-actions"><button disabled={busy === item.id || item.quantity <= 1} onClick={() => void update(item.id, item.quantity - 1)} type="button">−</button><span>{item.quantity}</span><button disabled={busy === item.id || item.quantity >= 20} onClick={() => void update(item.id, item.quantity + 1)} type="button">+</button><button onClick={() => void remove(item.id)} type="button">Remove</button></div></div>)}</div><div className="cart-route-total"><span>Subtotal</span><strong>{money(cart.subtotal, cart.currency)}</strong></div><Link className="button button-dark" href="/#checkout">Continue to checkout</Link></div>}</section></main>;
}
