import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";
import { redactNotificationRecipient } from "../../../../lib/shared/notification-privacy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession("notification:read"))) return apiError("UNAUTHORIZED", "Notification read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Notifications are not configured yet.", 503);
  try {
    const notifications = await getPrismaClient().notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, channel: true, template: true, recipient: true, status: true, attempts: true, providerMessageId: true, sentAt: true, deliveredAt: true, failedAt: true, failureReason: true, createdAt: true, updatedAt: true },
    });
    return apiSuccess(notifications.map((notification) => ({ ...notification, recipient: redactNotificationRecipient(notification.recipient) })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Notification records are temporarily unavailable.", 503);
  }
}
