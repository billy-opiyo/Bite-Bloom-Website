import assert from "node:assert/strict";
import test from "node:test";

import { MAX_API_BODY_BYTES, exceedsMaxBodySize } from "../frontend/lib/shared/request-limits";

test("request size guard accepts absent and bounded content lengths", () => {
  assert.equal(exceedsMaxBodySize(null), false);
  assert.equal(exceedsMaxBodySize(String(MAX_API_BODY_BYTES)), false);
  assert.equal(exceedsMaxBodySize(String(MAX_API_BODY_BYTES - 1)), false);
});

test("request size guard rejects content lengths above the API limit", () => {
  assert.equal(exceedsMaxBodySize(String(MAX_API_BODY_BYTES + 1)), true);
  assert.equal(exceedsMaxBodySize("not-a-number"), false);
});
