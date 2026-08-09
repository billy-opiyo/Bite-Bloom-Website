"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; name: string | null; email: string | null; phone: string | null; loyalty: { pointsBalance: number; lifetimePoints: number } | null };
type Address = { id: string; label: string; recipientName: string; line1: string; city: string; country: string; phone: string | null; isDefault: boolean };
type Order = { orderNumber: string; status: string; paymentStatus: string; fulfillmentType: string; total: number; currency: string; placedAt: string; items: Array<{ cakeName: string; variantName: string | null; quantity: number }> };
type WishlistItem = { cakeId: string; cake: { name: string; slug: string; description: string | null; price: number; currency: string; isAvailable: boolean } };

function money(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({ label: "Home", recipientName: "", line1: "", city: "Nairobi", country: "KE", phone: "" });

  async function loadAccount() {
    setLoading(true);
    const [accountResponse, addressesResponse, ordersResponse, wishlistResponse] = await Promise.all([
      fetch("/api/account"), fetch("/api/account/addresses"), fetch("/api/account/orders"), fetch("/api/account/wishlist"),
    ]);
    if (accountResponse.status === 401) {
      router.replace("/login?callbackUrl=/account");
      return;
    }
    const [accountPayload, addressesPayload, ordersPayload, wishlistPayload] = await Promise.all([
      accountResponse.json().catch(() => null), addressesResponse.json().catch(() => null), ordersResponse.json().catch(() => null), wishlistResponse.json().catch(() => null),
    ]) as Array<{ data?: unknown } | null>;
    const currentAccount = accountPayload?.data as Account | undefined;
    if (currentAccount) {
      setAccount(currentAccount);
      setName(currentAccount.name ?? "");
      setPhone(currentAccount.phone ?? "");
    }
    if (addressesResponse.ok) setAddresses((addressesPayload?.data as Address[] | undefined) ?? []);
    if (ordersResponse.ok) setOrders((ordersPayload?.data as Order[] | undefined) ?? []);
    if (wishlistResponse.ok) setWishlist((wishlistPayload?.data as WishlistItem[] | undefined) ?? []);
    setLoading(false);
  }

  useEffect(() => { void loadAccount(); }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) }).catch(() => null);
    if (!response?.ok) return setMessage("Unable to save your profile right now.");
    setMessage("Profile saved.");
    void loadAccount();
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...address, isDefault: addresses.length === 0 }) }).catch(() => null);
    if (!response?.ok) return setMessage("Unable to save that address right now.");
    setAddress({ label: "Home", recipientName: "", line1: "", city: "Nairobi", country: "KE", phone: "" });
    setMessage("Address saved.");
    void loadAccount();
  }

  async function removeWishlist(cakeId: string) {
    const response = await fetch(`/api/account/wishlist/${encodeURIComponent(cakeId)}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) return setMessage("Unable to update your wishlist right now.");
    setWishlist((items) => items.filter((item) => item.cakeId !== cakeId));
  }

  if (loading) return <main className="loading-screen"><p>Loading your account…</p></main>;
  if (!account) return <main className="not-found-screen"><h1>Your account is unavailable.</h1><Link className="button button-dark" href="/">Back to cakes</Link></main>;

  return <main className="account-page"><header className="account-page-header"><Link href="/">← Bite &amp; Bloom</Link><span>{account.email}</span></header><section className="account-page-intro"><p className="eyebrow">Your sweet account</p><h1>Hello, <em>{account.name ?? "cake person"}.</em></h1><p>Keep your details, favorite cakes, and every order in one place.</p></section>{message && <p className="account-message" role="status">{message}</p>}<section className="account-overview"><article><strong>{account.loyalty?.pointsBalance ?? 0}</strong><span>Loyalty points</span></article><article><strong>{orders.length}</strong><span>Orders</span></article><article><strong>{addresses.length}</strong><span>Saved addresses</span></article></section><div className="account-page-grid"><section className="account-panel"><h2>Your details</h2><form onSubmit={saveProfile}><label><span>Name</span><input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Phone</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0711 222 333" /></label><button className="button button-dark" type="submit">Save profile</button></form></section><section className="account-panel"><h2>Saved addresses</h2>{addresses.length ? <div className="account-list">{addresses.map((item) => <div key={item.id}><strong>{item.label}{item.isDefault ? " · Default" : ""}</strong><span>{item.recipientName} · {item.line1}, {item.city}</span></div>)}</div> : <p>No saved addresses yet.</p>}<form onSubmit={saveAddress}><label><span>Label</span><input required value={address.label} onChange={(event) => setAddress({ ...address, label: event.target.value })} /></label><label><span>Recipient</span><input required value={address.recipientName} onChange={(event) => setAddress({ ...address, recipientName: event.target.value })} /></label><label><span>Address</span><input required value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} /></label><label><span>City</span><input required value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></label><button className="button button-outline" type="submit">Save address</button></form></section><section className="account-panel account-panel-wide"><h2>Recent orders</h2>{orders.length ? <div className="account-list">{orders.map((item) => <div key={item.orderNumber}><strong>{item.orderNumber} · {money(item.total, item.currency)}</strong><span>{item.status.replaceAll("_", " ")} · {new Date(item.placedAt).toLocaleDateString("en-KE")} · {item.items.map((line) => `${line.quantity} × ${line.cakeName}`).join(", ")}</span></div>)}</div> : <p>No orders yet. <Link href="/">Find your next cake.</Link></p>}</section><section className="account-panel account-panel-wide"><h2>Your favorites</h2>{wishlist.length ? <div className="account-list">{wishlist.map((item) => <div key={item.cakeId}><strong>{item.cake.name} · {money(item.cake.price, item.cake.currency)}</strong><span>{item.cake.isAvailable ? "Available to order" : "Currently unavailable"}</span><button onClick={() => void removeWishlist(item.cakeId)}>Remove</button></div>)}</div> : <p>Your favorite cakes will appear here.</p>}</section></div><footer className="account-footer"><span>© {new Date().getFullYear()} Bite & Bloom. All rights reserved.</span><Link href="/">Back to storefront</Link></footer></main>;
}
