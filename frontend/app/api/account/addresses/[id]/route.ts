import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../../lib/server/access";
import { parseAddress, serializeAddress } from "../../../../../lib/server/address";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to update an address.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Addresses are not configured yet.", 503);
  const input = parseAddress(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Check the address details and country code.", 400);
  try {
    const prisma = getPrismaClient();
    const address = await prisma.$transaction(async (tx) => {
      const current = await tx.address.findFirst({ where: { id: params.id, userId: session.user.id } });
      if (!current) return null;
      if (input.isDefault) await tx.address.updateMany({ where: { userId: session.user.id, isDefault: true, id: { not: current.id } }, data: { isDefault: false } });
      return tx.address.update({ where: { id: current.id }, data: input });
    });
    if (!address) return apiError("VALIDATION_ERROR", "Address not found.", 404);
    return apiSuccess(serializeAddress(address));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to update your address right now.", 503);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to remove an address.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Addresses are not configured yet.", 503);
  try {
    const deleted = await getPrismaClient().address.deleteMany({ where: { id: params.id, userId: session.user.id } });
    if (deleted.count === 0) return apiError("VALIDATION_ERROR", "Address not found.", 404);
    return apiSuccess({ id: params.id, deleted: true });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to remove your address right now.", 503);
  }
}
