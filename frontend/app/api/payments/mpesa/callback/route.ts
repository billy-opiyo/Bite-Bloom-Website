import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CallbackItem = { Name?: string; Value?: string | number };
type StkCallback = { MerchantRequestID?: string; CheckoutRequestID?: string; ResultCode?: number; ResultDesc?: string; CallbackMetadata?: { Item?: CallbackItem[] } };

function callbackResponse() {
  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null) as { Body?: { stkCallback?: StkCallback } } | null;
  const callback = payload?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID || typeof callback.ResultCode !== "number") return callbackResponse();

  try {
    await getPrismaClient().$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({ where: { provider: "MPESA", providerReference: callback.CheckoutRequestID }, include: { order: { include: { inventoryReservations: { where: { status: "ACTIVE" }, include: { inventoryItem: true } } } } } });
      if (!payment || payment.status !== "PENDING") return;
      const items = callback.CallbackMetadata?.Item ?? [];
      const receipt = items.find((item) => item.Name === "MpesaReceiptNumber")?.Value;
      const amount = items.find((item) => item.Name === "Amount")?.Value;
      const paidAmount = typeof amount === "number" ? amount : Number(amount);
      const metadata: Prisma.InputJsonValue = { merchantRequestId: callback.MerchantRequestID ?? null, resultCode: callback.ResultCode, resultDesc: callback.ResultDesc ?? null, receipt: typeof receipt === "string" ? receipt : null, paidAmount: Number.isFinite(paidAmount) ? paidAmount : null };

      if (callback.ResultCode === 0 && paidAmount === Number(payment.amount)) {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID", paidAt: new Date(), metadata } });
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID", paymentStatus: "PAID" } });
        await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, fromStatus: "PENDING_PAYMENT", toStatus: "PAID", reason: "M-Pesa payment confirmed", metadata } });
        return;
      }

      await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED", metadata } });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: "FAILED", paymentStatus: "FAILED" } });
      await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, fromStatus: "PENDING_PAYMENT", toStatus: "FAILED", reason: callback.ResultDesc ?? "M-Pesa payment failed", metadata } });
      for (const reservation of payment.order.inventoryReservations) {
        await tx.inventoryItem.update({ where: { id: reservation.inventoryItemId }, data: { quantityReserved: { decrement: reservation.quantity } } });
        await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: "RELEASED", releasedAt: new Date() } });
        await tx.stockMovement.create({ data: { inventoryItemId: reservation.inventoryItemId, type: "RELEASE", quantityDelta: -reservation.quantity, quantityBefore: reservation.inventoryItem.quantityReserved, quantityAfter: reservation.inventoryItem.quantityReserved - reservation.quantity, referenceType: "ORDER", referenceId: payment.orderId, reason: "M-Pesa payment failed or amount mismatched" } });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch {
    // Safaricom callbacks are retried; return a successful acknowledgement and rely on idempotent processing.
  }
  return callbackResponse();
}
