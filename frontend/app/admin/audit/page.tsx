"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuditRecord = { id: string; actorId: string | null; action: string; entityType: string; entityId: string | null; createdAt: string };

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminAuditPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/audit", { credentials: "same-origin" }).catch(() => null);
    if (response?.status === 401) {
      router.replace("/login?callbackUrl=/admin/audit");
      return;
    }
    const payload = await response?.json().catch(() => null) as { data?: AuditRecord[]; error?: { message?: string } } | null;
    if (!response?.ok) setMessage(payload?.error?.message ?? "Audit records are unavailable.");
    if (response?.ok) setRecords(payload?.data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <main className="loading-screen"><p>Loading audit records…</p></main>;
  return <main className="admin-page"><div className="admin-content admin-audit-route"><header className="admin-header"><div><Link href="/admin" className="admin-back-link">← Back to admin</Link><p className="eyebrow">Security observability</p><h1>Audit <em>trail.</em></h1><p>Review recorded administrative events without exposing change payloads or sensitive login data.</p></div><button className="button button-outline" type="button" onClick={() => void load()}>Refresh</button></header>{message && <p className="account-message" role="alert">{message}</p>}<section className="admin-panel-card"><div className="admin-card-heading"><div><span>Recent events</span><strong>{records.length} recorded actions</strong></div><span>Latest 100</span></div>{records.length ? <div className="audit-list">{records.map((record) => <article className="audit-row" key={record.id}><div><strong>{label(record.action)}</strong><small>{label(record.entityType)}{record.entityId ? ` · ${record.entityId}` : ""}</small></div><div><span>{record.actorId ? `Actor ${record.actorId}` : "System event"}</span><small>{new Date(record.createdAt).toLocaleString("en-KE")}</small></div></article>)}</div> : <p className="admin-empty-state">No audit events have been recorded yet. Coverage will grow as protected workflows add audit entries.</p>}</section></div></main>;
}
