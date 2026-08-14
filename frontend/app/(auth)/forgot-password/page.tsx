"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "");
    const response = await fetch("/api/auth/password-reset/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const payload = await response.json() as { data?: { message?: string }; error?: { message?: string } };
    setMessage(response.ok ? payload.data?.message || "Check your inbox for reset instructions." : payload.error?.message || "We could not start password reset.");
  }
  return <main className="info-page"><section className="container info-content"><form className="info-panel checkout-route-form" onSubmit={(event) => void submit(event)}><p className="eyebrow">Bite &amp; Bloom account</p><h1>Reset your <em>password.</em></h1><p>Enter your account email and we&apos;ll send reset instructions.</p><label>Email address<input name="email" type="email" required /></label>{message && <p role="status">{message}</p>}<button className="button button-dark" type="submit">Send reset link</button><Link className="text-link" href="/login">Back to sign in</Link></form></section></main>;
}
