"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Review = { id: string; authorName: string; rating: number; title: string | null; body: string; createdAt: string };
type ReviewForm = { authorName: string; email: string; orderNumber: string; rating: string; title: string; body: string };

export default function CakeReviewsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ReviewForm>({ authorName: "", email: "", orderNumber: "", rating: "5", title: "", body: "" });

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    void fetch(`/api/cakes/${encodeURIComponent(slug)}/reviews`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { data?: Review[]; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message || "Reviews are unavailable.");
        setReviews(payload.data || []);
      })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Reviews are unavailable."); });
    return () => controller.abort();
  }, [slug]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage("");
    try {
      const response = await fetch(`/api/cakes/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });
      const payload = await response.json() as { data?: { message?: string }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Unable to submit your review.");
      setFormMessage(payload.data?.message || "Thank you. Your review is awaiting moderation.");
      setForm((current) => ({ ...current, title: "", body: "" }));
    } catch (cause) {
      setFormMessage(cause instanceof Error ? cause.message : "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="info-page">
    <header className="info-header"><div className="container"><Link className="text-link" href={`/cakes/${slug}`}>← Back to cake</Link><p className="eyebrow">Customer notes</p><h1>Reviews for <em>{slug.replaceAll("-", " ")}</em></h1><p>Stories from customers who have ordered this cake.</p></div></header>
    <section className="container info-content">
      <div className="info-faq">
        {error && <p role="alert">{error}</p>}
        {!error && reviews.length === 0 && <p>No published reviews yet.</p>}
        {reviews.map((review) => <article className="info-panel" key={review.id}><strong aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}</strong><h2>{review.title || "A lovely cake"}</h2><p>{review.body}</p><small>{review.authorName}</small></article>)}
        <article className="info-panel">
          <p className="eyebrow">Share your experience</p>
          <h2>Tell us how it turned out.</h2>
          <p>Reviews are accepted for delivered orders and appear after our team checks them.</p>
          <form className="contact-form" onSubmit={(event) => void submitReview(event)}>
            <label><span>Your name</span><input required minLength={2} maxLength={120} value={form.authorName} onChange={(event) => setForm({ ...form, authorName: event.target.value })} /></label>
            <label><span>Delivered order number</span><input required minLength={4} maxLength={80} placeholder="BB-123456" value={form.orderNumber} onChange={(event) => setForm({ ...form, orderNumber: event.target.value })} /></label>
            <label><span>Email used for the order <small>Optional if signed in</small></span><input type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label><span>Rating</span><select required value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}><option value="5">5 — Excellent</option><option value="4">4 — Lovely</option><option value="3">3 — Good</option><option value="2">2 — Could improve</option><option value="1">1 — Disappointing</option></select></label>
            <label><span>Review title <small>Optional</small></span><input minLength={2} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label><span>Your review</span><textarea required minLength={10} maxLength={2000} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
            {formMessage && <p role="status">{formMessage}</p>}
            <button className="button button-dark" disabled={submitting} type="submit">{submitting ? "Sending…" : "Submit review"}</button>
          </form>
        </article>
      </div>
    </section>
  </main>;
}
