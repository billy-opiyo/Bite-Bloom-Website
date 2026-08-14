const whatsappPhone = (process.env.NEXT_PUBLIC_WHATSAPP_ORDER_PHONE || "254711222333").replace(/\D/g, "");

export const siteConfig = {
  name: "Bite & Bloom",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@biteandbloom.co.ke",
  phoneDisplay: process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || "+254 711 222 333",
  phoneHref: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+254711222333",
  whatsappPhone,
  address: process.env.NEXT_PUBLIC_STUDIO_ADDRESS || "13 Riverside Lane, Kilimani · Nairobi",
  mapSearchUrl:
    process.env.NEXT_PUBLIC_MAP_SEARCH_URL ||
    "https://www.google.com/maps/search/?api=1&query=Kilimani%2C%20Nairobi",
  mapEmbedUrl:
    process.env.NEXT_PUBLIC_MAP_EMBED_URL || "https://www.google.com/maps?q=Kilimani%20Nairobi&output=embed",
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://tiktok.com",
  },
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
