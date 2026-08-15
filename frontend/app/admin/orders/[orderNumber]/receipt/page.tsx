"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Receipt = { orderNumber: string; email: string; phone: string | null; status: string; paymentStatus: string; fulfillmentType: string; currency: string; subtotal: number; discountTotal: number; deliveryFee: number; taxTotal: number; total: number; notes: string | null; scheduledFor: string | null; deliverySlot: string | null; placedAt: string; items: Array<{ cakeName: string; variantName: string | null; sku: string | null; quantity: number; unitPrice: number; lineTotal: number; customizations: unknown }>; addresses: Array<{ type: string; recipientName: string; line1: string; line2: string | null; city: string; region: string | null; postalCode: string | null; country: string; phone: string | null }>; payments: Array<{ provider: string; status: string; amount: number; paidAt: string | null; providerReference: string | null }> };

function money(value: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }

export default function AdminReceiptPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber;
    if (!key) return;
    fetch(`/api/admin/orders/${encodeURIComponent(key)}`, { credentials: "same-origin" }).then(async (response) => {
      const payload = await response.json().catch(() => null) as { data?: Receipt; error?: { message?: string } } | null;
      if (response.status === 401) { router.replace(`/login?callbackUrl=/admin/orders/${encodeURIComponent(key)}/receipt`); return; }
      if (!response.ok || !payload?.data) { setError(payload?.error?.message ?? "Receipt unavailable."); return; }
      setReceipt(payload.data);
    }).catch(() => setError("Receipt unavailable."));
  }, [params.orderNumber, router]);

  if (error) return <main className="info-page"><section className="container info-content"><div className="info-panel"><h1>Receipt unavailable.</h1><p role="alert">{error}</p></div></section></main>;
  if (!receipt) return <main className="loading-screen"><p>Loading receipt…</p></main>;
  const deliveryAddress = receipt.addresses.find((address) => address.type === "DELIVERY");
  return <main className="admin-receipt-page"><div className="admin-receipt-actions"><button className="button button-dark" type="button" onClick={() => window.print()}>Print receipt</button><button className="button button-outline" type="button" onClick={() => router.back()}>Back</button></div><article className="admin-receipt"><header><p className="eyebrow">Bite &amp; Bloom Studio</p><h1>Order <em>{receipt.orderNumber}</em></h1><p>Placed {new Date(receipt.placedAt).toLocaleString("en-KE")}</p></header><section className="admin-receipt-meta"><div><strong>Customer</strong><span>{receipt.email}</span>{receipt.phone && <span>{receipt.phone}</span>}</div><div><strong>Fulfillment</strong><span>{receipt.fulfillmentType === "DELIVERY" ? "Home delivery" : "Pickup from studio"}</span>{deliveryAddress && <span>{deliveryAddress.line1}, {deliveryAddress.city}</span>}{receipt.deliverySlot && <span>{receipt.deliverySlot}</span>}</div><div><strong>Payment</strong><span>{receipt.paymentStatus.replaceAll("_", " ")}</span></div></section><section className="admin-receipt-items">{receipt.items.map((item, index) => <div key={`${item.cakeName}-${item.sku ?? index}`}><span><strong>{item.quantity} × {item.cakeName}</strong><small>{item.variantName || "Custom cake"}</small></span><strong>{money(item.lineTotal, receipt.currency)}</strong></div>)}</section><section className="admin-receipt-totals"><span>Subtotal</span><strong>{money(receipt.subtotal, receipt.currency)}</strong><span>Discount</span><strong>− {money(receipt.discountTotal, receipt.currency)}</strong><span>Delivery</span><strong>{money(receipt.deliveryFee, receipt.currency)}</strong><span>Tax</span><strong>{money(receipt.taxTotal, receipt.currency)}</strong><span>Total</span><strong>{money(receipt.total, receipt.currency)}</strong></section>{receipt.notes && <p className="admin-receipt-notes"><strong>Notes:</strong> {receipt.notes}</p>}<footer>Thank you for choosing Bite &amp; Bloom.</footer></article></main>;
}
