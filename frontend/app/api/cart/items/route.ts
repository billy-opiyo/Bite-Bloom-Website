import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { cartInclude, getGuestCart, serializeCart, setCartCookie } from "../../../../lib/server/cart";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";
import { getPrismaClient } from "../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NewCartItem = { variantId: string; quantity: number; customizations?: Record<string, unknown> };

function parseCartItem(value: unknown): NewCartItem | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.variantId !== "string" || input.variantId.length === 0 || input.variantId.length > 64 || typeof input.quantity !== "number" || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) return null;
  if (input.customizations !== undefined && (!input.customizations || typeof input.customizations !== "object" || Array.isArray(input.customizations))) return null;
  return { variantId: input.variantId, quantity: input.quantity, ...(input.customizations ? { customizations: input.customizations as Record<string, unknown> } : {}) };
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The cart is not configured yet.", 503);
  const input = parseCartItem(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid cart item.", 400);

  try {
    const { cart, sessionToken } = await getGuestCart(request);
    const variant = await getPrismaClient().cakeVariant.findFirst({ where: { id: input.variantId, isActive: true, cake: { status: "ACTIVE" } }, select: { id: true, price: true } });
    if (!variant) return apiError("VALIDATION_ERROR", "This cake option is not available.", 400);
    await getPrismaClient().cartItem.create({ data: { cart: { connect: { id: cart.id } }, variant: { connect: { id: variant.id } }, quantity: input.quantity, unitPrice: variant.price, ...(input.customizations ? { customizations: input.customizations as Prisma.InputJsonValue } : {}) } });
    const updatedCart = await getPrismaClient().cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    return setCartCookie(apiSuccess(serializeCart(updatedCart), { status: 201 }), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The cart is temporarily unavailable.", 503);
  }
}
