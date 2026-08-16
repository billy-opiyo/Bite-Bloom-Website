import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and conditions | Bite & Bloom",
  description: "Review the draft ordering, delivery, payment, and account terms for Bite & Bloom.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
