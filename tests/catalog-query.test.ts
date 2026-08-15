import assert from "node:assert/strict";
import test from "node:test";

import { parseCatalogQuery } from "../frontend/lib/shared/catalog-query";

test("catalog query parser applies safe defaults and accepts filters", () => {
  assert.deepEqual(parseCatalogQuery(new URLSearchParams("page=2&pageSize=24&q=chocolate&category=birthday&sort=price-low")), {
    page: 2, pageSize: 24, query: "chocolate", category: "birthday", sort: "price-low",
  });
  assert.deepEqual(parseCatalogQuery(new URLSearchParams()), { page: 1, pageSize: 48, sort: "featured" });
});

test("catalog query parser rejects malformed and oversized values", () => {
  assert.equal(parseCatalogQuery(new URLSearchParams("page=0")), null);
  assert.equal(parseCatalogQuery(new URLSearchParams("pageSize=101")), null);
  assert.equal(parseCatalogQuery(new URLSearchParams("category=not valid")), null);
  assert.equal(parseCatalogQuery(new URLSearchParams("sort=discount")), null);
  assert.equal(parseCatalogQuery(new URLSearchParams(`q=${"x".repeat(81)}`)), null);
});
