"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Review = { id: string; authorName: string; rating: number; title: string | null; body: string; createdAt: string };

export default function CakeReviewsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { if (!slug) return; void fetch(`/api/cakes/${encodeURIComponent(slug)}/reviews`).then(async (response) => { const payload = await response.json() as { data?: Review[]; error?: { message?: string } }; if (!response.ok) throw new Error(payload.error?.message || "Reviews are unavailable."); setReviews(payload.data || []); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Reviews are unavailable.")); }, [slug]);
  return <main className="info-page"><header className="info-header"><div className="container"><Link className="text-link" href={`/cakes/${slug}`}>← Back to cake</Link><p className="eyebrow">Customer notes</p><h1>Reviews for <em>{slug.replaceAll("-", " ")}</em></h1><p>Stories from customers who have ordered this cake.</p></div></header><section className="container info-content"><div className="info-faq">{error && <p role="alert">{error}</p>}{!error && reviews.length === 0 && <p>No published reviews yet.</p>}{reviews.map((review) => <article className="info-panel" key={review.id}><strong>{"★".repeat(review.rating)}</strong><h2>{review.title || "A lovely cake"}</h2><p>{review.body}</p><small>{review.authorName}</small></article>)}</div></section></main>;
}
