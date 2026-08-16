"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MessageStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";
type ContactMessage = { id: string; name: string; email: string; message: string; source: string; status: MessageStatus; createdAt: string };
type Subscriber = { id: string; email: string; status: "SUBSCRIBED" | "UNSUBSCRIBED"; subscribedAt: string; unsubscribedAt: string | null };

const statusLabels: Record<MessageStatus, string> = { NEW: "New", IN_PROGRESS: "In progress", RESOLVED: "Resolved", SPAM: "Spam" };

function sourceLabel(source: string) {
  if (source === "custom-cake") return "Custom cake request";
  if (source === "website") return "Website contact form";
  return source.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MessageStatus>("ALL");

  const visibleMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return messages.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesQuery = !normalizedQuery || [item.name, item.email, item.message, item.source].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [messages, query, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    const [messagesResponse, subscribersResponse] = await Promise.all([
      fetch("/api/admin/contact-messages", { credentials: "same-origin" }),
      fetch("/api/admin/newsletter", { credentials: "same-origin" }),
    ]);
    if (messagesResponse.status === 401 || subscribersResponse.status === 401) {
      router.replace("/login?callbackUrl=/admin/messages");
      return;
    }
    const messagesPayload = await messagesResponse.json().catch(() => null) as { data?: ContactMessage[]; error?: { message?: string } } | null;
    const subscribersPayload = await subscribersResponse.json().catch(() => null) as { data?: Subscriber[] } | null;
    if (!messagesResponse.ok) setMessage(messagesPayload?.error?.message ?? "Contact messages are unavailable.");
    if (messagesResponse.ok) setMessages(messagesPayload?.data ?? []);
    if (subscribersResponse.ok) setSubscribers(subscribersPayload?.data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(item: ContactMessage, status: MessageStatus) {
    const response = await fetch(`/api/admin/contact-messages/${item.id}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => null);
    if (!response?.ok) { setMessage("Unable to update that message right now."); return; }
    setMessages((items) => items.map((current) => current.id === item.id ? { ...current, status } : current));
  }

  if (loading) return <main className="loading-screen"><p>Loading communication records…</p></main>;

  return <main className="admin-page"><div className="admin-content admin-messages-route"><header className="admin-header"><div><Link href="/admin" className="admin-back-link">← Back to admin</Link><p className="eyebrow">Customer conversations</p><h1>Messages &amp; <em>subscribers.</em></h1><p>Review contact requests and newsletter records from the protected communication endpoints.</p></div><button className="button button-outline" type="button" onClick={() => void load()}>Refresh</button></header>{message && <p className="account-message" role="alert">{message}</p>}<section className="admin-panel-card"><div className="admin-card-heading"><div><span>Contact form</span><strong>{visibleMessages.length} of {messages.length} recent messages</strong></div><span>Latest 100</span></div><div className="admin-message-filters"><label><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, message…" /></label><label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | MessageStatus)}><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{messages.length ? visibleMessages.length ? <div className="admin-message-list">{visibleMessages.map((item) => <article className="admin-message-card" key={item.id}><div><strong>{item.name}</strong><small>{item.email} · {new Date(item.createdAt).toLocaleString("en-KE")}</small><span className="message-source">{sourceLabel(item.source)}</span></div><p>{item.message}</p><label><span>Status</span><select value={item.status} onChange={(event) => void updateStatus(item, event.target.value as MessageStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></article>)}</div> : <p className="admin-empty-state">No messages match the current filters.</p> : <p className="admin-empty-state">No contact messages have been recorded.</p>}</section><section className="admin-panel-card"><div className="admin-card-heading"><div><span>Newsletter</span><strong>{subscribers.filter((item) => item.status === "SUBSCRIBED").length} active subscribers</strong></div><span>{subscribers.length} records</span></div>{subscribers.length ? <div className="admin-message-list">{subscribers.map((item) => <div className="admin-message-card" key={item.id}><div><strong>{item.email}</strong><small>Subscribed {new Date(item.subscribedAt).toLocaleDateString("en-KE")}</small></div><span className={item.status === "SUBSCRIBED" ? "stock-good" : "low-stock"}>{item.status === "SUBSCRIBED" ? "Subscribed" : "Unsubscribed"}</span></div>)}</div> : <p className="admin-empty-state">No newsletter records have been recorded.</p>}</section></div></main>;
}
