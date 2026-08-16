import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { parseVerificationToken } from "../../../../lib/server/auth-input";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";
import { enforceRateLimit } from "../../../../lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "verify-email", 5, 15 * 60 * 1000);
  if (limited) return limited;
  const token = parseVerificationToken((await request.json().catch(() => null) as { token?: unknown } | null)?.token);
  if (!token) return apiError("VALIDATION_ERROR", "A valid verification token is required.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Email verification is not configured yet.", 503);
  try {
    const prisma = getPrismaClient();
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.expires < new Date() || record.identifier.includes(":") || !/^\S+@\S+\.\S+$/.test(record.identifier)) return apiError("VALIDATION_ERROR", "That verification link has expired.", 400);
    const user = await prisma.user.findUnique({ where: { email: record.identifier }, select: { id: true } });
    if (!user) return apiError("VALIDATION_ERROR", "That verification link has expired.", 400);
    await prisma.$transaction([prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), status: "ACTIVE" } }), prisma.verificationToken.delete({ where: { token } })]);
    return apiSuccess({ verified: true, message: "Your email has been verified." });
  } catch { return apiError("DATABASE_UNAVAILABLE", "Unable to verify this email right now.", 503); }
}
