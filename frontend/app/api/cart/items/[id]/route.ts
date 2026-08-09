import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { cartInclude, getGuestCart, serializeCart, setCartCookie } from "../../../../../lib/server/cart";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseQuantity(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const quantity = (value as Record<string, unknown>).quantity;
  return typeof quantity === "number" && Number.isInteger(quantity) && quantity >= 1 && quantity <= 20 ? quantity : null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The cart is not configured yet.", 503);
  const quantity = parseQuantity(await request.json().catch(() => null));
  if (!quantity) return apiError("VALIDATION_ERROR", "Invalid quantity.", 400);

  try {
    const { cart, sessionToken } = await getGuestCart(request);
    const item = await getPrismaClient().cartItem.findFirst({ where: { id: params.id, cartId: cart.id }, select: { id: true } });
    if (!item) return apiError("VALIDATION_ERROR", "Cart item not found.", 404);
    await getPrismaClient().cartItem.update({ where: { id: item.id }, data: { quantity } });
    const updatedCart = await getPrismaClient().cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    return setCartCookie(apiSuccess(serializeCart(updatedCart)), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The cart is temporarily unavailable.", 503);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The cart is not configured yet.", 503);
  try {
    const { cart, sessionToken } = await getGuestCart(request);
    const item = await getPrismaClient().cartItem.findFirst({ where: { id: params.id, cartId: cart.id }, select: { id: true } });
    if (!item) return apiError("VALIDATION_ERROR", "Cart item not found.", 404);
    await getPrismaClient().cartItem.delete({ where: { id: item.id } });
    const updatedCart = await getPrismaClient().cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    return setCartCookie(apiSuccess(serializeCart(updatedCart)), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The cart is temporarily unavailable.", 503);
  }
}
