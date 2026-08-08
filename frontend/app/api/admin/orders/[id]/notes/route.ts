import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NoteInput = { body: string; isPrivate: boolean };

function parseNote(value: unknown): NoteInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 1 || body.length > 2000) return null;
  if (input.isPrivate !== undefined && typeof input.isPrivate !== "boolean") return null;
  return { body, isPrivate: input.isPrivate !== false };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  try {
    const order = await getPrismaClient().order.findUnique({
      where: { id: params.id },
      select: { orderNotes: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } } },
    });
    if (!order) return apiError("VALIDATION_ERROR", "Order not found.", 404);
    return apiSuccess(order.orderNotes.map((note) => ({ id: note.id, body: note.body, isPrivate: note.isPrivate, createdAt: note.createdAt, author: note.author ? { name: note.author.name, email: note.author.email } : null })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Order notes are temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Orders are not configured yet.", 503);
  const input = parseNote(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "A note must be between 1 and 2,000 characters.", 400);
  try {
    const prisma = getPrismaClient();
    const note = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: params.id }, select: { id: true } });
      if (!order) return null;
      const created = await tx.orderNote.create({
        data: { orderId: order.id, authorId: session.user.id, body: input.body, isPrivate: input.isPrivate },
        include: { author: { select: { name: true, email: true } } },
      });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "ORDER_NOTE_CREATED", entityType: "Order", entityId: order.id, changes: { noteId: created.id, isPrivate: input.isPrivate, characterCount: input.body.length } } });
      return created;
    });
    if (!note) return apiError("VALIDATION_ERROR", "Order not found.", 404);
    return apiSuccess({ id: note.id, body: note.body, isPrivate: note.isPrivate, createdAt: note.createdAt, author: note.author ? { name: note.author.name, email: note.author.email } : null }, { status: 201 });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to save that order note right now.", 503);
  }
}
