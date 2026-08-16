"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Loyalty = { pointsBalance: number; lifetimePoints: number; transactions: Array<{ id: string; type: "EARN" | "REDEEM" | "ADJUST" | "EXPIRE" | "REFUND"; points: number; balanceAfter: number; reason: string | null; createdAt: string; orderId: string | null }> };

const labels: Record<Loyalty["transactions"][number]["type"], string> = { EARN: "Points earned", REDEEM: "Points redeemed", ADJUST: "Account adjustment", EXPIRE: "Points expired", REFUND: "Points returned" };

export default function LoyaltyPage() {
  const router = useRouter();
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account/loyalty", { credentials: "same-origin" }).then(async (response) => {
      const payload = await response.json().catch(() => null) as { data?: Loyalty; error?: { message?: string } } | null;
      if (response.status === 401) { router.replace("/login?callbackUrl=/account/loyalty"); return; }
      if (!response.ok || !payload?.data) { setError(payload?.error?.message ?? "Loyalty history is unavailable."); return; }
      setLoyalty(payload.data);
    }).catch(() => setError("Loyalty history is unavailable."));
  }, [router]);

  if (error) return <main className="info-page"><section className="container info-content"><div className="info-panel"><h1>Loyalty <em>unavailable.</em></h1><p role="alert">{error}</p><Link className="button button-dark" href="/account">Back to account</Link></div></section></main>;
  if (!loyalty) return <main className="loading-screen"><p>Loading loyalty history…</p></main>;
  return <main className="account-page account-loyalty-page"><header className="account-page-header"><Link href="/account">← Back to account</Link><span>Loyalty history</span></header><section className="account-page-intro"><p className="eyebrow">Rewards, transparently</p><h1>Your <em>loyalty points.</em></h1><p>Your balance and recorded account movements, all in one place.</p></section><section className="account-overview"><article><strong>{loyalty.pointsBalance}</strong><span>Current balance</span></article><article><strong>{loyalty.lifetimePoints}</strong><span>Lifetime earned</span></article><article><strong>{loyalty.transactions.length}</strong><span>Recorded movements</span></article></section><section className="account-panel account-panel-wide"><h2>Points history</h2>{loyalty.transactions.length ? <div className="account-list">{loyalty.transactions.map((item) => <div key={item.id}><strong>{labels[item.type]} · {item.points > 0 ? "+" : ""}{item.points} points</strong><span>{item.reason || "Recorded by Bite & Bloom"} · Balance {item.balanceAfter} · {new Date(item.createdAt).toLocaleDateString("en-KE")}</span></div>)}</div> : <p>No loyalty movements have been recorded yet. Points will appear here once the approved earning rules are configured.</p>}</section></main>;
}
