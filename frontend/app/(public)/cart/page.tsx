"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CartItem = { id: string; cakeId: string; quantity: number; unitPrice: number; variantName: string; cakeName: string; cakeSlug: string; customizations: unknown };
type Cart = { items: CartItem[]; subtotal: number; currency: string; coupons: Array<{ code: string }> };

function money(amount: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const response = await fetch("/api/cart");
    const payload = await response.json() as { data?: Cart; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message || "Cart unavailable.");
    setCart(payload.data || null);
  }

  useEffect(() => { void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Cart unavailable.")); }, []);

  async function update(id: string, quantity: number) {
    setBusy(id); setMessage("");
    const response = await fetch(`/api/cart/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity }) });
    if (response.ok) await load(); else setMessage("Unable to update that cake right now.");
    setBusy("");
  }

  async function remove(id: string) {
    setBusy(id); setMessage("");
    const response = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    if (response.ok) await load(); else setMessage("Unable to remove that cake right now.");
    setBusy("");
  }

  async function saveForLater(item: CartItem) {
    setBusy(`save-${item.id}`); setMessage("");
    const response = await fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cakeId: item.cakeId }) }).catch(() => null);
    if (response?.status === 401) { router.replace("/login?callbackUrl=/cart"); return; }
    if (!response?.ok) { setMessage("Sign in to save this cake for later, or try again."); setBusy(""); return; }
    const removed = await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
    if (removed.ok) { setMessage(`${item.cakeName} was saved to your wishlist.`); await load(); } else setMessage("The cake was saved, but could not be removed from your cart.");
    setBusy("");
  }

  return <main className="info-page"><header className="info-header"><div className="container"><Link className="text-link" href="/cakes">← Continue shopping</Link><p className="eyebrow">Your sweet selection</p><h1>Your <em>cart.</em></h1><p>Review your cakes before checkout.</p></div></header><section className="container info-content">{error && <div className="info-panel"><p role="alert">{error}</p></div>}{message && <div className="info-panel"><p role="status">{message}</p></div>}{!error && cart && cart.items.length === 0 && <div className="info-panel"><h2>Your cart is empty.</h2><p>Find something lovely for your next celebration.</p><Link className="button button-dark" href="/cakes">Browse cakes</Link></div>}{cart && cart.items.length > 0 && <div className="info-panel"><div className="cart-route-items">{cart.items.map((item) => <div className="cart-route-item" key={item.id}><div><Link href={`/cakes/${item.cakeSlug}`}><strong>{item.cakeName}</strong></Link><small>{item.variantName} · {money(item.unitPrice, cart.currency)} each</small></div><div className="cart-route-actions"><button disabled={busy === item.id || item.quantity <= 1} onClick={() => void update(item.id, item.quantity - 1)} type="button">−</button><span>{item.quantity}</span><button disabled={busy === item.id || item.quantity >= 20} onClick={() => void update(item.id, item.quantity + 1)} type="button">+</button><button disabled={busy === item.id || busy === `save-${item.id}`} onClick={() => void saveForLater(item)} type="button">Save for later</button><button disabled={busy === item.id} onClick={() => void remove(item.id)} type="button">Remove</button></div></div>)}</div><div className="cart-route-total"><span>Subtotal</span><strong>{money(cart.subtotal, cart.currency)}</strong></div><Link className="button button-dark" href="/checkout">Continue to checkout</Link></div>}</section></main>;
}
