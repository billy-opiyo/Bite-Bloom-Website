import "server-only";

type PriceValue = number | { toString(): string };
type CustomizationValue = { value: string; priceDelta: PriceValue };
type Customization = { key: string; type: "TEXT" | "SELECT" | "NUMBER" | "COLOR" | "DATE"; isRequired: boolean; priceDelta: PriceValue; values: CustomizationValue[] };

export class CustomizationValidationError extends Error {}

function inputObject(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CustomizationValidationError("Invalid cake customizations.");
  return value as Record<string, unknown>;
}

function providedText(value: unknown, key: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 500) throw new CustomizationValidationError(`Choose a valid ${key} option.`);
  return value.trim();
}

export function resolvedCustomizationUnitPrice(input: { basePrice: PriceValue; customizations: unknown; definitions: Customization[] }): number {
  const selected = inputObject(input.customizations);
  let price = Number(input.basePrice);
  for (const definition of input.definitions) {
    const value = selected[definition.key];
    if (value === undefined || value === null || value === "") {
      if (definition.isRequired) throw new CustomizationValidationError(`Select ${definition.key} before adding this cake.`);
      continue;
    }
    if (definition.type === "SELECT") {
      const choice = definition.values.find((item) => item.value === providedText(value, definition.key));
      if (!choice) throw new CustomizationValidationError(`Choose a valid ${definition.key} option.`);
      price += Number(definition.priceDelta) + Number(choice.priceDelta);
      continue;
    }
    if (definition.type === "NUMBER" && (typeof value !== "number" || !Number.isFinite(value))) throw new CustomizationValidationError(`Choose a valid ${definition.key} option.`);
    if (definition.type !== "NUMBER") providedText(value, definition.key);
    price += Number(definition.priceDelta);
  }
  return Math.max(0, price);
}
