import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track your cake order | Bite & Bloom",
  description: "Track the current preparation and delivery status of your Bite & Bloom cake order.",
  alternates: { canonical: "/tracking" },
};

export default function TrackingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
