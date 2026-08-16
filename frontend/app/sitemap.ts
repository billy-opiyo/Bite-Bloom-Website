import type { MetadataRoute } from "next";
import { listPublishedCakes } from "../lib/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://biteandbloom.co.ke";
  const staticRoutes = ["/", "/cakes", "/about", "/faq", "/contact", "/custom-cake", "/offers", "/privacy", "/terms", "/cookies"];
  let cakeRoutes: MetadataRoute.Sitemap = [];
  try {
    const cakes = await listPublishedCakes();
    cakeRoutes = cakes.map((cake) => ({ url: `${base}/cakes/${cake.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .8 }));
  } catch {
    // Keep the static sitemap available before a development database is configured.
  }
  return [...staticRoutes.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/cakes" ? "daily" as const : "monthly" as const, priority: path === "/" ? 1 : .7 })), ...cakeRoutes];
}
