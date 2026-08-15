import test from "node:test";
import assert from "node:assert/strict";

import { RateLimitStore } from "../frontend/lib/shared/rate-limit-core";

test("rate limiter allows the configured number of requests", () => {
  const scope = `test-${Date.now()}-allow`;
  const store = new RateLimitStore();
  assert.deepEqual(store.check(scope, 2, 60_000), { allowed: true });
  assert.deepEqual(store.check(scope, 2, 60_000), { allowed: true });
});

test("rate limiter returns a retry response after the limit", () => {
  const scope = `test-${Date.now()}-deny`;
  const store = new RateLimitStore();
  assert.deepEqual(store.check(scope, 1, 60_000), { allowed: true });
  const decision = store.check(scope, 1, 60_000);
  assert.equal(decision.allowed, false);
  if (!decision.allowed) assert.ok(decision.retryAfterSeconds > 0);
});
