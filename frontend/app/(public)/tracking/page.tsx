"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

type TrackingData = { orderNumber: string; status: string; fulfillmentType: string; placedAt: string; };
const steps = ["PENDING_PAYMENT", "CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get("order")?.trim() || "";
  const initialEmail = searchParams.get("email")?.trim() || "";
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackingData | null>(null);
  const [message, setMessage] = useState("");
  async function track(event: FormEvent) {
    event.preventDefault(); setMessage("Loading your order…");
    const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`);
    const payload = await response.json() as { data?: TrackingData; error?: { message?: string } };
    if (!response.ok || !payload.data) { setOrder(null); setMessage(payload.error?.message || "We could not find that order."); return; }
    setOrder(payload.data); setMessage("");
  }

  useEffect(() => {
    if (!initialOrderNumber || !initialEmail) return;
    setOrderNumber(initialOrderNumber);
    setEmail(initialEmail);
    setMessage("Loading your order…");
    let active = true;
    void fetch(`/api/orders/${encodeURIComponent(initialOrderNumber)}?email=${encodeURIComponent(initialEmail)}`).then(async (response) => {
      const payload = await response.json().catch(() => null) as { data?: TrackingData; error?: { message?: string } } | null;
      if (!active) return;
      if (!response.ok || !payload?.data) { setMessage(payload?.error?.message || "We could not find that order."); return; }
      setOrder(payload.data); setMessage("");
    }).catch(() => { if (active) setMessage("We could not load that order right now."); });
    return () => { active = false; };
  }, [initialEmail, initialOrderNumber]);

  useEffect(() => {
    const trackedOrderNumber = order?.orderNumber;
    if (!trackedOrderNumber || !email) return;
    let active = true;
    async function refresh() {
      const response = await fetch(`/api/orders/${encodeURIComponent(trackedOrderNumber)}?email=${encodeURIComponent(email)}`).catch(() => null);
      if (!active || !response?.ok) return;
      const payload = await response.json().catch(() => null) as { data?: TrackingData } | null;
      if (active && payload?.data) setOrder(payload.data);
    }
    const timer = window.setInterval(() => { void refresh(); }, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [email, order?.orderNumber]);

  const currentStep = order ? Math.max(0, steps.indexOf(order.status)) : -1;
  return <main className="info-page tracking-page"><div className="container"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><section className="info-hero"><p className="eyebrow">Order tracking</p><h1>Follow your cake from our oven to your door.</h1><p>Enter the order number and email used at checkout.</p></section><form className="tracking-form" onSubmit={(event) => void track(event)}><label>Order number<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="BB-0001" /></label><label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="button button-dark" type="submit">Track order</button></form>{message && <p className="account-message" role="status">{message}</p>}{order && <section className="tracking-result" aria-live="polite"><p className="eyebrow">{order.orderNumber}</p><h2>{order.status.replaceAll("_", " ")}</h2><p>Placed {new Date(order.placedAt).toLocaleString("en-KE")} · {order.fulfillmentType === "DELIVERY" ? "Home delivery" : "Shop pickup"}</p><ol className="tracking-steps">{steps.map((step, index) => <li className={index <= currentStep ? "complete" : ""} key={step}><span>{index <= currentStep ? "✓" : index + 1}</span>{step.replaceAll("_", " ")}</li>)}</ol><small className="tracking-refresh-note">This status refreshes automatically every 30 seconds.</small></section>}</div></main>;
}
