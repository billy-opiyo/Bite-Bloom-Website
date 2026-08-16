import { getAuthenticatedSession } from "../../../../lib/server/access";
import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to view your loyalty history.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Loyalty is not configured yet.", 503);
  try {
    const account = await getPrismaClient().loyaltyAccount.findUnique({ where: { userId: session.user.id }, include: { transactions: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, type: true, points: true, balanceAfter: true, reason: true, createdAt: true, orderId: true } } } });
    return apiSuccess({ pointsBalance: account?.pointsBalance ?? 0, lifetimePoints: account?.lifetimePoints ?? 0, transactions: account?.transactions ?? [] });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Your loyalty history is temporarily unavailable.", 503);
  }
}
