import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cake ordering FAQs | Bite & Bloom",
  description: "Find answers about Bite & Bloom cake preparation, delivery, pickup, custom designs, and order support.",
  alternates: { canonical: "/faq" },
};

export default function FaqLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
