import "server-only";

import type { Coupon } from "@prisma/client";

export function couponIsActive(coupon: Pick<Coupon, "isActive" | "startsAt" | "endsAt" | "usageLimit" | "usageCount">, now = new Date()): boolean {
  return coupon.isActive && coupon.startsAt <= now && coupon.endsAt >= now && (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit);
}

export function couponDiscount(coupon: Pick<Coupon, "discountType" | "value" | "minimumOrder" | "maximumDiscount">, subtotal: number): number | null {
  if (coupon.minimumOrder !== null && subtotal < Number(coupon.minimumOrder)) return null;
  const raw = coupon.discountType === "PERCENTAGE" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
  const capped = coupon.maximumDiscount === null ? raw : Math.min(raw, Number(coupon.maximumDiscount));
  return Math.max(0, Math.min(subtotal, Math.round(capped)));
}
