"use client";

import Link from "next/link";
import { useState } from "react";
import PublicInfoPage from "../../../components/public/PublicInfoPage";

export default function CustomCakePage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const request = ["Custom cake request", `Event: ${String(form.get("eventType") || "Not specified")}`, `Event date: ${String(form.get("eventDate") || "Not specified")}`, `Guests: ${String(form.get("guests") || "Not specified")}`, `Budget: ${String(form.get("budget") || "Not specified")}`, `Theme: ${String(form.get("theme") || "Not specified")}`, `Details: ${String(form.get("details") || "")}`].join("\n");
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), message: request, source: "custom-cake" }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!response?.ok) setMessage(payload?.error?.message ?? "We could not send your request right now.");
    else { setSent(true); formElement.reset(); }
    setBusy(false);
  }

  return <PublicInfoPage eyebrow="Made for your moment" title={<>Tell us your <em>cake story.</em></>} intro="Share the details of a one-of-a-kind cake and the bakery team will review the brief before confirming a quotation."><div className="info-panel"><form className="checkout-route-form" onSubmit={(event) => void submit(event)}>{sent && <p className="account-message" role="status">Your custom cake request is with the bakery team. We&apos;ll be in touch after reviewing the brief.</p>}<label>Name<input name="name" required minLength={2} /></label><label>Email<input name="email" type="email" required /></label><label>Event type<input name="eventType" required placeholder="Birthday, wedding, graduation…" /></label><label>Event date<input name="eventDate" type="date" /></label><label>Number of guests<input name="guests" type="number" min="1" max="1000" /></label><label>Budget in Ksh<input name="budget" inputMode="numeric" placeholder="e.g. 8500" /></label><label>Theme or colours<input name="theme" required placeholder="e.g. soft pink, garden theme" /></label><label>Brief and inspiration details<textarea name="details" required minLength={10} maxLength={2400} placeholder="Describe the flavour, shape, writing, toppings, and any reference details." /></label><p className="form-note">Reference-image uploads will be enabled after verified media storage is configured. For now, describe the inspiration or include a safe public reference link in the brief.</p>{message && <p role="alert">{message}</p>}<button className="button button-dark" disabled={busy} type="submit">{busy ? "Sending brief…" : "Send custom cake brief"}</button><Link className="text-link" href="/contact">Need a quick question first?</Link></form></div></PublicInfoPage>;
}
