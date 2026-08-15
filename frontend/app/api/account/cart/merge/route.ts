import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAuthenticatedSession } from "../../../../../lib/server/access";
import { getGuestCart, setCartCookie } from "../../../../../lib/server/cart";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to merge your cart.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Cart merging is not configured yet.", 503);

  try {
    const { cart: guestCart, sessionToken } = await getGuestCart(request);
    const result = await getPrismaClient().$transaction(async (tx) => {
      const accountCart = await tx.cart.findFirst({ where: { userId: session.user.id, status: "ACTIVE" }, include: { items: true } });
      if (!accountCart || accountCart.id === guestCart.id) {
        await tx.cart.update({ where: { id: guestCart.id }, data: { userId: session.user.id } });
        return { cartId: guestCart.id, itemCount: guestCart.items.length };
      }

      for (const item of guestCart.items) {
        await tx.cartItem.create({ data: { cartId: accountCart.id, variantId: item.variantId, quantity: Math.min(20, item.quantity), unitPrice: item.unitPrice, customizations: item.customizations as Prisma.InputJsonValue | undefined } });
      }
      await tx.cart.update({ where: { id: guestCart.id }, data: { status: "CONVERTED", sessionToken: null } });
      await tx.cart.update({ where: { id: accountCart.id }, data: { sessionToken, lastActivityAt: new Date() } });
      return { cartId: accountCart.id, itemCount: accountCart.items.length + guestCart.items.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return setCartCookie(apiSuccess({ merged: true, ...result }), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to merge your guest cart right now.", 503);
  }
}
