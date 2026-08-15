import type { Metadata } from "next";

import { getPublishedCake } from "../../../../lib/server/catalog";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Cake details — Bite & Bloom",
    description: "Choose a freshly baked cake for your next celebration.",
  };
  if (!hasDatabaseConfiguration()) return fallback;

  try {
    const cake = await getPublishedCake(params.slug);
    if (!cake) return fallback;
    const description = cake.description || `Freshly baked ${cake.name} from Bite & Bloom.`;
    const images = cake.images.flatMap((image) => image.url ? [image.url] : []);
    return {
      title: `${cake.name} — Bite & Bloom`,
      description,
      alternates: { canonical: `/cakes/${cake.slug}` },
      openGraph: {
        title: `${cake.name} — Bite & Bloom`,
        description,
        type: "website",
        ...(images.length > 0 ? { images } : {}),
      },
      twitter: { card: "summary_large_image", title: `${cake.name} — Bite & Bloom`, description, ...(images[0] ? { images: [images[0]] } : {}) },
    };
  } catch {
    return fallback;
  }
}

export default function CakeDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
