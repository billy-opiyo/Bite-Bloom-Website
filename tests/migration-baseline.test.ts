import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(__dirname, "..");
const schema = readFileSync(path.join(repositoryRoot, "prisma", "schema.prisma"), "utf8");
const migration = readFileSync(path.join(repositoryRoot, "prisma", "migrations", "00000000000000_initial", "migration.sql"), "utf8");

test("initial migration covers every Prisma model without local connection data", () => {
  const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);
  assert.ok(models.length > 0);
  assert.ok(migration.length > 1000);
  assert.doesNotMatch(migration, /127\.0\.0\.1|local:local|DATABASE_URL/);

  for (const model of models) {
    assert.match(migration, new RegExp(`CREATE TABLE "${model}"`), `missing table for Prisma model ${model}`);
  }
});
