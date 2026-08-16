import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cake offers | Bite & Bloom",
  description: "See currently active Bite & Bloom cake offers and seasonal promotions, checked again at secure checkout.",
  alternates: { canonical: "/offers" },
};

export default function OffersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
