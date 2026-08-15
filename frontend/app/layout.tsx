import type { Metadata } from "next";
import "./globals.css";
import MobileActionBar from "../components/layout/MobileActionBar";
import SplashGate from "../components/layout/SplashGate";

export const metadata: Metadata = {
  title: "Bite & Bloom — Cakes made for your moment",
  description:
    "Thoughtful cakes, baked fresh and delivered across Nairobi for every kind of celebration.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: { canonical: "/" },
  openGraph: { title: "Bite & Bloom — Cakes made for your moment", description: "Thoughtful cakes, baked fresh and delivered across Nairobi.", type: "website", siteName: "Bite & Bloom" },
  twitter: { card: "summary", title: "Bite & Bloom — Cakes made for your moment", description: "Thoughtful cakes, baked fresh and delivered across Nairobi." },
  other: { "theme-color": "#8b431d" },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { document.documentElement.dataset.theme = localStorage.getItem("bite-bloom-theme") || "dark"; } catch (error) { document.documentElement.dataset.theme = "dark"; }`,
          }}
        />
      </head>
      <body><SplashGate>{children}</SplashGate><MobileActionBar /></body>
    </html>
  );
}
