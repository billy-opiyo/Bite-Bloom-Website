import test from "node:test";
import assert from "node:assert/strict";

import { parseAuthEmail, parseNewPassword, parseVerificationToken } from "../frontend/lib/server/auth-input";

test("auth input parsers normalize valid email and accept generated token/password shapes", () => {
  assert.equal(parseAuthEmail("  Customer@Example.com "), "customer@example.com");
  assert.equal(parseVerificationToken("a".repeat(64)), "a".repeat(64));
  assert.equal(parseNewPassword("a secure password with 12+ chars"), "a secure password with 12+ chars");
});

test("auth input parsers reject malformed or unsafe values", () => {
  assert.equal(parseAuthEmail("not-an-email"), null);
  assert.equal(parseVerificationToken("short"), null);
  assert.equal(parseVerificationToken("a".repeat(63) + "/"), null);
  assert.equal(parseNewPassword("too-short"), null);
  assert.equal(parseNewPassword("x".repeat(129)), null);
});
