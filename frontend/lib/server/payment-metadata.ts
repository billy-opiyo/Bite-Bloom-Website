import { Prisma } from "@prisma/client";

type PaymentMetadataUpdate = Record<string, string | number | boolean | null>;

export function mergePaymentMetadata(
  existing: Prisma.JsonValue | null | undefined,
  updates: PaymentMetadataUpdate,
): Prisma.InputJsonObject {
  const base = existing && typeof existing === "object" && !Array.isArray(existing)
    ? existing
    : {};
  return { ...base, ...updates } as Prisma.InputJsonObject;
}
