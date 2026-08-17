import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { cartInclude, getGuestCart, serializeCart, setCartCookie } from "../../../../lib/server/cart";
import { couponDiscount, couponIsActive } from "../../../../lib/server/coupons";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function couponCode(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" && /^[A-Za-z0-9_-]{3,48}$/.test(code.trim()) ? code.trim().toUpperCase() : null;
}

export async function POST(request: NextRequest) {
  const code = couponCode(await request.json().catch(() => null));
  if (!code) return apiError("VALIDATION_ERROR", "Enter a valid coupon code.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Coupons are not configured yet.", 503);
  try {
    const { cart, sessionToken } = await getGuestCart(request);
    const prisma = getPrismaClient();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    const subtotal = cart.items.reduce((total, item) => total + Number(item.unitPrice) * item.quantity, 0);
    if (!coupon || !couponIsActive(coupon) || couponDiscount(coupon, subtotal) === null) return apiError("VALIDATION_ERROR", "This coupon is unavailable or does not apply to your cart.", 400);
    await prisma.$transaction(async (tx) => {
      await tx.cartCoupon.deleteMany({ where: { cartId: cart.id } });
      await tx.cartCoupon.create({ data: { cartId: cart.id, couponId: coupon.id } });
    });
    const updatedCart = await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    return setCartCookie(apiSuccess(serializeCart(updatedCart)), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to apply that coupon right now.", 503);
  }
}
