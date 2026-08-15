export type PromotionInput = {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrder: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

function optionalNumber(value: unknown, maximum: number): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum) return undefined;
  return Math.round(value * 100) / 100;
}

function optionalInteger(value: unknown, maximum: number): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > maximum) return undefined;
  return value as number;
}

export function parsePromotionInput(value: unknown): PromotionInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const discountType = input.discountType === "PERCENTAGE" || input.discountType === "FIXED_AMOUNT" ? input.discountType : null;
  const amount = optionalNumber(input.value, 10_000_000);
  const minimumOrder = optionalNumber(input.minimumOrder, 10_000_000);
  const maximumDiscount = optionalNumber(input.maximumDiscount, 10_000_000);
  const usageLimit = optionalInteger(input.usageLimit, 10_000_000);
  const perUserLimit = optionalInteger(input.perUserLimit, 10_000_000);
  const startsAt = typeof input.startsAt === "string" ? new Date(input.startsAt) : null;
  const endsAt = typeof input.endsAt === "string" ? new Date(input.endsAt) : null;
  if (!/^[A-Z0-9_-]{3,48}$/.test(code) || description.length > 500 || !discountType || amount === null || amount === undefined || minimumOrder === undefined || maximumDiscount === undefined || usageLimit === undefined || perUserLimit === undefined || !startsAt || !endsAt || Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) || endsAt <= startsAt || (discountType === "PERCENTAGE" && amount > 100) || (maximumDiscount !== null && maximumDiscount < 0)) return null;
  return { code, ...(description ? { description } : {}), discountType, value: amount, minimumOrder, maximumDiscount, usageLimit, perUserLimit, startsAt, endsAt, isActive: input.isActive !== false };
}
