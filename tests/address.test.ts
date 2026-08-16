import assert from "node:assert/strict";
import test from "node:test";

import { parseAddress } from "../frontend/lib/server/address";

const validAddress = {
  label: " Home ",
  recipientName: " Amina Otieno ",
  line1: "13 Riverside Lane",
  city: " Nairobi ",
  country: "ke",
  phone: "0711 222 333",
  isDefault: true,
};

test("address parser normalizes valid fields and country code", () => {
  assert.deepEqual(parseAddress(validAddress), {
    label: "Home",
    recipientName: "Amina Otieno",
    line1: "13 Riverside Lane",
    line2: null,
    city: "Nairobi",
    region: null,
    postalCode: null,
    country: "KE",
    phone: "0711 222 333",
    isDefault: true,
  });
});

test("address parser rejects invalid country, default, and optional fields", () => {
  assert.equal(parseAddress({ ...validAddress, country: "Kenya" }), null);
  assert.equal(parseAddress({ ...validAddress, isDefault: "true" }), null);
  assert.equal(parseAddress({ ...validAddress, line2: 123 }), null);
  assert.equal(parseAddress({ ...validAddress, postalCode: "" })?.country, "KE");
});

test("address parser enforces required text lengths", () => {
  assert.equal(parseAddress({ ...validAddress, recipientName: "A" }), null);
  assert.equal(parseAddress({ ...validAddress, line1: "12" }), null);
  assert.equal(parseAddress({ ...validAddress, city: "" }), null);
});
