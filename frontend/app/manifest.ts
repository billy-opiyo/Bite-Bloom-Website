import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Bite & Bloom", short_name: "Bite & Bloom", description: "Thoughtful cakes baked fresh across Nairobi.", start_url: "/", display: "standalone", background_color: "#f8f5ef", theme_color: "#a65e56", icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }] };
}
