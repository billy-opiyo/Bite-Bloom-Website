import Link from "next/link";

const links = [
  ["/admin/messages", "Messages"],
  ["/admin/promotions", "Promotions"],
  ["/admin/notifications", "Notifications"],
  ["/admin/audit", "Audit trail"],
] as const;

export default function AdminUtilityLinks() {
  return <nav className="admin-utility-links" aria-label="Admin utility pages">{links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav>;
}
