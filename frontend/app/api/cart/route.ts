import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../lib/server/api-response";
import { getGuestCart, serializeCart, setCartCookie } from "../../../lib/server/cart";
import { hasDatabaseConfiguration } from "../../../lib/server/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The cart is not configured yet.", 503);
  try {
    const { cart, sessionToken } = await getGuestCart(request);
    return setCartCookie(apiSuccess(serializeCart(cart)), sessionToken);
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "The cart is temporarily unavailable.", 503);
  }
}
