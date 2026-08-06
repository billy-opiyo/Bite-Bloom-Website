import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bite & Bloom — Cakes made for your moment",
  description:
    "Thoughtful cakes, baked fresh and delivered across Nairobi for every kind of celebration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
