"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/providers").then((response) => response.ok ? response.json() as Promise<Record<string, unknown>> : null).then((providers) => {
      if (isMounted) setGoogleAvailable(Boolean(providers?.google));
    }).catch(() => { if (isMounted) setGoogleAvailable(false); });
    return () => { isMounted = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);
    if (result?.error) {
      setError("Your email or password is incorrect, or your account is not active.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/account");
    router.refresh();
  }

  return (
    <main className="not-found-screen">
      <form className="contact-form-card auth-form-card" onSubmit={handleSubmit}>
        <button className="modal-close auth-close-button" type="button" onClick={() => router.push("/")} aria-label="Close sign in">×</button>
        <p className="eyebrow">Bite & Bloom</p>
        <h1>Sign in to the studio.</h1>
        <label>
          <span>Email address</span>
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {registered && <p role="status">Account created. Check your email and verify it before signing in. <Link className="auth-link" href="/resend-verification">Resend the link</Link></p>}
        {error && <p role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <button className="google-button auth-google-button" type="button" disabled={!googleAvailable} onClick={() => { if (googleAvailable) void signIn("google", { callbackUrl: searchParams.get("callbackUrl") || "/account" }); }}><FcGoogle aria-hidden="true" />Continue with Google</button>
        <p>Need an account? <Link className="auth-link" href="/register">Create one</Link></p>
        <p><Link className="auth-link" href="/resend-verification">Need a new verification link?</Link></p>
      </form>
    </main>
  );
}
