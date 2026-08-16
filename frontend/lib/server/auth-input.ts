import { parseEmailAddress } from "./public-forms";

export function parseAuthEmail(value: unknown): string | null {
  return parseEmailAddress(value);
}

export function parseVerificationToken(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 32 || value.length > 128) return null;
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : null;
}

export function parseNewPassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) return null;
  return value;
}
