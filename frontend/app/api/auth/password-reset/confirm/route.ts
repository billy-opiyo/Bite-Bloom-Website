import { hash } from "bcryptjs";
import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { parseNewPassword, parseVerificationToken } from "../../../../../lib/server/auth-input";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";
import { enforceRateLimit } from "../../../../../lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "password-reset-confirm", 5, 15 * 60 * 1000);
  if (limited) return limited;
  const input = await request.json().catch(() => null) as { token?: unknown; password?: unknown } | null;
  const token = parseVerificationToken(input?.token);
  const password = parseNewPassword(input?.password);
  if (!token || !password) return apiError("VALIDATION_ERROR", "Use a valid reset token and a password of at least 12 characters.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Password reset is not configured yet.", 503);
  try {
    const prisma = getPrismaClient();
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || !record.identifier.startsWith("password-reset:") || record.expires < new Date()) return apiError("VALIDATION_ERROR", "That reset link has expired.", 400);
    const email = record.identifier.slice("password-reset:".length);
    if (!/^\S+@\S+\.\S+$/.test(email)) return apiError("VALIDATION_ERROR", "That reset link has expired.", 400);
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return apiError("VALIDATION_ERROR", "That reset link has expired.", 400);
    await prisma.$transaction([prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hash(password, 12), status: "ACTIVE" } }), prisma.verificationToken.delete({ where: { token } })]);
    return apiSuccess({ reset: true, message: "Your password has been updated." });
  } catch { return apiError("DATABASE_UNAVAILABLE", "Unable to reset your password right now.", 503); }
}
