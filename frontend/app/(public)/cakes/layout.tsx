import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop cakes | Bite & Bloom",
  description: "Browse freshly baked Bite & Bloom cakes for birthdays, weddings, milestones, and everyday celebrations in Nairobi.",
  alternates: { canonical: "/cakes" },
};

export default function CakesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
