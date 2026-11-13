import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate, validatePolicyDiff } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const on = (id: string, date = "2025-01-01") => resolveTaxAtDate(regime, { treatmentId: `ppn-${id}`, date });

test("film, telecom, token and voucher paths keep copies, distribution levels and service fees distinct", () => {
  assert.match(on("special-import-film")[0]!.rate.base_formula!, /12000000 per copy/);
  assert.match(on("special-import-film-cinema")[0]!.notes!, /only once per copy/);
  assert.match(on("special-telecom-first")[0]!.notes!, /not a declaration.*every later distribution level/i);
  assert.match(on("special-telecom-second-indirect")[0]!.rate.base_formula!, /distributor selanjutnya/);
  assert.match(on("special-token-commission")[0]!.notes!, /not the nominal/);
  assert.match(on("special-token-margin")[0]!.rate.base_formula!, /excluding.*lighting tax and stamp duty/);
  assert.match(on("special-voucher-margin")[0]!.notes!, /not based on commission but with a margin/);
  assert.equal(on("special-voucher-no-margin")[0]?.rate.value, "0.011");
  assert.equal(on("special-voucher-no-margin")[0]?.inputCredit, "not_creditable");
});

test("rounded DPP factors are not mislabeled as VAT due and KSO uses the member contribution", () => {
  for (const id of ["special-lpg-retail", "special-fertiliser-subsidy", "special-fertiliser-retail"]) {
    const row = on(id)[0]!;
    assert.match(row.rate.base_formula!, /^0\.825 \*/);
    assert.equal(row.rate.value, undefined);
    assert.equal(row.rate.statutory_value, "0.12");
  }
  assert.match(on("special-fertiliser-subsidy")[0]!.rate.base_formula!, /termasuk PPN/);
  assert.match(on("special-kso-member")[0]!.notes!, /not the KSO customer invoice/);
  assert.match(on("special-repossessed-collateral")[0]!.notes!, /receives payment/);
});

test("FTZ bases distinguish luxury, origin and temporary-movement defaults without granting blanket relief", () => {
  for (const movement of ["unprocessed", "not-returned", "not-reexported"]) {
    const ordinary = on(`ftz-${movement}-ordinary`)[0]!;
    const luxury = on(`ftz-${movement}-luxury`)[0]!;
    assert.match(ordinary.rate.base_formula!, /^11\/12/);
    assert.doesNotMatch(luxury.rate.base_formula!, /11\/12/);
    for (const row of [ordinary, luxury]) {
      assert.equal(row.taxId, "ppn");
      assert.equal(row.semanticCode, "standard");
      assert.match(row.notes!, /not-collected\/exempt facility exceptions/);
    }
  }
});

test("all 21 additional bases have a cited policy record and no invented pre-2025 window", () => {
  const diff = JSON.parse(readFileSync(join(root, "packs/id/diffs/2025-01-01-pmk-11-2025-additional-bases.json"), "utf8")) as PolicyDiff;
  assert.equal(validatePolicyDiff(diff).valid, true);
  assert.equal(diff.changes[0]!.affected.treatment_ids!.length, 21);
  for (const id of diff.changes[0]!.affected.treatment_ids!) {
    assert.deepEqual(resolveTaxAtDate(regime, { treatmentId: id, date: "2024-12-31" }), []);
    const rows = resolveTaxAtDate(regime, { treatmentId: id, date: "2025-01-01" });
    assert.equal(rows.length, 1, id);
    assert.ok(rows[0]!.legalCitations.some((c) => c.instrument === "PMK 11/2025"));
  }
});
