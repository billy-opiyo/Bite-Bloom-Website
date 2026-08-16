import { randomBytes } from "crypto";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { enforceRateLimit } from "../../../../../lib/server/rate-limit";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "verify-email-resend", 3, 15 * 60 * 1000);
  if (limited) return limited;
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Email verification is not configured yet.", 503);
  const email = ((await request.json().catch(() => null) as { email?: unknown } | null)?.email as string | undefined)?.trim().toLowerCase();
  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return apiError("VALIDATION_ERROR", "Enter a valid email address.", 400);

  try {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true, emailVerified: true } });
    if (user && user.status === "PENDING" && !user.emailVerified) {
      const token = randomBytes(32).toString("hex");
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier: email } }),
        prisma.verificationToken.create({ data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) } }),
        prisma.notification.create({ data: { userId: user.id, channel: "EMAIL", template: "VERIFY_EMAIL", recipient: email, payload: { token } } }),
      ]);
    }
    return apiSuccess({ accepted: true, message: "If your account needs verification, a new link will be sent shortly." });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to resend verification right now.", 503);
  }
}
