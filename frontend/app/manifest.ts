import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Bite & Bloom", short_name: "Bite & Bloom", description: "Thoughtful cakes baked fresh across Nairobi.", start_url: "/", display: "standalone", background_color: "#f8e4d2", theme_color: "#8b431d", icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }] };
}
