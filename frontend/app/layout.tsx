import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bite & Bloom — Cakes made for your moment",
  description:
    "Thoughtful cakes, baked fresh and delivered across Nairobi for every kind of celebration.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: { canonical: "/" },
  openGraph: { title: "Bite & Bloom — Cakes made for your moment", description: "Thoughtful cakes, baked fresh and delivered across Nairobi.", type: "website", siteName: "Bite & Bloom" },
  twitter: { card: "summary", title: "Bite & Bloom — Cakes made for your moment", description: "Thoughtful cakes, baked fresh and delivered across Nairobi." },
  other: { "theme-color": "#a65e56" },
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
