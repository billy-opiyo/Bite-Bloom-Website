import assert from "node:assert/strict";
import test from "node:test";

import { parseContactMessage, parseEmailAddress, parseNewsletter } from "../frontend/lib/server/public-forms";

test("email parser normalizes valid addresses and rejects malformed input", () => {
  assert.equal(parseEmailAddress("  NIA@example.com "), "nia@example.com");
  assert.equal(parseEmailAddress("not-an-email"), null);
});

test("contact parser preserves a safe custom request source", () => {
  assert.deepEqual(parseContactMessage({ name: "Nia Wanjiku", email: "NIA@example.com", message: "Please make a garden-themed cake.", source: "custom-cake" }), { name: "Nia Wanjiku", email: "nia@example.com", message: "Please make a garden-themed cake.", source: "custom-cake" });
});

test("contact parser falls back to website for unsafe sources", () => {
  assert.equal(parseContactMessage({ name: "Nia Wanjiku", email: "nia@example.com", message: "A question about delivery.", source: "custom cake" } )?.source, "website");
  assert.equal(parseContactMessage({ name: "N", email: "bad", message: "x" }), null);
});

test("newsletter parser requires explicit consent", () => {
  assert.deepEqual(parseNewsletter({ email: "NIA@example.com", consent: true }), { email: "nia@example.com", consent: true });
  assert.equal(parseNewsletter({ email: "nia@example.com", consent: false }), null);
});
