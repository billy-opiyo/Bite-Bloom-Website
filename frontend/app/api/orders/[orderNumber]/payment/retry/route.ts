import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../../lib/server/api-response";
import { hasDatabaseConfiguration } from "../../../../../../lib/server/env";
import { hasMpesaConfiguration, initiateStkPush } from "../../../../../../lib/server/mpesa";
import { getPrismaClient } from "../../../../../../lib/server/prisma";
import { enforceRateLimit } from "../../../../../../lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

class RetryError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function emailFrom(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const email = (value as Record<string, unknown>).email;
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email.trim()) ? email.trim().toLowerCase() : null;
}

export async function POST(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  const rateLimitResponse = enforceRateLimit(request, "payment-retry", 3, 15 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Payments are not configured yet.", 503);
  if (!hasMpesaConfiguration()) return apiError("CONFIGURATION_ERROR", "M-Pesa payments are not configured yet.", 503);
  const email = emailFrom(await request.json().catch(() => null));
  const orderNumber = params.orderNumber.trim().toUpperCase();
  if (!email || !/^[A-Z0-9-]{4,80}$/.test(orderNumber)) return apiError("VALIDATION_ERROR", "An order number and matching email are required.", 400);

  const temporaryReference = `RETRY-${randomUUID()}`;
  try {
    const payment = await getPrismaClient().$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { orderNumber, email, status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
        include: { payments: { where: { provider: "MPESA", status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 } },
      });
      if (!order) throw new RetryError(404, "A pending M-Pesa order matching those details was not found.");
      if (!order.phone) throw new RetryError(400, "This order does not have a valid M-Pesa phone number.");
      const pendingPayment = order.payments[0];
      if (!pendingPayment || pendingPayment.providerReference) throw new RetryError(409, "An M-Pesa request is already in progress for this order.");
      const locked = await tx.payment.updateMany({ where: { id: pendingPayment.id, providerReference: null, status: "PENDING" }, data: { providerReference: temporaryReference, metadata: { retryLockedAt: new Date().toISOString() } } });
      if (locked.count !== 1) throw new RetryError(409, "Another payment retry is already in progress.");
      return { id: pendingPayment.id, orderNumber: order.orderNumber, amount: Number(pendingPayment.amount), phone: order.phone };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    try {
      const stkPush = await initiateStkPush({ orderNumber: payment.orderNumber, amount: payment.amount, phone: payment.phone, description: `Bite & Bloom ${payment.orderNumber}` });
      await getPrismaClient().payment.update({ where: { id: payment.id }, data: { providerReference: stkPush.checkoutRequestId, metadata: { merchantRequestId: stkPush.merchantRequestId, checkoutRequestId: stkPush.checkoutRequestId, retriedAt: new Date().toISOString() } } });
      return apiSuccess({ orderNumber: payment.orderNumber, paymentInitiated: true, paymentMessage: stkPush.customerMessage });
    } catch {
      await getPrismaClient().payment.updateMany({ where: { id: payment.id, providerReference: temporaryReference }, data: { providerReference: null, metadata: { retryFailedAt: new Date().toISOString() } } });
      return apiError("DATABASE_UNAVAILABLE", "The M-Pesa prompt could not be started. Please try again shortly.", 503);
    }
  } catch (error) {
    if (error instanceof RetryError) return apiError("VALIDATION_ERROR", error.message, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError) return apiError("DATABASE_UNAVAILABLE", "Unable to retry payment right now.", 503);
    return apiError("DATABASE_UNAVAILABLE", "Unable to retry payment right now.", 503);
  }
}
