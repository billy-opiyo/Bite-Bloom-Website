"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Result = { orderNumber: string; paymentMessage?: string; paymentInitiated?: boolean; paymentStatus?: string };

export default function CheckoutPage() {
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CASH_ON_DELIVERY">("MPESA");
  const [result, setResult] = useState<Result | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setCheckoutEmail(String(values.email || ""));
    const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, fulfillmentType, paymentMethod }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { data?: Result; error?: { message?: string } } | null;
    if (!response?.ok || !payload?.data) setError(payload?.error?.message || "Checkout is unavailable right now.");
    else setResult(payload.data);
    setBusy(false);
  }

  useEffect(() => {
    if (!result?.paymentInitiated || !checkoutEmail || result.paymentStatus === "PAID" || result.paymentStatus === "FAILED") return;
    let cancelled = false;
    async function poll(attempt = 0): Promise<void> {
      if (cancelled || attempt >= 6) return;
      const response = await fetch(`/api/orders/${encodeURIComponent(result!.orderNumber)}?email=${encodeURIComponent(checkoutEmail)}`).catch(() => null);
      const payload = await response?.json().catch(() => null) as { data?: { paymentStatus?: string } } | null;
      const paymentStatus = payload?.data?.paymentStatus;
      if (!cancelled && paymentStatus) setResult((current) => current ? { ...current, paymentStatus } : current);
      if (!cancelled && paymentStatus !== "PAID" && paymentStatus !== "FAILED") window.setTimeout(() => void poll(attempt + 1), 3000);
    }
    void poll();
    return () => { cancelled = true; };
  }, [checkoutEmail, result]);

  if (result) return <main className="info-page"><section className="container info-content"><div className="info-panel"><p className="eyebrow">Order received</p><h1>Thank you for <em>choosing us.</em></h1><p>Your order number is <strong>{result.orderNumber}</strong>.</p><p>{result.paymentStatus === "PAID" ? "M-Pesa payment confirmed." : result.paymentStatus === "FAILED" ? "M-Pesa payment was not confirmed. Please contact support." : result.paymentInitiated ? "Check your phone for the M-Pesa prompt. We are waiting for confirmation…" : result.paymentMessage || "We will confirm the next step with you shortly."}</p><Link className="button button-dark" href={`/account/orders/${encodeURIComponent(result.orderNumber)}`}>View order</Link> <Link className="button button-outline" href="/cakes">Continue shopping</Link></div></section></main>;

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <main className="info-page"><header className="info-header"><div className="container"><Link className="text-link" href="/cart">← Back to cart</Link><p className="eyebrow">Almost there</p><h1>Checkout <em>with care.</em></h1><p>Your final total and availability are confirmed securely on the server.</p></div></header><section className="container info-content"><form className="info-panel checkout-route-form" onSubmit={submit}><label>Full name<input name="name" required minLength={2} /></label><label>Email<input name="email" type="email" required /></label><label>Phone number<input name="phone" type="tel" required placeholder="0711 222 333" /></label><fieldset><legend>Fulfillment</legend><button className={fulfillmentType === "DELIVERY" ? "selected" : ""} onClick={() => setFulfillmentType("DELIVERY")} type="button">Home delivery</button><button className={fulfillmentType === "PICKUP" ? "selected" : ""} onClick={() => setFulfillmentType("PICKUP")} type="button">Pickup from studio</button></fieldset>{fulfillmentType === "DELIVERY" && <label>Delivery address<textarea name="address" required minLength={5} /></label>}<label>Preferred date<input name="scheduledDate" type="date" min={minDate} required /></label><label>Time slot<select name="deliverySlot" defaultValue="10:00am – 12:00pm" required><option>10:00am – 12:00pm</option><option>12:00pm – 2:00pm</option><option>3:00pm – 5:00pm</option></select></label><label>Order notes<textarea name="notes" /></label><fieldset><legend>Payment method</legend><button className={paymentMethod === "MPESA" ? "selected" : ""} onClick={() => setPaymentMethod("MPESA")} type="button">M-Pesa</button><button className={paymentMethod === "CASH_ON_DELIVERY" ? "selected" : ""} onClick={() => setPaymentMethod("CASH_ON_DELIVERY")} type="button">Cash on delivery</button></fieldset>{error && <p role="alert">{error}</p>}<button className="button button-dark" disabled={busy} type="submit">{busy ? "Placing order…" : "Place order"}</button></form></section></main>;
}
