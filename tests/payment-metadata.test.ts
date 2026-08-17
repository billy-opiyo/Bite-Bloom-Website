import test from "node:test";
import assert from "node:assert/strict";

import { mergePaymentMetadata } from "../frontend/lib/server/payment-metadata";

test("payment metadata merges provider state without erasing existing fields", () => {
  assert.deepEqual(
    mergePaymentMetadata({ method: "stk_push", attempt: 1 }, { checkoutRequestId: "ws_CO_123", attempt: 2 }),
    { method: "stk_push", attempt: 2, checkoutRequestId: "ws_CO_123" },
  );
});

test("payment metadata safely starts with an object for empty or malformed values", () => {
  assert.deepEqual(mergePaymentMetadata(null, { retryFailedAt: "2026-08-17T10:00:00.000Z" }), { retryFailedAt: "2026-08-17T10:00:00.000Z" });
  assert.deepEqual(mergePaymentMetadata(["not", "metadata"], { resultCode: 1 }), { resultCode: 1 });
});
