"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = { id: string; channel: string; template: string; recipient: string; status: string; attempts: number; providerMessageId: string | null; sentAt: string | null; deliveredAt: string | null; failedAt: string | null; failureReason: string | null; createdAt: string; updatedAt: string };

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/notifications", { credentials: "same-origin" }).catch(() => null);
    if (response?.status === 401) {
      router.replace("/login?callbackUrl=/admin/notifications");
      return;
    }
    const payload = await response?.json().catch(() => null) as { data?: Notification[]; error?: { message?: string } } | null;
    if (!response?.ok) setMessage(payload?.error?.message ?? "Notification records are unavailable.");
    if (response?.ok) setItems(payload?.data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <main className="loading-screen"><p>Loading notification records…</p></main>;
  return <main className="admin-page"><div className="admin-content admin-notifications-route"><header className="admin-header"><div><Link href="/admin/messages" className="admin-back-link">← Back to messages</Link><p className="eyebrow">Delivery observability</p><h1>Notification <em>queue.</em></h1><p>Review delivery metadata without exposing notification payloads or reset tokens.</p></div><button className="button button-outline" type="button" onClick={() => void load()}>Refresh</button></header>{message && <p className="account-message" role="alert">{message}</p>}<section className="admin-panel-card"><div className="admin-card-heading"><div><span>Recent records</span><strong>{items.length} notifications</strong></div><span>Latest 100</span></div>{items.length ? <div className="notification-list">{items.map((item) => <article className="notification-row" key={item.id}><div><strong>{label(item.template)}</strong><small>{label(item.channel)} · {item.recipient}</small></div><div><span className={`notification-status notification-status-${item.status.toLowerCase()}`}>{label(item.status)}</span><small>{item.attempts} attempt{item.attempts === 1 ? "" : "s"} · {new Date(item.createdAt).toLocaleString("en-KE")}</small></div><p>{item.failureReason ?? (item.deliveredAt ? `Delivered ${new Date(item.deliveredAt).toLocaleString("en-KE")}` : item.sentAt ? `Sent ${new Date(item.sentAt).toLocaleString("en-KE")}` : "Awaiting provider delivery")}</p></article>)}</div> : <p className="admin-empty-state">No notification records have been queued.</p>}</section></div></main>;
}
