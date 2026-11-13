import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate, validatePolicyDiff } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const on = (suffix: string, date = "2024-01-01") => resolveTaxAtDate(regime, { treatmentId: `pph21-${suffix}`, date });

test("PMK 168 routes daily gross above 2.5m to marginal Article 17 on a half-gross base", () => {
  assert.deepEqual(on("daily-high", "2023-12-31"), []);
  const high = on("daily-high")[0]!;
  assert.equal(high.rate.kind, "schedule");
  assert.equal(high.rate.base_formula, "50% * penghasilan bruto");
  assert.match(high.notes!, /exceeds IDR 2,500,000/);
  assert.equal(high.rate.brackets?.[0]?.up_to, "60000000");
  assert.equal(high.rate.brackets?.at(-1)?.rate, "0.35");
  assert.equal(on("ter-daily")[0]?.rate.brackets?.at(-1)?.up_to, "2500000");
});

test("individual service and event/retirement payment classes retain distinct bases", () => {
  const service = on("non-employee")[0]!;
  assert.match(service.rate.base_formula!, /^50%/);
  assert.match(service.notes!, /not companies/);
  assert.match(service.notes!, /For catering, gross is the full payment/);
  assert.match(service.notes!, /supported by.*contracts\/payroll\/invoices/);
  for (const suffix of ["event-participant", "employee-pension-withdrawal", "former-employee"]) {
    const row = on(suffix)[0]!;
    assert.doesNotMatch(row.rate.base_formula!, /50%/);
    assert.deepEqual(row.rate.brackets, service.rate.brackets);
  }
  assert.match(on("event-participant")[0]!.rate.base_formula!, /not split/);
  assert.match(on("employee-pension-withdrawal")[0]!.notes!, /still an employee/);
});

test("irregular commissioner payments use monthly TER without an inferred annual reconciliation", () => {
  const row = on("irregular-commissioner")[0]!;
  assert.match(row.rate.base_formula!, /monthly TER/);
  assert.match(row.rate.notes!, /pph21-ter-monthly-a, -b or -c/);
  assert.match(row.notes!, /do not infer.*last-period reconciliation/);
  assert.equal(row.rate.brackets, undefined);
});

test("last-period withholding reconciles annual liability and carries separate capped deductions", () => {
  const row = on("last-period")[0]!;
  assert.match(row.rate.base_formula!, /less PPh 21 already withheld/);
  assert.match(row.rate.notes!, /rounded down.*thousands/);
  assert.match(row.rate.notes!, /subjective liability/);
  assert.match(row.notes!, /not Article 17 tax on December gross/);
  const treatment = regime.taxes.flatMap((tax) => tax.treatments).find((t) => t.id === row.treatmentId)!;
  assert.match(treatment.parameters![0]!.notes!, /6,000,000\/year or 500,000\/month/);
  assert.match(treatment.parameters![1]!.notes!, /2,400,000\/year or 200,000\/month/);
});

test("all seven recipient routes are cited in a schema-valid policy record at commencement", () => {
  const diff = JSON.parse(readFileSync(join(root, "packs/id/diffs/2024-01-01-pmk-168-2023-scope.json"), "utf8")) as PolicyDiff;
  assert.equal(validatePolicyDiff(diff).valid, true);
  const ids = diff.changes[0]!.affected.treatment_ids!;
  assert.equal(ids.length, 7);
  for (const id of ids) {
    const rows = resolveTaxAtDate(regime, { treatmentId: id, date: "2024-01-01" });
    assert.equal(rows.length, 1, id);
    assert.ok(rows[0]!.legalCitations.some((c) => c.instrument === "PMK 168/2023"));
  }
});
