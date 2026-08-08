import "server-only";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import type { NextRequest, NextResponse } from "next/server";

import { getPrismaClient } from "./prisma";

export const CART_COOKIE_NAME = "bite_bloom_cart";

const cartInclude = {
  items: {
    include: { variant: { include: { cake: true } } },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export type CartSummary = {
  id: string;
  currency: string;
  items: Array<{ id: string; quantity: number; unitPrice: number; variantId: string; variantName: string; cakeName: string; cakeSlug: string; customizations: unknown }>;
  subtotal: number;
};

export function serializeCart(cart: CartWithItems): CartSummary {
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    variantId: item.variantId,
    variantName: item.variant.name,
    cakeName: item.variant.cake.name,
    cakeSlug: item.variant.cake.slug,
    customizations: item.customizations,
  }));

  return { id: cart.id, currency: cart.currency, items, subtotal: items.reduce((total, item) => total + item.quantity * item.unitPrice, 0) };
}

export async function getGuestCart(request: NextRequest): Promise<{ cart: CartWithItems; sessionToken: string; isNew: boolean }> {
  const sessionToken = request.cookies.get(CART_COOKIE_NAME)?.value || randomUUID();
  const existing = await getPrismaClient().cart.findFirst({
    where: { sessionToken, status: "ACTIVE" },
    include: cartInclude,
  });
  if (existing) return { cart: existing, sessionToken, isNew: false };

  const cart = await getPrismaClient().cart.create({
    data: { sessionToken, status: "ACTIVE" },
    include: cartInclude,
  });
  return { cart, sessionToken, isNew: true };
}

export function setCartCookie<T extends NextResponse>(response: T, sessionToken: string): T {
  response.cookies.set({ name: CART_COOKIE_NAME, value: sessionToken, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
