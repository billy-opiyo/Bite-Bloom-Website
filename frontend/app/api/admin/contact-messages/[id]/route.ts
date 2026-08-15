import { ContactMessageStatus } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession("customer:read");
  if (!session) return apiError("UNAUTHORIZED", "Customer read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Contact messages are not configured yet.", 503);
  const input = await request.json().catch(() => null) as { status?: unknown } | null;
  if (typeof input?.status !== "string" || !Object.values(ContactMessageStatus).includes(input.status as ContactMessageStatus)) return apiError("VALIDATION_ERROR", "Choose a valid contact message status.", 400);
  try {
    const message = await getPrismaClient().$transaction(async (tx) => {
      const updated = await tx.contactMessage.update({ where: { id: params.id }, data: { status: input.status as ContactMessageStatus } });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "CONTACT_MESSAGE_STATUS_UPDATED", entityType: "ContactMessage", entityId: updated.id, changes: { status: updated.status } } });
      return updated;
    });
    return apiSuccess({ id: message.id, status: message.status });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to update this contact message.", 503);
  }
}
