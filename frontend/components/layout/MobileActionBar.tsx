"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ActionIcon = "home" | "cart" | "shop" | "wishlist" | "account";

const actions: Array<{ href: string; label: string; icon: ActionIcon }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/cart", label: "Cart", icon: "cart" },
  { href: "/cakes", label: "Shop", icon: "shop" },
  { href: "/account/wishlist", label: "Wishlist", icon: "wishlist" },
  { href: "/account", label: "Account", icon: "account" },
];

function ActionIcon({ name }: { name: ActionIcon }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...props}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>;
  if (name === "cart") return <svg {...props}><path d="M3 4h2l2 11h10l3-8H6" /><path d="M9 19.5a1 1 0 1 0 .01 0" /><path d="M17 19.5a1 1 0 1 0 .01 0" /></svg>;
  if (name === "shop") return <svg {...props}><path d="M4 10h16v10H4z" /><path d="m3 10 2-6h14l2 6" /><path d="M8 10v3h8v-3" /><path d="M8 20v-5h8v5" /></svg>;
  if (name === "account") return <svg {...props}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.3 3.2-5 7.5-5s6.7 1.7 7.5 5" /></svg>;
  return <svg {...props}><path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" /></svg>;
}

export default function MobileActionBar() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/admin");

  if (hidden) return null;

  return <nav className="mobile-action-bar" aria-label="Quick navigation"><div className="mobile-action-bar-inner">{actions.map((action) => {
    const active = action.href === "/" ? pathname === "/" : action.href === "/account" ? pathname === "/account" || (pathname.startsWith("/account/") && !pathname.startsWith("/account/wishlist")) : pathname === action.href || pathname.startsWith(`${action.href}/`);
    return <Link className={`mobile-action-link${active ? " active" : ""}`} href={action.href} key={action.href} aria-current={active ? "page" : undefined}><span className="mobile-action-icon"><ActionIcon name={action.icon} /></span><span>{action.label}</span></Link>;
  })}</div></nav>;
}
