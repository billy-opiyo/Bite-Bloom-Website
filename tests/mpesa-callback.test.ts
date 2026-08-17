import test from "node:test";
import assert from "node:assert/strict";

import { parseMpesaCallback } from "../frontend/lib/server/mpesa-callback";

test("M-Pesa callback parser accepts bounded success metadata", () => {
  const parsed = parseMpesaCallback({ Body: { stkCallback: { MerchantRequestID: "MR-123", CheckoutRequestID: "ws_CO_123", ResultCode: 0, ResultDesc: "Success", CallbackMetadata: { Item: [{ Name: "MpesaReceiptNumber", Value: "ABC123" }, { Name: "Amount", Value: 4200 }] } } } });
  assert.deepEqual(parsed, { CheckoutRequestID: "ws_CO_123", MerchantRequestID: "MR-123", ResultCode: 0, ResultDesc: "Success", CallbackMetadata: { Item: [{ Name: "MpesaReceiptNumber", Value: "ABC123" }, { Name: "Amount", Value: 4200 }] } });
});

test("M-Pesa callback parser rejects malformed or oversized callback data", () => {
  assert.equal(parseMpesaCallback(null), null);
  assert.equal(parseMpesaCallback({ Body: { stkCallback: { CheckoutRequestID: "bad id", ResultCode: 0 } } }), null);
  assert.equal(parseMpesaCallback({ Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 1.5 } } }), null);
  assert.equal(parseMpesaCallback({ Body: { stkCallback: { MerchantRequestID: { unsafe: true }, CheckoutRequestID: "ws_CO_123", ResultCode: 0 } } }), null);
  assert.equal(parseMpesaCallback({ Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0, ResultDesc: { unsafe: true } } } }), null);
  assert.equal(parseMpesaCallback({ Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0, CallbackMetadata: { Item: Array.from({ length: 21 }, () => ({ Name: "x", Value: "y" })) } } } }), null);
  assert.equal(parseMpesaCallback({ Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0, CallbackMetadata: { Item: [{ Name: "x", Value: { unsafe: true } }] } } } }), null);
});
