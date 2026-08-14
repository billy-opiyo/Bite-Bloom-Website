import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../lib/server/access";
import { parseAddress, serializeAddress } from "../../../../lib/server/address";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
