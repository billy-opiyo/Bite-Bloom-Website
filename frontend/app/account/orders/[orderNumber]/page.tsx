"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderItem = { cakeName: string; variantId: string | null; variantName: string | null; sku: string | null; quantity: number; unitPrice: number; lineTotal: number; customizations: unknown };
type Order = { orderNumber: string; status: string; paymentStatus: string; fulfillmentType: string; scheduledFor: string | null; deliverySlot: string | null; currency: string; subtotal: number; discountTotal: number; deliveryFee: number; total: number; notes: string | null; placedAt: string; items: OrderItem[]; deliveryAddress: { recipientName: string; line1: string; city: string; country: string } | null; payments: Array<{ provider: string; status: string; amount: number; paidAt: string | null }>; shipment: { status: string; courier: string | null; trackingNumber: string | null; estimatedAt: string | null; events: Array<{ status: string; description: string; occurredAt: string }> } | null; statusHistory: Array<{ fromStatus: string | null; toStatus: string; reason: string | null; occurredAt: string }> };
type ApiResponse = { data?: Order; error?: { message?: string } };

const statusSteps = [
  ["PENDING_PAYMENT", "Order received"], ["PAID", "Order received"], ["CONFIRMED", "Order received"], ["PREPARING", "Baking"], ["READY_FOR_DISPATCH", "Decorating"], ["OUT_FOR_DELIVERY", "Out for delivery"], ["DELIVERED", "Delivered"], ["COMPLETED", "Delivered"],
] as const;

function money(amount: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase()); }

export default function AccountOrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderNumber) return;
    const response = await fetch(`/api/account/orders/${encodeURIComponent(orderNumber)}`).catch(() => null);
    if (response?.status === 401) { router.replace(`/login?callbackUrl=/account/orders/${encodeURIComponent(orderNumber)}`); return; }
    const payload = await response?.json().catch(() => null) as ApiResponse | null;
    if (!response?.ok || !payload?.data) { setError(payload?.error?.message || "This order is unavailable."); return; }
    setOrder(payload.data);
  }, [orderNumber, router]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  const activeStep = useMemo(() => {
    const statusIndex = statusSteps.findIndex(([status]) => status === order?.status);
    return statusIndex < 0 ? 0 : statusIndex;
  }, [order?.status]);

  async function cancelOrder() {
    if (!order) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/account/orders/${encodeURIComponent(order.orderNumber)}/cancel`, { method: "POST" }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { data?: { message?: string }; error?: { message?: string } } | null;
    setBusy(false);
    if (!response?.ok) { setMessage(payload?.error?.message || "Unable to cancel this order."); return; }
    setMessage(payload?.data?.message || "Your order has been cancelled.");
    await loadOrder();
  }

  async function reorder() {
    if (!order) return;
    setBusy(true); setMessage("");
    let added = 0;
    for (const item of order.items) {
      if (!item.variantId) continue;
      const response = await fetch("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: item.variantId, quantity: Math.min(item.quantity, 20), ...(item.customizations ? { customizations: item.customizations } : {}) }) }).catch(() => null);
      if (response?.ok) added += 1;
    }
    setBusy(false);
    setMessage(added ? `${added} item${added === 1 ? "" : "s"} added to your cart.` : "These items are no longer available to reorder.");
  }

  if (error) return <main className="info-page"><section className="container info-content"><div className="info-panel"><h1>Order unavailable.</h1><p role="alert">{error}</p><Link className="button button-dark" href="/account">Back to account</Link></div></section></main>;
  if (!order) return <main className="loading-screen"><p>Loading your order…</p></main>;

  const canCancel = order.paymentStatus !== "PAID" && ["PENDING_PAYMENT", "CONFIRMED"].includes(order.status);
  return <main className="info-page order-detail-page">
    <header className="info-header"><div className="container"><Link className="text-link" href="/account">← Back to account</Link><p className="eyebrow">Order details</p><h1><em>{order.orderNumber}</em></h1><p>{label(order.status)} · placed {new Date(order.placedAt).toLocaleString("en-KE")}</p></div></header>
    <section className="container info-content">
      <div className="order-detail-actions"><button className="button button-outline" onClick={() => window.print()} type="button">Print receipt</button><button className="button button-dark" disabled={busy} onClick={() => void reorder()} type="button">{busy ? "Working…" : "Reorder items"}</button>{canCancel && <button className="button button-outline" disabled={busy} onClick={() => void cancelOrder()} type="button">Cancel order</button>}</div>
      {message && <p className="account-message" role="status">{message}</p>}
      <div className="order-status-timeline" aria-label="Order progress">{statusSteps.map(([status, title], index) => <div className={index <= activeStep ? "complete" : ""} key={status}><span>{index + 1}</span><strong>{title}</strong></div>)}</div>
      <article className="info-panel order-receipt"><div className="order-receipt-heading"><div><p className="eyebrow">Bite &amp; Bloom</p><h2>Your order</h2></div><strong>{money(order.total, order.currency)}</strong></div><div className="account-list">{order.items.map((item, index) => <div key={`${item.sku || item.cakeName}-${index}`}><strong>{item.quantity} × {item.cakeName}</strong><span>{item.variantName || "Custom cake"} · {money(item.lineTotal, order.currency)}</span></div>)}</div><div className="order-totals"><span>Subtotal</span><strong>{money(order.subtotal, order.currency)}</strong><span>Discount</span><strong>− {money(order.discountTotal, order.currency)}</strong><span>Delivery</span><strong>{money(order.deliveryFee, order.currency)}</strong><span>Total</span><strong>{money(order.total, order.currency)}</strong></div><p className="order-detail-note">Payment: {label(order.paymentStatus)} · {order.fulfillmentType === "DELIVERY" ? `Delivery to ${order.deliveryAddress?.line1 || "saved address"}, ${order.deliveryAddress?.city || "Nairobi"}` : "Pickup from Bite & Bloom studio"}{order.deliverySlot ? ` · ${order.deliverySlot}` : ""}</p></article>
      {order.statusHistory.length > 0 && <article className="info-panel"><h2>Order history</h2><div className="account-list">{order.statusHistory.map((entry, index) => <div key={`${entry.toStatus}-${entry.occurredAt}-${index}`}><strong>{label(entry.toStatus)}</strong><span>{entry.reason || "Status updated"} · {new Date(entry.occurredAt).toLocaleString("en-KE")}</span></div>)}</div></article>}
    </section>
  </main>;
}
