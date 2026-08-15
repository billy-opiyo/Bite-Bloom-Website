import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../lib/server/api-response";
import { getDeliverySlotAvailability } from "../../../../lib/server/delivery-slots";
import { hasDatabaseConfiguration } from "../../../../lib/server/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Delivery scheduling is not configured yet.", 503);
  const value = request.nextUrl.searchParams.get("date") || "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+03:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return apiError("VALIDATION_ERROR", "Choose a valid delivery date.", 400);
  try { return apiSuccess({ date: value, slots: await getDeliverySlotAvailability(date) }); }
  catch { return apiError("DATABASE_UNAVAILABLE", "Delivery slots are temporarily unavailable.", 503); }
}
