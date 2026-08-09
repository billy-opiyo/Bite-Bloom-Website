import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type AddressInput = { label: string; recipientName: string; line1: string; line2: string | null; city: string; region: string | null; postalCode: string | null; country: string; phone: string | null; isDefault: boolean };

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

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to view your addresses.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Addresses are not configured yet.", 503);
  try {
    const addresses = await getPrismaClient().address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
    return apiSuccess(addresses.map(serializeAddress));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Your addresses are temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to save an address.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Addresses are not configured yet.", 503);
  const input = parseAddress(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Check the address details and country code.", 400);
  try {
    const address = await getPrismaClient().$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: session.user.id } });
      const isDefault = input.isDefault || count === 0;
      if (isDefault) await tx.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } });
      return tx.address.create({ data: { ...input, isDefault, userId: session.user.id } });
    });
    return apiSuccess(serializeAddress(address), { status: 201 });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to save your address right now.", 503);
  }
}
