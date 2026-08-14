"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") || "";
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") || "");
    const response = await fetch("/api/auth/password-reset/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const payload = await response.json() as { data?: { message?: string }; error?: { message?: string } };
    setMessage(response.ok ? payload.data?.message || "Your password has been updated." : payload.error?.message || "We could not reset your password.");
  }
  return <main className="info-page"><section className="container info-content"><form className="info-panel checkout-route-form" onSubmit={(event) => void submit(event)}><p className="eyebrow">Bite &amp; Bloom account</p><h1>Choose a new <em>password.</em></h1><label>New password<input name="password" type="password" minLength={12} required /></label>{message && <p role="status">{message}</p>}<button className="button button-dark" disabled={!token} type="submit">Update password</button><Link className="text-link" href="/login">Back to sign in</Link></form></section></main>;
}
