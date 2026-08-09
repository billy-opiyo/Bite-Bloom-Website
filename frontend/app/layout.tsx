import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bite & Bloom — Cakes made for your moment",
  description:
    "Thoughtful cakes, baked fresh and delivered across Nairobi for every kind of celebration.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
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
