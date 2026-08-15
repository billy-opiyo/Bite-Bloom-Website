import "server-only";

import { getPrismaClient } from "./prisma";

export const DELIVERY_SLOTS = ["10:00am – 12:00pm", "12:00pm – 2:00pm", "3:00pm – 5:00pm"] as const;
const SLOT_CAPACITY = 8;

export async function getDeliverySlotAvailability(date: Date) {
  const orders = await getPrismaClient().order.findMany({ where: { scheduledFor: date, deliverySlot: { in: [...DELIVERY_SLOTS] }, status: { notIn: ["CANCELLED", "FAILED"] } }, select: { deliverySlot: true } });
  const counts = new Map<string, number>();
  for (const order of orders) if (order.deliverySlot) counts.set(order.deliverySlot, (counts.get(order.deliverySlot) ?? 0) + 1);
  return DELIVERY_SLOTS.map((slot) => ({ slot, booked: counts.get(slot) ?? 0, capacity: SLOT_CAPACITY, available: (counts.get(slot) ?? 0) < SLOT_CAPACITY }));
}
