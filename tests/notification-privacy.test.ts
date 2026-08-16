import assert from "node:assert/strict";
import test from "node:test";

import { redactNotificationRecipient } from "../frontend/lib/shared/notification-privacy";

test("notification recipient redaction preserves only safe email context", () => {
  assert.equal(redactNotificationRecipient("amina@example.com"), "a***@example.com");
});

test("notification recipient redaction preserves only the last phone digits", () => {
  assert.equal(redactNotificationRecipient("+254711222333"), "***2333");
  assert.equal(redactNotificationRecipient("1234"), "***");
});
