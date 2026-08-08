import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { getAdminSession } from "../../../../../lib/server/access";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";

type CakeUpdate = { name: string; basePrice: number; categoryId: string; isAvailable: boolean };

function parseUpdate(value: unknown): CakeUpdate | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.name !== "string" || input.name.trim().length === 0 || input.name.trim().length > 120 || typeof input.basePrice !== "number" || !Number.isFinite(input.basePrice) || input.basePrice <= 0 || input.basePrice > 1_000_000 || typeof input.categoryId !== "string" || input.categoryId.length === 0 || typeof input.isAvailable !== "boolean") return null;
  return { name: input.name.trim(), basePrice: input.basePrice, categoryId: input.categoryId, isAvailable: input.isAvailable };
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdminSession())) return apiError("UNAUTHORIZED", "Administrator access is required.", 401);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "The catalogue is not configured yet.", 503);
  const input = parseUpdate(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Invalid cake update.", 400);

  try {
    const category = await getPrismaClient().category.findFirst({ where: { id: input.categoryId, isActive: true }, select: { id: true } });
    if (!category) return apiError("VALIDATION_ERROR", "Select a valid active category.", 400);
    const cake = await getPrismaClient().cake.update({
      where: { id: params.id },
      data: {
        name: input.name,
        basePrice: input.basePrice,
        categories: { deleteMany: {}, create: { categoryId: category.id } },
        variants: { updateMany: { where: { isDefault: true }, data: { price: input.basePrice, isActive: input.isAvailable } } },
      },
      select: { id: true, name: true, basePrice: true },
    });
    return apiSuccess({ id: cake.id, name: cake.name, basePrice: Number(cake.basePrice), isAvailable: input.isAvailable });
  } catch {
    return apiError("VALIDATION_ERROR", "Cake not found or could not be updated.", 404);
  }
}
