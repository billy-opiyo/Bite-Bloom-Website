"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicInfoPage from "../../../components/public/PublicInfoPage";

type Promotion = { code: string; description: string | null; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; value: number; minimumOrder: number | null; maximumDiscount: number | null; endsAt: string };

function formatPromotionValue(promotion: Promotion) {
  return promotion.discountType === "PERCENTAGE" ? `${promotion.value}% off` : `Ksh ${promotion.value.toLocaleString("en-KE")} off`;
}

export default function OffersPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promotions", { credentials: "same-origin" })
      .then(async (response) => response.ok ? (await response.json() as { data?: Promotion[] }).data ?? [] : [])
      .then(setPromotions)
      .catch(() => setPromotions([]))
      .finally(() => setLoading(false));
  }, []);

  return <PublicInfoPage eyebrow="Seasonal sweetness" title={<>Good things are <em>worth sharing.</em></>} intro="Browse live offers from the bakery team. Every promotion is checked again by the secure checkout before it is applied."><div className="offers-route">{loading && <div className="info-panel"><p role="status">Checking today&apos;s offers…</p></div>}{!loading && promotions.length > 0 && <div className="offers-grid">{promotions.map((promotion) => <article className="info-panel offer-card" key={promotion.code}><p className="eyebrow">Use code {promotion.code}</p><h2>{formatPromotionValue(promotion)}</h2><p>{promotion.description || "A little extra sweetness for your next order."}</p>{promotion.minimumOrder !== null && <small>Minimum order: Ksh {promotion.minimumOrder.toLocaleString("en-KE")}</small>}<small>Valid until {new Date(promotion.endsAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</small><Link className="button button-dark" href="/cakes">Shop the catalogue</Link></article>)}</div>}{!loading && promotions.length === 0 && <div className="info-panel"><h2>Find your next favourite.</h2><p>No live offers are configured right now, but the catalogue is always worth a look.</p><Link className="button button-dark" href="/cakes">Browse featured cakes</Link></div>}</div></PublicInfoPage>;
}
