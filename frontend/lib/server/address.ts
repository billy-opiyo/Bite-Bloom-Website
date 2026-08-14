export type AddressInput = {
  label: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

export function parseAddress(value: unknown): AddressInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const text = (field: unknown, min: number, max: number) => typeof field === "string" && field.trim().length >= min && field.trim().length <= max ? field.trim() : null;
  const optional = (field: unknown, max: number) => field === undefined || field === null || field === "" ? null : text(field, 1, max);
  const label = text(input.label, 1, 80);
  const recipientName = text(input.recipientName, 2, 120);
  const line1 = text(input.line1, 3, 200);
  const city = text(input.city, 2, 120);
  const line2 = optional(input.line2, 200);
  const region = optional(input.region, 120);
  const postalCode = optional(input.postalCode, 32);
  const phone = optional(input.phone, 32);
  const country = typeof input.country === "string" ? input.country.trim().toUpperCase() : "";
  if (!label || !recipientName || !line1 || !city || line2 === null && input.line2 !== undefined && input.line2 !== null && input.line2 !== "" || region === null && input.region !== undefined && input.region !== null && input.region !== "" || postalCode === null && input.postalCode !== undefined && input.postalCode !== null && input.postalCode !== "" || phone === null && input.phone !== undefined && input.phone !== null && input.phone !== "" || !/^[A-Z]{2}$/.test(country) || input.isDefault !== undefined && typeof input.isDefault !== "boolean") return null;
  return { label, recipientName, line1, line2, city, region, postalCode, country, phone, isDefault: input.isDefault === true };
}

export function serializeAddress(address: { id: string; label: string; recipientName: string; line1: string; line2: string | null; city: string; region: string | null; postalCode: string | null; country: string; phone: string | null; isDefault: boolean; createdAt: Date; updatedAt: Date }) {
  return address;
}
