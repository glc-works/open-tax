import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate, validatePolicyDiff } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const on = (id: string, date = "2022-04-01") => resolveTaxAtDate(regime, { treatmentId: `ppnbm-${id}`, date });

test("passenger CO2 branches distinguish capacity, exact boundary conditions and the amended-annex date", () => {
  for (const [capacity, values] of [
    ["upto-3000", ["0.15", "0.20", "0.25", "0.40"]],
    ["3000-4000", ["0.40", "0.50", "0.60", "0.70"]],
  ] as const) {
    for (const [i, band] of ["under-150", "150-200", "200-250", "over-250"].entries()) {
      const id = `passenger-${capacity}-${band}`;
      assert.deepEqual(on(id, "2022-03-31"), []);
      const row = on(id)[0]!;
      assert.equal(row.rate.value, values[i]);
      assert.equal(row.taxId, "ppnbm");
      assert.match(row.notes!, /fewer than 10 persons including the driver/);
      assert.match(row.notes!, /Only the CO2 branch/);
      assert.match(row.notes!, /not the first legal introduction/);
    }
  }
  assert.match(on("passenger-upto-3000-under-150")[0]!.notes!, /CO2 < 150/);
  assert.match(on("passenger-upto-3000-150-200")[0]!.notes!, /150 <= CO2 <= 200/);
  assert.match(on("passenger-upto-3000-200-250")[0]!.notes!, /200 < CO2 <= 250/);
});

test("classification preserves evidence and program overrides rather than assuming a favourable row", () => {
  const row = on("passenger-upto-3000-under-150")[0]!;
  assert.match(row.notes!, /highest class rate.*required test evidence is missing/);
  assert.match(row.notes!, /before any separately qualifying low-carbon program/);
  assert.match(row.rate.base_formula!, /Nilai Impor.*Harga Jual/);
});

test("other vehicle classes keep engine-capacity boundaries and independent PPnBM rates", () => {
  for (const [suffix, rate] of [["golf", "0.50"], ["terrain", "0.60"], ["motorcycle-250-500", "0.60"], ["motorcycle-over-500", "0.95"], ["caravan", "0.95"], ["over-4000", "0.95"]]) {
    const row = on(`vehicle-${suffix}`)[0]!;
    assert.equal(row.rate.value, rate);
    assert.equal(row.semanticCode, "luxury");
    assert.equal(row.taxId, "ppnbm");
  }
  assert.match(on("vehicle-motorcycle-250-500")[0]!.notes!, /over 250 and at most 500 cc/);
  assert.match(on("vehicle-motorcycle-over-500")[0]!.notes!, /over 500 cc/);
});

test("vehicle policy record covers the 14 explicit classes without inventing double-cab or program data", () => {
  const diff = JSON.parse(readFileSync(join(root, "packs/id/diffs/2022-04-01-pmk-42-2022-vehicles.json"), "utf8")) as PolicyDiff;
  assert.equal(validatePolicyDiff(diff).valid, true);
  assert.equal(diff.changes[0]!.affected.treatment_ids!.length, 14);
  for (const id of diff.changes[0]!.affected.treatment_ids!) {
    const rows = resolveTaxAtDate(regime, { treatmentId: id, date: "2022-04-01" });
    assert.equal(rows.length, 1, id);
    assert.ok(rows[0]!.legalCitations.some((c) => c.instrument === "PMK 42/PMK.010/2022"));
  }
  assert.deepEqual(on("vehicle-double-cab"), []);
});
