import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Bite & Bloom",
  description: "Meet Bite & Bloom, a Nairobi cake studio creating thoughtful cakes for celebrations big and small.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
