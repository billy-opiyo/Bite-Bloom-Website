"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AccountSectionNav() {
  return (
    <nav className="account-section-nav" aria-label="Account sections">
      <Link href="/account">Overview</Link>
      <Link href="/account/wishlist">Wishlist</Link>
      <Link href="/account/loyalty">Loyalty points</Link>
      <button className="account-signout" type="button" onClick={() => void signOut({ callbackUrl: "/" })}>Sign out</button>
    </nav>
  );
}
