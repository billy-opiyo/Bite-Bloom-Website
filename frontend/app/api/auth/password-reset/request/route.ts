import { randomBytes } from "crypto";
import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { parseAuthEmail } from "../../../../../lib/server/auth-input";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";
import { enforceRateLimit } from "../../../../../lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "password-reset", 5, 15 * 60 * 1000);
  if (limited) return limited;
  const email = parseAuthEmail(((await request.json().catch(() => null) as { email?: unknown } | null)?.email));
  if (!email) return apiError("VALIDATION_ERROR", "Enter a valid email address.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Password reset is not configured yet.", 503);
  try {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const token = randomBytes(32).toString("hex");
      await prisma.$transaction([prisma.verificationToken.deleteMany({ where: { identifier: `password-reset:${email}` } }), prisma.verificationToken.create({ data: { identifier: `password-reset:${email}`, token, expires: new Date(Date.now() + 60 * 60 * 1000) } }), prisma.notification.create({ data: { userId: user.id, channel: "EMAIL", template: "PASSWORD_RESET", recipient: email, payload: { token } } })]);
    }
    return apiSuccess({ accepted: true, message: "If an account exists, reset instructions will be sent shortly." });
  } catch { return apiError("DATABASE_UNAVAILABLE", "Unable to start password reset right now.", 503); }
}
