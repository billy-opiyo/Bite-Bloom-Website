import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { cartInclude, getGuestCart, serializeCart, setCartCookie } from "../../../../../lib/server/cart";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(request: NextRequest, { params }: { params: { code: string } }) {
  if (!/^[A-Za-z0-9_-]{3,48}$/.test(params.code)) return apiError("VALIDATION_ERROR", "Invalid coupon code.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Coupons are not configured yet.", 503);
  try {
    const { cart, sessionToken } = await getGuestCart(request);
    const prisma = getPrismaClient();
    await prisma.cartCoupon.deleteMany({ where: { cartId: cart.id, coupon: { code: params.code.toUpperCase() } } });
    const updatedCart = await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    return setCartCookie(apiSuccess(serializeCart(updatedCart)), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to remove that coupon right now.", 503);
  }
}
