"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type TrackingData = { orderNumber: string; status: string; fulfillmentType: string; placedAt: string; };
const steps = ["PENDING_PAYMENT", "CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function TrackingPage() {
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
  const currentStep = order ? Math.max(0, steps.indexOf(order.status)) : -1;
  return <main className="info-page tracking-page"><div className="container"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><section className="info-hero"><p className="eyebrow">Order tracking</p><h1>Follow your cake from our oven to your door.</h1><p>Enter the order number and email used at checkout.</p></section><form className="tracking-form" onSubmit={(event) => void track(event)}><label>Order number<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="BB-0001" /></label><label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="button button-dark" type="submit">Track order</button></form>{message && <p className="account-message" role="status">{message}</p>}{order && <section className="tracking-result" aria-live="polite"><p className="eyebrow">{order.orderNumber}</p><h2>{order.status.replaceAll("_", " ")}</h2><p>Placed {new Date(order.placedAt).toLocaleString("en-KE")} · {order.fulfillmentType === "DELIVERY" ? "Home delivery" : "Shop pickup"}</p><ol className="tracking-steps">{steps.map((step, index) => <li className={index <= currentStep ? "complete" : ""} key={step}><span>{index <= currentStep ? "✓" : index + 1}</span>{step.replaceAll("_", " ")}</li>)}</ol></section>}</div></main>;
}
