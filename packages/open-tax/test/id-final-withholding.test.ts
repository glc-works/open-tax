import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate, validatePolicyDiff } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const on = (treatmentId: string, date: string) => resolveTaxAtDate(regime, { treatmentId, date });

test("property final tax uses statutory commencement and distinguishes explicit zero from an exemption", () => {
  assert.deepEqual(on("pph4-2-rent", "2018-01-01"), []);
  const rent = on("pph4-2-rent", "2018-01-02")[0]!;
  assert.equal(rent.rate.value, "0.10");
  assert.match(rent.rate.base_formula!, /maintenance, security, service/);
  assert.match(rent.notes!, /Exclude accommodation/);
  for (const [suffix, value] of [["ordinary", "0.025"], ["simple-housing", "0.01"], ["public-interest", "0"]]) {
    assert.deepEqual(on(`pph4-2-transfer-${suffix}`, "2016-09-06"), []);
    const row = on(`pph4-2-transfer-${suffix}`, "2016-09-07")[0]!;
    assert.equal(row.rate.value, value);
    assert.equal(row.semanticCode, "final");
    assert.match(row.notes!, /Article 6 exceptions/);
  }
});

test("construction certificate classes begin on payment-date transition without an invented three-year expiry", () => {
  const expected = [
    ["small", "0.0175"], ["uncertified", "0.04"], ["other-certified", "0.0265"],
    ["integrated-certified", "0.0265"], ["integrated-uncertified", "0.04"],
    ["consultancy-certified", "0.035"], ["consultancy-uncertified", "0.06"],
  ];
  for (const [suffix, value] of expected) {
    const id = `pph4-2-construction-${suffix}`;
    assert.deepEqual(on(id, "2022-02-20"), []);
    assert.equal(on(id, "2022-02-21")[0]?.rate.value, value);
    const current = on(id, "2026-11-14")[0]!;
    assert.equal(current.semanticCode, "final");
    assert.match(current.rate.base_formula!, /excluding PPN/);
    assert.match(current.notes!, /earlier contracts/);
    assert.match(current.notes!, /not an automatic expiry/);
  }
});

test("resident and non-resident bonds have distinct commencement dates, scope and bases", () => {
  assert.deepEqual(on("pph26-bond", "2021-08-01"), []);
  const nonResident = on("pph26-bond", "2021-08-02")[0]!;
  assert.equal(nonResident.rate.value, "0.10");
  assert.equal(nonResident.semanticCode, "withholding");
  assert.deepEqual(on("pph4-2-bond-resident", "2021-08-29"), []);
  const resident = on("pph4-2-bond-resident", "2021-08-30")[0]!;
  assert.equal(resident.rate.value, "0.10");
  assert.equal(resident.semanticCode, "final");
  assert.match(resident.notes!, /Exclude qualifying pension funds/);
  assert.match(resident.rate.base_formula!, /negative coupon-bond discount/);
  assert.match(nonResident.notes!, /maturity over 12 months/);
  assert.match(on("pph26", "2026-11-14")[0]!.rate.notes!, /estimated net income/);
});

test("no-NPWP PPh 23 rates are explicit in-force snapshots, not a fabricated commencement", () => {
  for (const [suffix, value, ordinary] of [["15", "0.30", "0.15"], ["2", "0.04", "0.02"]]) {
    const row = on(`pph23-no-npwp-${suffix}`, "2026-11-14")[0]!;
    assert.equal(row.rate.value, value);
    assert.equal(row.rate.statutory_value, ordinary);
    assert.equal(row.effectiveFromBound, "in_force_by");
    assert.match(row.notes!, /without NPWP/);
    assert.match(row.notes!, /not the legal commencement/);
  }
});

test("ordinary PPh 23 scope excludes bank payments and final construction/rental cases", () => {
  for (const id of ["pph23-15", "pph23-2"]) {
    const row = on(id, "2026-11-14")[0]!;
    assert.match(row.notes!, /Ordinary NPWP case only/);
    assert.match(row.notes!, /Exclude bank payments/);
    assert.match(row.notes!, /final construction/);
  }
});

test("each added withholding/final family has a schema-valid policy record referencing resolvable treatments", () => {
  const names = [
    "2018-01-02-pp-34-2017-rent", "2016-09-07-pp-34-2016-transfer",
    "2022-02-21-pp-9-2022-construction", "2021-08-30-pp-91-2021-bonds",
    "2026-11-14-pph23-scope-snapshot", "2021-08-02-pp-9-2021-nonresident-bonds",
  ];
  for (const name of names) {
    const diff = JSON.parse(readFileSync(join(root, "packs/id/diffs", `${name}.json`), "utf8")) as PolicyDiff;
    assert.equal(validatePolicyDiff(diff).valid, true, name);
    for (const change of diff.changes) for (const id of change.affected.treatment_ids!) {
      assert.equal(on(id, change.effective_from).length, 1, `${name}: ${id}`);
    }
  }
});
