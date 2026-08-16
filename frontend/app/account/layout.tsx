import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your Bite & Bloom account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><nav className="account-section-nav" aria-label="Account sections"><Link href="/account">Overview</Link><Link href="/account/wishlist">Wishlist</Link><Link href="/account/loyalty">Loyalty points</Link></nav>{children}</>;
}
