"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/newsletter/unsubscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { data?: { message?: string }; error?: { message?: string } } | null;
    setMessage(response?.ok ? payload?.data?.message ?? "Your subscription preference has been updated." : payload?.error?.message ?? "Unable to update your subscription right now.");
    setBusy(false);
  }

  return <main className="info-page"><section className="container info-content"><form className="info-panel checkout-route-form" onSubmit={(event) => void submit(event)}><p className="eyebrow">Bite &amp; Bloom updates</p><h1>Take a little <em>break.</em></h1><p>Enter your email to stop receiving newsletter updates. This does not affect order or account messages.</p><label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>{message && <p role="status">{message}</p>}<button className="button button-dark" disabled={busy} type="submit">{busy ? "Updating…" : "Unsubscribe"}</button><Link className="text-link" href="/">Back to Bite &amp; Bloom</Link></form></section></main>;
}
