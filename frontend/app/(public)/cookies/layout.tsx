import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie policy | Bite & Bloom",
  description: "Learn how Bite & Bloom uses necessary storage and optional measurement technologies.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
