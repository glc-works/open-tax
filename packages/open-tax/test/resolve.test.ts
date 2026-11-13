import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTaxAtDate } from "../src/index.js";
import { exampleRegime } from "./fixtures.js";

test("resolution is inclusive on both ends and does not evaluate formulas", () => {
  const regime = exampleRegime();
  const lastOldDay = resolveTaxAtDate(regime, {
    date: "2023-12-31",
    treatmentId: "example-standard",
  });
  assert.equal(lastOldDay.length, 1);
  assert.equal(lastOldDay[0]?.versionId, "example-standard-a");
  assert.equal(lastOldDay[0]?.rate.value, "0.10");

  const firstNewDay = resolveTaxAtDate(regime, {
    date: "2024-01-01",
    semanticCode: "standard",
  });
  assert.equal(firstNewDay.length, 1);
  assert.equal(firstNewDay[0]?.rate.kind, "formula");
  assert.equal(firstNewDay[0]?.rate.base_formula, "process.exit(1)");
  assert.equal(firstNewDay[0]?.rate.value, "0.11");
  assert.equal(firstNewDay[0]?.rate.statutory_value, "0.12");
});

test("a date before the encoded window returns nothing", () => {
  const found = resolveTaxAtDate(exampleRegime(), { date: "2019-12-31" });
  assert.deepEqual(found, []);
});

test("a calendar-invalid date is rejected", () => {
  assert.throws(
    () => resolveTaxAtDate(exampleRegime(), { date: "2024-02-31" }),
    TypeError,
  );
});
