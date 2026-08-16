export type ContactMessageInput = {
  name: string;
  email: string;
  message: string;
  source?: string;
};

export type NewsletterInput = {
  email: string;
  consent: true;
};

function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= min && normalized.length <= max ? normalized : null;
}

function email(value: unknown): string | null {
  const normalized = text(value, 3, 254)?.toLowerCase() ?? null;
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export function parseEmailAddress(value: unknown): string | null {
  return email(value);
}

export function parseContactMessage(value: unknown): ContactMessageInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const name = text(input.name, 2, 120);
  const address = parseEmailAddress(input.email);
  const message = text(input.message, 5, 4000);
  if (!name || !address || !message) return null;
  const source = typeof input.source === "string" && /^[a-z0-9_-]{1,48}$/.test(input.source) ? input.source : "website";
  return { name, email: address, message, source };
}

export function parseNewsletter(value: unknown): NewsletterInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const address = parseEmailAddress(input.email);
  if (!address || input.consent !== true) return null;
  return { email: address, consent: true };
}
