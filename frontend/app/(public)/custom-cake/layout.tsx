import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a custom cake | Bite & Bloom",
  description: "Share your event, theme, guest count, budget, and cake brief with the Bite & Bloom bakery team.",
  alternates: { canonical: "/custom-cake" },
};

export default function CustomCakeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
