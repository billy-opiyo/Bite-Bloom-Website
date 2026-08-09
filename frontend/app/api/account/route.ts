import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../lib/server/env";
import { getPrismaClient } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseProfile(value: unknown): { name: string; phone: string | null } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = input.phone === undefined || input.phone === null || input.phone === "" ? null : typeof input.phone === "string" ? input.phone.trim() : null;
  if (name.length < 2 || name.length > 120 || (phone !== null && (phone.length < 7 || phone.length > 32))) return null;
  return { name, phone };
}

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to view your account.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Accounts are not configured yet.", 503);
  try {
    const user = await getPrismaClient().user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, loyaltyAccount: { select: { pointsBalance: true, lifetimePoints: true } } },
    });
    if (!user) return apiError("UNAUTHORIZED", "Your account is no longer available.", 401);
    return apiSuccess({ id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt, loyalty: user.loyaltyAccount ? { pointsBalance: user.loyaltyAccount.pointsBalance, lifetimePoints: user.loyaltyAccount.lifetimePoints } : null });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Your account is temporarily unavailable.", 503);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to update your account.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Accounts are not configured yet.", 503);
  const input = parseProfile(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Enter a name and an optional valid phone number.", 400);
  try {
    const user = await getPrismaClient().user.update({ where: { id: session.user.id }, data: input, select: { id: true, name: true, email: true, phone: true } });
    return apiSuccess(user);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to update your account right now.", 503);
  }
}
