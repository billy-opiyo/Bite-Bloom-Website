import { ContactMessageStatus } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getAdminSession } from "../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await getAdminSession("customer:read"))) return apiError("UNAUTHORIZED", "Customer read permission is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Contact messages are not configured yet.", 503);
  const status = request.nextUrl.searchParams.get("status");
  if (status && !Object.values(ContactMessageStatus).includes(status as ContactMessageStatus)) return apiError("VALIDATION_ERROR", "Choose a valid contact message status.", 400);
  try {
    const messages = await getPrismaClient().contactMessage.findMany({
      where: status ? { status: status as ContactMessageStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, email: true, message: true, source: true, status: true, createdAt: true, updatedAt: true },
    });
    return apiSuccess(messages);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Contact messages are temporarily unavailable.", 503);
  }
}
