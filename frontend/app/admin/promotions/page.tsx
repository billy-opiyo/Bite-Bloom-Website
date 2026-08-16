"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Promotion = { id: string; code: string; description: string | null; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; value: number; minimumOrder: number | null; maximumDiscount: number | null; usageLimit: number | null; usageCount: number; perUserLimit: number | null; startsAt: string | null; endsAt: string | null; isActive: boolean };
type FormState = { code: string; description: string; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; value: string; minimumOrder: string; maximumDiscount: string; usageLimit: string; perUserLimit: string; startsAt: string; endsAt: string; isActive: boolean };

const initialForm: FormState = { code: "", description: "", discountType: "PERCENTAGE", value: "", minimumOrder: "", maximumDiscount: "", usageLimit: "", perUserLimit: "", startsAt: "", endsAt: "", isActive: true };

function formatValue(item: Promotion) { return item.discountType === "PERCENTAGE" ? `${item.value}%` : `Ksh ${item.value.toLocaleString("en-KE")}`; }
function dateValue(value: string) { return value ? new Date(value).toISOString() : null; }
function promotionStatus(item: Promotion) {
  if (!item.isActive) return "Disabled";
  const now = Date.now();
  if (new Date(item.startsAt ?? 0).getTime() > now) return "Scheduled";
  if (new Date(item.endsAt ?? 0).getTime() < now) return "Expired";
  return "Active";
}

export default function AdminPromotionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Promotion[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/coupons", { credentials: "same-origin" });
    if (response.status === 401) { router.replace("/login?callbackUrl=/admin/promotions"); return; }
    const payload = await response.json().catch(() => null) as { data?: Promotion[]; error?: { message?: string } } | null;
    if (!response.ok) setMessage(payload?.error?.message ?? "Promotions are unavailable.");
    if (response.ok) setItems(payload?.data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  function update(name: keyof FormState, value: string | boolean) { setForm((current) => ({ ...current, [name]: value })); }

  async function createPromotion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    if (!form.startsAt || !form.endsAt) { setMessage("Choose when this promotion starts and ends."); setBusy(false); return; }
    const body = { ...form, value: Number(form.value), minimumOrder: form.minimumOrder ? Number(form.minimumOrder) : null, maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null, perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null, startsAt: dateValue(form.startsAt), endsAt: dateValue(form.endsAt) };
    const response = await fetch("/api/admin/coupons", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!response?.ok) setMessage(payload?.error?.message ?? "Unable to create this promotion.");
    if (response?.ok) { setForm(initialForm); await load(); }
    setBusy(false);
  }

  async function toggle(item: Promotion) {
    const response = await fetch(`/api/admin/coupons/${item.id}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) }).catch(() => null);
    if (!response?.ok) { setMessage("Unable to update this promotion."); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry));
  }

  if (loading) return <main className="loading-screen"><p>Loading promotions…</p></main>;
  return <main className="admin-page"><div className="admin-content admin-promotions-route"><header className="admin-header"><div><Link href="/admin" className="admin-back-link">← Back to admin</Link><p className="eyebrow">Offers &amp; campaigns</p><h1>Promotion <em>control.</em></h1><p>Create secure checkout coupons and publish only currently valid offers.</p></div><button className="button button-outline" type="button" onClick={() => void load()}>Refresh</button></header>{message && <p className="account-message" role="alert">{message}</p>}<section className="admin-panel-card"><div className="admin-card-heading"><div><span>Create promotion</span><strong>Checkout coupon</strong></div><span>Validated server-side</span></div><form className="promotion-form" onSubmit={(event) => void createPromotion(event)}><label>Code<input value={form.code} onChange={(event) => update("code", event.target.value.toUpperCase())} placeholder="SWEET10" required minLength={3} maxLength={48} /></label><label>Description<input value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="A little sweetness for the weekend" maxLength={500} /></label><label>Discount type<select value={form.discountType} onChange={(event) => update("discountType", event.target.value)}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label><label>Value<input type="number" min="0.01" step="0.01" value={form.value} onChange={(event) => update("value", event.target.value)} required /></label><label>Minimum order<input type="number" min="0" step="0.01" value={form.minimumOrder} onChange={(event) => update("minimumOrder", event.target.value)} /></label><label>Maximum discount<input type="number" min="0" step="0.01" value={form.maximumDiscount} onChange={(event) => update("maximumDiscount", event.target.value)} /></label><label>Usage limit<input type="number" min="1" step="1" value={form.usageLimit} onChange={(event) => update("usageLimit", event.target.value)} /></label><label>Per customer limit<input type="number" min="1" step="1" value={form.perUserLimit} onChange={(event) => update("perUserLimit", event.target.value)} /></label><label>Starts at<input type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} /></label><label>Ends at<input type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)} /></label><label className="promotion-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} /> Active immediately</label><button className="button button-dark" disabled={busy} type="submit">{busy ? "Saving…" : "Create promotion"}</button></form></section><section className="admin-panel-card"><div className="admin-card-heading"><div><span>Current promotions</span><strong>{items.length} saved coupons</strong></div><span>Latest 100</span></div>{items.length ? <div className="admin-message-list">{items.map((item) => { const status = promotionStatus(item); return <article className="admin-message-card promotion-row" key={item.id}><div><strong>{item.code} · {formatValue(item)}</strong><small>{item.description || "No description"} · Used {item.usageCount}{item.usageLimit === null ? "" : `/${item.usageLimit}`}</small><span className={`promotion-status promotion-status-${status.toLowerCase()}`}>{status} · {item.startsAt ? new Date(item.startsAt).toLocaleDateString("en-KE") : "No start"}–{item.endsAt ? new Date(item.endsAt).toLocaleDateString("en-KE") : "No end"}</span></div><button className={status === "Active" ? "button button-dark" : "button button-outline"} disabled={status === "Expired"} type="button" onClick={() => void toggle(item)}>{status === "Expired" ? "Expired" : item.isActive ? "Disable" : "Activate"}</button></article>; })}</div> : <p className="admin-empty-state">No promotions have been created yet.</p>}</section></div></main>;
}
