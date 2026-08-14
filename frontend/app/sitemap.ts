import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://biteandbloom.co.ke";
  return ["/", "/cakes", "/about", "/faq", "/contact", "/offers", "/privacy", "/terms", "/cookies"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/cakes" ? "daily" : "monthly", priority: path === "/" ? 1 : .7 }));
}
