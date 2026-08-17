import test from "node:test";
import assert from "node:assert/strict";

import { parseAdminCakeInput } from "../frontend/lib/shared/admin-cake-input";

const validCake = {
  name: "Chocolate Bloom",
  slug: "chocolate-bloom",
  basePrice: 4200,
  categoryIds: ["birthday", "birthday"],
  isAvailable: false,
  variants: [{ name: "1 kg", sku: "cb-1kg", price: 4200, weightGrams: 1000 }],
};

test("admin cake input normalizes variants and preserves availability", () => {
  assert.deepEqual(parseAdminCakeInput(validCake), {
    ...validCake,
    description: undefined,
    ingredients: undefined,
    allergens: undefined,
    categoryIds: ["birthday"],
    variants: [{ name: "1 kg", sku: "CB-1KG", price: 4200, weightGrams: 1000 }],
  });
});

test("admin cake input defaults availability and rejects unsafe shapes", () => {
  const parsed = parseAdminCakeInput({ ...validCake, isAvailable: undefined });
  assert.equal(parsed?.isAvailable, true);
  assert.equal(parseAdminCakeInput({ ...validCake, isAvailable: "false" }), null);
  assert.equal(parseAdminCakeInput({ ...validCake, slug: "not safe" }), null);
  assert.equal(parseAdminCakeInput({ ...validCake, variants: [{ ...validCake.variants[0], price: 0 }] }), null);
});
