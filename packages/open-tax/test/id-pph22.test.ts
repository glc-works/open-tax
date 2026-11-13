import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { diffPolicyChanges, resolveTaxAtDate } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const resolve = (suffix: string, date = "2025-08-01") =>
  resolveTaxAtDate(regime, { date, treatmentId: `pph22-${suffix}` });

test("PMK 51 import classes preserve commencement, API distinctions and the auction base", () => {
  const expected = [
    ["import-listed-10", "0.10"], ["import-listed-75", "0.075"],
    ["import-food-api", "0.005"], ["import-gold", "0.0025"],
    ["import-other-api", "0.025"], ["import-no-api", "0.075"], ["auction", "0.075"],
  ];
  for (const [id, rate] of expected) {
    assert.deepEqual(resolve(id!, "2025-07-31"), []);
    assert.equal(resolve(id!)[0]?.rate.value, rate);
    assert.equal(resolve(id!)[0]?.effectiveFromBound, "exact");
  }
  assert.match(resolve("import-other-api")[0]!.rate.base_formula!, /CIF plus import duty/);
  assert.equal(resolve("auction")[0]?.rate.base_formula, "Auction selling price");
  assert.match(resolve("import-no-api")[0]!.notes!, /Gold retains its own/);
});

test("PMK 51 final fuel/gas classes stay distinct from non-final fuel/gas and all lubricants", () => {
  const finals = resolveTaxAtDate(regime, { date: "2025-08-01", taxId: "pph22", semanticCode: "final" });
  assert.equal(finals.length, 4);
  assert.ok(finals.every((row) => row.treatmentId.endsWith("-agent")));
  for (const suffix of ["fuel-pertamina-spbu", "fuel-other-spbu", "fuel-other", "gas"]) {
    assert.equal(resolve(`${suffix}-agent`)[0]?.semanticCode, "final");
    assert.equal(resolve(`${suffix}-nonagent`)[0]?.semanticCode, "withholding");
    assert.equal(resolve(`${suffix}-agent`)[0]?.rate.value, resolve(`${suffix}-nonagent`)[0]?.rate.value);
  }
  assert.equal(resolve("fuel-pertamina-spbu-agent")[0]?.rate.value, "0.0025");
  assert.equal(resolve("fuel-other-spbu-agent")[0]?.rate.value, "0.003");
  assert.equal(resolve("lubricants")[0]?.semanticCode, "withholding");
});

test("PMK 51 purchase exclusions retain anti-splitting and tax-period aggregation scope", () => {
  assert.equal(resolve("government-goods")[0]?.rate.value, "0.015");
  assert.match(resolve("government-goods")[0]!.notes!, /2 million.*not split/);
  assert.match(resolve("specified-body-goods")[0]!.notes!, /10-million/);
  assert.match(resolve("raw-agri")[0]!.notes!, /20 million.*one tax period/);
  assert.equal(resolve("raw-agri")[0]?.rate.value, "0.0025");
  assert.equal(resolve("mineral-purchase")[0]?.rate.value, "0.015");
  assert.match(resolve("bullion-purchase")[0]!.notes!, /10 million.*not split/);
});

test("all 28 PMK 51 classes are cited and covered by the initial snapshot diff", () => {
  const diff = JSON.parse(readFileSync(join(root, "packs/id/diffs/2025-08-01-pmk-51-2025-pph22.json"), "utf8")) as PolicyDiff;
  const found = diffPolicyChanges([diff], { from: "2025-08-01", to: "2025-08-01" });
  const ids = found[0]!.changes[0]!.affected.treatment_ids!;
  assert.equal(ids.length, 28);
  for (const id of ids) {
    const rows = resolveTaxAtDate(regime, { date: "2025-08-01", treatmentId: id });
    assert.equal(rows.length, 1);
    assert.ok(rows[0]!.legalCitations.some((c) => c.instrument === "PMK 51/2025"));
  }
  for (const [id, rate] of [
    ["cement", "0.0025"], ["paper", "0.001"], ["steel", "0.003"],
    ["automotive", "0.0045"], ["medicines", "0.003"], ["vehicle-agents", "0.0045"],
  ]) assert.equal(resolve(id!)[0]?.rate.value, rate);
});
