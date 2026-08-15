import assert from "node:assert/strict";
import test from "node:test";

import { parsePromotionInput } from "../frontend/lib/shared/promotion-input";

test("promotion parser normalizes valid coupon input", () => {
  const result = parsePromotionInput({ code: " sweet10 ", description: " Weekend offer ", discountType: "PERCENTAGE", value: 10, minimumOrder: 2500, usageLimit: 50, startsAt: "2026-08-15T08:00:00.000Z", endsAt: "2026-08-31T18:00:00.000Z" });
  assert.deepEqual(result, { code: "SWEET10", description: "Weekend offer", discountType: "PERCENTAGE", value: 10, minimumOrder: 2500, maximumDiscount: null, usageLimit: 50, perUserLimit: null, startsAt: new Date("2026-08-15T08:00:00.000Z"), endsAt: new Date("2026-08-31T18:00:00.000Z"), isActive: true });
});

test("promotion parser rejects unsafe values and invalid windows", () => {
  assert.equal(parsePromotionInput({ code: "NO", discountType: "PERCENTAGE", value: 10 }), null);
  assert.equal(parsePromotionInput({ code: "VALID10", discountType: "PERCENTAGE", value: 101 }), null);
  assert.equal(parsePromotionInput({ code: "VALID10", discountType: "FIXED_AMOUNT", value: 100, startsAt: "2026-08-20T00:00:00.000Z", endsAt: "2026-08-19T00:00:00.000Z" }), null);
  assert.equal(parsePromotionInput({ code: "VALID10", discountType: "PERCENTAGE", value: 10, isActive: "yes" }), null);
});
