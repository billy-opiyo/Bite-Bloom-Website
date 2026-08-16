import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Bite & Bloom",
  description: "Contact Bite & Bloom for cake orders, custom cake ideas, delivery questions, and celebration support in Nairobi.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
