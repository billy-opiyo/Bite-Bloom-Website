import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RegistrationInput = { name: string; email: string; password: string };

function parseRegistration(value: unknown): RegistrationInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (name.length < 2 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) return null;
  return { name, email, password };
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Accounts are not configured yet.", 503);
  const input = parseRegistration(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Enter your name, a valid email, and a password of at least 12 characters.", 400);

  try {
    const prisma = getPrismaClient();
    const passwordHash = await hash(input.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const customerRole = await tx.role.findUnique({ where: { key: "customer" }, select: { id: true } });
      if (!customerRole) throw new Error("CUSTOMER_ROLE_MISSING");
      const created = await tx.user.create({ data: { name: input.name, email: input.email, passwordHash, status: "ACTIVE" }, select: { id: true, name: true, email: true } });
      await tx.userRole.create({ data: { userId: created.id, roleId: customerRole.id } });
      await tx.order.updateMany({ where: { email: input.email, userId: null }, data: { userId: created.id } });
      await tx.auditLog.create({ data: { actorId: created.id, action: "CUSTOMER_REGISTERED", entityType: "User", entityId: created.id } });
      const token = randomBytes(32).toString("hex");
      await tx.verificationToken.create({ data: { identifier: input.email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      await tx.notification.create({ data: { userId: created.id, channel: "EMAIL", template: "VERIFY_EMAIL", recipient: input.email, payload: { token } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return apiSuccess({ id: user.id, name: user.name, email: user.email, message: "Your account is ready. Please sign in." }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return apiError("VALIDATION_ERROR", "An account with that email already exists.", 409);
    if (error instanceof Error && error.message === "CUSTOMER_ROLE_MISSING") return apiError("CONFIGURATION_ERROR", "Accounts need initial role setup. Run the database seed first.", 503);
    return apiError("DATABASE_UNAVAILABLE", "Unable to create your account right now.", 503);
  }
}
