"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Verifying your email…");
  useEffect(() => {
    const token = params.get("token");
    if (!token) { setMessage("This verification link is missing its token."); return; }
    void fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async (response) => { const payload = await response.json() as { data?: { message?: string }; error?: { message?: string } }; setMessage(response.ok ? payload.data?.message || "Your email has been verified." : payload.error?.message || "We could not verify this link."); }).catch(() => setMessage("We could not verify this link right now."));
  }, [params]);
  return <main className="info-page"><section className="container info-content"><div className="info-panel"><p className="eyebrow">Bite &amp; Bloom account</p><h1>Email <em>verification.</em></h1><p>{message}</p><Link className="button button-dark" href="/login">Continue to sign in</Link></div></section></main>;
}
