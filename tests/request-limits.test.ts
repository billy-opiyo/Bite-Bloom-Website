import assert from "node:assert/strict";
import test from "node:test";

import { isJsonContentType, MAX_API_BODY_BYTES, exceedsMaxBodySize } from "../frontend/lib/shared/request-limits";
import { isAllowedRequestOrigin } from "../frontend/lib/shared/request-origin";

test("request size guard accepts absent and bounded content lengths", () => {
  assert.equal(exceedsMaxBodySize(null), false);
  assert.equal(exceedsMaxBodySize(String(MAX_API_BODY_BYTES)), false);
  assert.equal(exceedsMaxBodySize(String(MAX_API_BODY_BYTES - 1)), false);
});

test("request size guard rejects content lengths above the API limit", () => {
  assert.equal(exceedsMaxBodySize(String(MAX_API_BODY_BYTES + 1)), true);
  assert.equal(exceedsMaxBodySize("not-a-number"), false);
});

test("JSON content guard accepts parameters and rejects other media types", () => {
  assert.equal(isJsonContentType("application/json"), true);
  assert.equal(isJsonContentType("application/json; charset=utf-8"), true);
  assert.equal(isJsonContentType("text/plain"), false);
  assert.equal(isJsonContentType(null), false);
});

test("origin guard allows same-origin and server requests but rejects cross-origin mutations", () => {
  assert.equal(isAllowedRequestOrigin(null, "localhost:3000"), true);
  assert.equal(isAllowedRequestOrigin("http://localhost:3000", "localhost:3000"), true);
  assert.equal(isAllowedRequestOrigin("https://evil.example", "localhost:3000"), false);
  assert.equal(isAllowedRequestOrigin("not-an-origin", "localhost:3000"), false);
});
