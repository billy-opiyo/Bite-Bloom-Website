import test from "node:test";
import assert from "node:assert/strict";

import { ordersToCsv } from "../frontend/lib/shared/admin-export";

test("admin order export contains operational fields without customer contact data", () => {
  const csv = ordersToCsv([{ id: "BB-1001", amount: 4200, status: "Baking", time: "17/08/2026, 10:00", delivery: "Delivery" }]);
  assert.equal(csv, "Order number,Amount (KES),Status,Placed at,Fulfillment\r\n\"BB-1001\",\"4200\",\"Baking\",\"17/08/2026, 10:00\",\"Delivery\"\r\n");
  assert.equal(csv.includes("email"), false);
  assert.equal(csv.includes("phone"), false);
});

test("admin order export escapes quotes and spreadsheet formulas", () => {
  const csv = ordersToCsv([{ id: "=HYPERLINK(\"https://example.test\")", amount: 10, status: "Ready, now", time: "today", delivery: "Pickup \"shop\"" }]);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
  assert.match(csv, /"Ready, now"/);
  assert.match(csv, /"Pickup ""shop"""/);
});
