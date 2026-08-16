import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy | Bite & Bloom",
  description: "Read how Bite & Bloom handles customer, order, account, and website information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
