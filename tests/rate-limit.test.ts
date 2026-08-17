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

test("rate limiter prunes expired buckets before admitting a new key", () => {
  const store = new RateLimitStore(2);
  assert.deepEqual(store.check("expired", 1, 10, 0), { allowed: true });
  assert.deepEqual(store.check("active", 1, 100, 0), { allowed: true });
  assert.deepEqual(store.check("new", 1, 100, 11), { allowed: true });

  const activeDecision = store.check("active", 1, 100, 11);
  assert.equal(activeDecision.allowed, false);
});

test("rate limiter evicts the oldest bucket at its capacity ceiling", () => {
  const store = new RateLimitStore(2);
  assert.deepEqual(store.check("first", 1, 100, 0), { allowed: true });
  assert.deepEqual(store.check("second", 1, 200, 0), { allowed: true });
  assert.deepEqual(store.check("third", 1, 300, 0), { allowed: true });

  assert.equal(store.check("second", 1, 1, 1).allowed, false);
  assert.equal(store.check("third", 1, 1, 1).allowed, false);
  assert.deepEqual(store.check("first", 1, 1, 1), { allowed: true });
});
