"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Customer = {
  email: string;
  name: string | null;
  phone: string | null;
  accountId: string | null;
  accountStatus: string | null;
  joinedAt: string | null;
  loyalty: { pointsBalance: number; lifetimePoints: number } | null;
  orderCount: number;
  totalSpent: number;
};
type CustomerOrder = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  total: number;
  placedAt: string;
  shipment: { status: string; courier: string | null; trackingNumber: string | null } | null;
  items: Array<{ cakeName: string; variantName: string | null; quantity: number; lineTotal: number }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}

function displayStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not linked";
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ email: string }>();
  const router = useRouter();
  const rawEmail = params?.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) return;
    async function load() {
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`, { credentials: "same-origin" }).catch(() => null);
      if (response?.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/admin/customers/${email}`)}`);
        return;
      }
      const payload = await response?.json().catch(() => null) as { data?: { customer: Customer; orders: CustomerOrder[] }; error?: { message?: string } } | null;
      if (!response?.ok || !payload?.data) {
        setMessage(payload?.error?.message ?? "Customer details are unavailable right now.");
        setLoading(false);
        return;
      }
      setCustomer(payload.data.customer);
      setOrders(payload.data.orders);
      setLoading(false);
    }
    void load();
  }, [email, router]);

  if (loading) return <main className="loading-screen"><p>Loading customer details…</p></main>;
  if (message || !customer) return <main className="info-page"><div className="container"><Link className="text-link" href="/admin">← Back to admin</Link><section className="info-panel"><p className="account-message" role="alert">{message || "Customer details are unavailable."}</p></section></div></main>;

  return <main className="admin-page"><div className="admin-content admin-customer-detail-route"><header className="admin-header"><div><Link href="/admin" className="admin-back-link">← Back to customers</Link><p className="eyebrow">Protected customer record</p><h1>{customer.name ?? "Customer"} <em>details.</em></h1><p>{customer.email} · {customer.phone ?? "No phone recorded"}</p></div><span className="secure-label">Server-authorized</span></header><div className="customer-detail-stats"><article><span>Total spent</span><strong>{money(customer.totalSpent)}</strong></article><article><span>Orders</span><strong>{customer.orderCount}</strong></article><article><span>Loyalty points</span><strong>{customer.loyalty?.pointsBalance ?? 0}</strong></article><article><span>Account</span><strong>{displayStatus(customer.accountStatus)}</strong></article></div><section className="admin-panel-card"><div className="admin-card-heading"><div><span>Customer profile</span><strong>Privacy-scoped details</strong></div><span>{customer.joinedAt ? `Since ${new Date(customer.joinedAt).toLocaleDateString("en-KE")}` : "Guest history"}</span></div><div className="customer-detail-profile"><span>Email <strong>{customer.email}</strong></span><span>Phone <strong>{customer.phone ?? "Not recorded"}</strong></span><span>Account ID <strong>{customer.accountId ?? "Guest customer"}</strong></span><span>Lifetime points <strong>{customer.loyalty?.lifetimePoints ?? 0}</strong></span></div></section><section className="admin-panel-card"><div className="admin-card-heading"><div><span>Order history</span><strong>{orders.length} recent orders</strong></div><span>Latest 100</span></div>{orders.length ? <div className="customer-order-list">{orders.map((order) => <article key={order.orderNumber}><div><strong><Link href={`/admin/orders/${encodeURIComponent(order.orderNumber)}/receipt`}>{order.orderNumber}</Link></strong><small>{new Date(order.placedAt).toLocaleString("en-KE")} · {displayStatus(order.fulfillmentType)}</small></div><div><span>{order.items.map((item) => `${item.quantity} × ${item.cakeName}${item.variantName ? ` · ${item.variantName}` : ""}`).join(", ")}</span><small>{displayStatus(order.status)} · {displayStatus(order.paymentStatus)} · {money(order.total)}</small></div><span>{order.shipment ? `${displayStatus(order.shipment.status)}${order.shipment.courier ? ` · ${order.shipment.courier}` : ""}` : "No shipment"}</span></article>)}</div> : <p className="admin-empty-state">No orders found for this customer.</p>}</section></div></main>;
}
