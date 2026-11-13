import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { diffPolicyChanges, resolveTaxAtDate } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
import { validateRepository } from "../src/cli.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadRegime(): Regime {
  return JSON.parse(readFileSync(join(repoRoot, "packs/id/regime.json"), "utf8")) as Regime;
}

test("every pack, diff, and dictionary validates", () => {
  const report = validateRepository(repoRoot);
  const errors = report.issues.filter((item) => item.level === "error");
  assert.equal(report.valid, true, JSON.stringify(errors, null, 2));
  assert.ok(report.packs >= 2);
});

test("Indonesia standard PPN follows 10%, then 11%, then 12% times 11/12", () => {
  const regime = loadRegime();
  const on = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "ppn-standard" })[0];

  const historic = on("2021-06-15");
  assert.equal(historic?.versionId, "ppn-standard-10");
  assert.equal(historic?.rate.value, "0.10");
  assert.equal(historic?.effectiveFromBound, "in_force_by");

  assert.equal(on("2022-03-31")?.rate.value, "0.10");
  assert.equal(on("2022-04-01")?.versionId, "ppn-standard-11");
  assert.equal(on("2024-12-31")?.rate.value, "0.11");

  const current = on("2025-01-01");
  assert.equal(current?.versionId, "ppn-standard-12-dpp");
  assert.equal(current?.rate.kind, "formula");
  assert.equal(current?.rate.statutory_value, "0.12");
  assert.equal(current?.rate.value, "0.11");
  assert.equal(current?.rate.base_formula, "11/12 * (nilai impor | harga jual | penggantian)");
  assert.equal(on("2025-06-01")?.versionId, "ppn-standard-12-dpp");
});

test("luxury PPN branches for final consumers in January 2025", () => {
  const regime = loadRegime();
  const january = resolveTaxAtDate(regime, { date: "2025-01-15", semanticCode: "luxury" });
  const ids = january.map((row) => row.versionId).sort();
  assert.deepEqual(ids, ["ppn-luxury-12", "ppn-luxury-fc-dpp"]);
  const transitional = january.find((row) => row.treatmentId === "ppn-luxury-final-consumer");
  assert.equal(transitional?.rate.value, "0.11");

  const february = resolveTaxAtDate(regime, {
    date: "2025-02-01",
    treatmentId: "ppn-luxury-final-consumer",
  });
  assert.equal(february[0]?.versionId, "ppn-luxury-fc-12");
  assert.equal(february[0]?.rate.value, "0.12");

  const before = resolveTaxAtDate(regime, { date: "2024-12-31", semanticCode: "luxury" });
  assert.deepEqual(before, []);
});

test("exempt, not collected, and out of scope stay distinct", () => {
  const regime = loadRegime();
  const date = "2025-03-01";
  const exempt = resolveTaxAtDate(regime, { date, treatmentId: "ppn-dibebaskan" })[0];
  const notCollected = resolveTaxAtDate(regime, { date, treatmentId: "ppn-tidak-dipungut" })[0];
  const outOfScope = resolveTaxAtDate(regime, { date, treatmentId: "ppn-non-objek" })[0];
  assert.equal(exempt?.semanticCode, "exempt");
  assert.equal(exempt?.inputCredit, "not_creditable");
  assert.equal(notCollected?.semanticCode, "not_collected");
  assert.equal(notCollected?.inputCredit, "creditable");
  assert.equal(outOfScope?.semanticCode, "out_of_scope");
  assert.notEqual(exempt?.treatmentId, notCollected?.treatmentId);
});

test("the PMK 131 diff is what a 2025 standard-rate query returns", () => {
  const regime = loadRegime();
  const diff = JSON.parse(
    readFileSync(join(repoRoot, "packs/id/diffs/2025-01-01-pmk-131-2024-ppn-dpp.json"), "utf8"),
  ) as PolicyDiff;
  const found = diffPolicyChanges([diff], {
    from: "2025-01-01",
    to: "2025-01-01",
    semanticCodes: ["standard"],
  });
  assert.equal(found.length, 1);
  assert.ok(found[0]?.changes.some((change) => change.id === "pmk131-dpp-nilai-lain"));
  const resolved = resolveTaxAtDate(regime, { date: "2025-01-15", semanticCode: "standard" });
  assert.ok(resolved.some((row) => row.versionId === "ppn-standard-12-dpp"));
});
