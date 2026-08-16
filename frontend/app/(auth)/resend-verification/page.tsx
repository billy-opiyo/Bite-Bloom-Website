"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/auth/verify-email/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { data?: { message?: string }; error?: { message?: string } } | null;
    setMessage(response?.ok ? payload?.data?.message ?? "If your account needs verification, a new link will be sent shortly." : payload?.error?.message ?? "Unable to resend verification right now.");
    setBusy(false);
  }

  return <main className="info-page"><section className="container info-content"><form className="info-panel checkout-route-form" onSubmit={(event) => void submit(event)}><p className="eyebrow">Bite &amp; Bloom account</p><h1>Verify your <em>email.</em></h1><p>Enter your account email and we&apos;ll queue a fresh verification link.</p><label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>{message && <p role="status">{message}</p>}<button className="button button-dark" disabled={busy} type="submit">{busy ? "Sending…" : "Resend verification"}</button><Link className="text-link" href="/login">Back to sign in</Link></form></section></main>;
}
