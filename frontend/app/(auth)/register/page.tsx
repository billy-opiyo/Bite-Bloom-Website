"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to create your account.");
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="not-found-screen">
      <form className="contact-form-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Bite & Bloom</p>
        <h1>Create your account.</h1>
        <label><span>Full name</span><input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>Password</span><input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} /><small>Use at least 12 characters.</small></label>
        {error && <p role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</button>
        <p>Already have an account? <Link href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
