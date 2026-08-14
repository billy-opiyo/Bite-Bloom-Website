import { hash } from "bcryptjs";
import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Password reset is not configured yet.", 503);
  const input = await request.json().catch(() => null) as { token?: unknown; password?: unknown } | null;
  if (typeof input?.token !== "string" || typeof input.password !== "string" || input.password.length < 12 || input.password.length > 128) return apiError("VALIDATION_ERROR", "Use a valid reset token and a password of at least 12 characters.", 400);
  try {
    const prisma = getPrismaClient();
    const record = await prisma.verificationToken.findUnique({ where: { token: input.token } });
    if (!record || !record.identifier.startsWith("password-reset:") || record.expires < new Date()) return apiError("VALIDATION_ERROR", "That reset link has expired.", 400);
    const email = record.identifier.slice("password-reset:".length);
    await prisma.$transaction([prisma.user.update({ where: { email }, data: { passwordHash: await hash(input.password, 12), status: "ACTIVE" } }), prisma.verificationToken.delete({ where: { token: input.token } })]);
    return apiSuccess({ reset: true, message: "Your password has been updated." });
  } catch { return apiError("DATABASE_UNAVAILABLE", "Unable to reset your password right now.", 503); }
}
