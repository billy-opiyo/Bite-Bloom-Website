import "server-only";

import { OrderStatus, Prisma } from "@prisma/client";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "FAILED", "CANCELLED"],
  PAID: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_DISPATCH"],
  READY_FOR_DISPATCH: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export async function transitionOrder(tx: Prisma.TransactionClient, input: { orderId: string; toStatus: OrderStatus; actorId: string; reason?: string }) {
  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    include: { payments: true, inventoryReservations: { where: { status: "ACTIVE" }, include: { inventoryItem: true } } },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (!canTransitionOrder(order.status, input.toStatus)) throw new Error("INVALID_TRANSITION");

  if (input.toStatus === "PREPARING") {
    for (const reservation of order.inventoryReservations) {
      const inventory = reservation.inventoryItem;
      await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityOnHand: { decrement: reservation.quantity }, quantityReserved: { decrement: reservation.quantity } } });
      await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: "CONSUMED", consumedAt: new Date() } });
      await tx.stockMovement.create({ data: { inventoryItemId: inventory.id, actorId: input.actorId, type: "SALE", quantityDelta: -reservation.quantity, quantityBefore: inventory.quantityOnHand, quantityAfter: inventory.quantityOnHand - reservation.quantity, referenceType: "ORDER", referenceId: order.id, reason: "Inventory consumed for production" } });
    }
  }

  if (input.toStatus === "CANCELLED" || input.toStatus === "FAILED") {
    for (const reservation of order.inventoryReservations) {
      const inventory = reservation.inventoryItem;
      await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantityReserved: { decrement: reservation.quantity } } });
      await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: "RELEASED", releasedAt: new Date() } });
      await tx.stockMovement.create({ data: { inventoryItemId: inventory.id, actorId: input.actorId, type: "RELEASE", quantityDelta: -reservation.quantity, quantityBefore: inventory.quantityReserved, quantityAfter: inventory.quantityReserved - reservation.quantity, referenceType: "ORDER", referenceId: order.id, reason: input.reason ?? "Order cancelled or failed" } });
    }
  }

  const isCashDelivery = input.toStatus === "DELIVERED" && order.payments.some((payment) => payment.provider === "CASH" && payment.status === "PENDING");
  if (isCashDelivery) {
    await tx.payment.updateMany({ where: { orderId: order.id, provider: "CASH", status: "PENDING" }, data: { status: "PAID", paidAt: new Date() } });
  }

  const updated = await tx.order.update({ where: { id: order.id }, data: { status: input.toStatus, ...(isCashDelivery ? { paymentStatus: "PAID" } : {}) } });
  await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: input.toStatus, changedById: input.actorId, reason: input.reason } });
  return updated;
}
