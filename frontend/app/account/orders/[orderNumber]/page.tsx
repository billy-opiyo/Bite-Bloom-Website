"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OrderDetail = { orderNumber: string; status: string; paymentStatus: string; fulfillmentType: string; currency: string; subtotal: number; discountTotal: number; deliveryFee: number; total: number; placedAt: string; items: Array<{ cakeName: string; variantName: string | null; quantity: number; lineTotal: number }>; deliveryAddress: { recipientName: string; line1: string; line2: string | null; city: string; country: string } | null; payments: Array<{ provider: string; status: string; amount: number; currency: string; paidAt: string | null }>; shipment: { status: string; courier: string | null; trackingNumber: string | null; estimatedAt: string | null; events: Array<{ status: string; description: string | null; occurredAt: string }> } | null; statusHistory: Array<{ toStatus: string; reason: string | null; occurredAt: string }> };

function money(value: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
function label(value: string) { return value.replaceAll("_", " "); }

export default function AccountOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const response = await fetch(`/api/account/orders/${encodeURIComponent(params.orderNumber)}`, { signal: controller.signal }).catch(() => null);
      if (response?.status === 401) return router.replace(`/login?callbackUrl=/account/orders/${encodeURIComponent(params.orderNumber)}`);
      const payload = await response?.json().catch(() => null) as { data?: OrderDetail; error?: { message?: string } } | null;
      if (!response?.ok || !payload?.data) return setError(payload?.error?.message ?? "Unable to load this order.");
      setOrder(payload.data);
    }
    void load();
    return () => controller.abort();
  }, [params.orderNumber, router]);

  if (error) return <main className="not-found-screen"><h1>{error}</h1><Link className="button button-dark" href="/account">Back to your account</Link></main>;
  if (!order) return <main className="loading-screen"><p>Loading order…</p></main>;

  return <main className="account-page"><header className="account-page-header"><Link href="/account">← Your account</Link><span>{order.orderNumber}</span></header><section className="account-page-intro"><p className="eyebrow">Order details</p><h1>{order.orderNumber}</h1><p>{label(order.status)} · Placed {new Date(order.placedAt).toLocaleString("en-KE")}</p></section><div className="account-page-grid"><section className="account-panel"><h2>Your order</h2><div className="account-list">{order.items.map((item, index) => <div key={`${item.cakeName}-${index}`}><strong>{item.quantity} × {item.cakeName}{item.variantName ? ` · ${item.variantName}` : ""}</strong><span>{money(item.lineTotal, order.currency)}</span></div>)}<div><strong>Subtotal</strong><span>{money(order.subtotal, order.currency)}</span></div>{order.discountTotal > 0 && <div><strong>Discount</strong><span>− {money(order.discountTotal, order.currency)}</span></div>}<div><strong>Delivery</strong><span>{money(order.deliveryFee, order.currency)}</span></div><div><strong>Total</strong><span>{money(order.total, order.currency)}</span></div></div></section><section className="account-panel"><h2>Delivery & payment</h2><div className="account-list"><div><strong>{label(order.fulfillmentType)}</strong><span>{order.deliveryAddress ? `${order.deliveryAddress.recipientName} · ${order.deliveryAddress.line1}, ${order.deliveryAddress.city}` : "Collection details will be confirmed."}</span></div>{order.shipment && <div><strong>{label(order.shipment.status)}</strong><span>{order.shipment.courier ? `${order.shipment.courier}${order.shipment.trackingNumber ? ` · ${order.shipment.trackingNumber}` : ""}` : "Courier will be assigned soon."}</span></div>}{order.payments.map((payment, index) => <div key={index}><strong>{label(payment.provider)} · {label(payment.status)}</strong><span>{money(payment.amount, payment.currency)}</span></div>)}</div></section><section className="account-panel account-panel-wide"><h2>Order journey</h2><div className="account-list">{order.statusHistory.map((entry, index) => <div key={`${entry.toStatus}-${index}`}><strong>{label(entry.toStatus)}</strong><span>{entry.reason ?? "Status updated"} · {new Date(entry.occurredAt).toLocaleString("en-KE")}</span></div>)}{order.shipment?.events.map((event, index) => <div key={`${event.status}-${index}`}><strong>{label(event.status)}</strong><span>{event.description ?? "Delivery update"} · {new Date(event.occurredAt).toLocaleString("en-KE")}</span></div>)}</div></section></div></main>;
}
