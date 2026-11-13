import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { diffPolicyChanges, resolveTaxAtDate } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;

for (const [category, count, top] of [
  ["a", 44, "1400000000"],
  ["b", 40, "1405000000"],
  ["c", 41, "1419000000"],
] as const) {
  test(`monthly TER ${category.toUpperCase()} has complete contiguous gross-income bands`, () => {
    const treatmentId = `pph21-ter-monthly-${category}`;
    assert.deepEqual(resolveTaxAtDate(regime, { date: "2023-12-31", treatmentId }), []);
    const rows = resolveTaxAtDate(regime, { date: "2024-01-01", treatmentId });
    assert.equal(rows.length, 1);
    const row = rows[0]!;
    assert.equal(row.semanticCode, "withholding");
    assert.equal(row.effectiveFromBound, "exact");
    assert.equal(row.rate.currency, "IDR");
    const brackets = row.rate.brackets!;
    assert.equal(brackets.length, count);
    assert.equal(brackets[0]!.over, undefined);
    assert.equal(brackets[0]!.rate, "0");
    for (let index = 1; index < brackets.length; index += 1) {
      const previous = brackets[index - 1]!;
      const current = brackets[index]!;
      assert.equal(current.over, previous.up_to);
      if (current.up_to) assert.ok(BigInt(current.up_to) > BigInt(current.over!));
      assert.ok(Number(current.rate) > Number(previous.rate));
    }
    assert.equal(brackets.at(-1)!.over, top);
    assert.equal(brackets.at(-1)!.up_to, undefined);
    assert.equal(brackets.at(-1)!.rate, "0.34");
    assert.ok(row.legalCitations.some((citation) => citation.url?.endsWith("Lampiran%20PP58TAHUN2023.pdf")));
  });
}

test("TER selects one whole-gross-income percentage at inclusive/exclusive annex boundaries", () => {
  // Independent examples from annex A-C; the resolver itself does not calculate tax.
  const fixtures = [
    ["a", "5400000", "0"], ["a", "5400001", "0.0025"],
    ["a", "10350000", "0.0225"], ["a", "10350001", "0.025"],
    ["a", "1400000000", "0.33"], ["a", "1400000001", "0.34"],
    ["b", "6200000", "0"], ["b", "6200001", "0.0025"],
    ["b", "9200000", "0.01"], ["b", "9200001", "0.015"],
    ["b", "1405000000", "0.33"], ["b", "1405000001", "0.34"],
    ["c", "6600000", "0"], ["c", "6600001", "0.0025"],
    ["c", "12050000", "0.02"], ["c", "12050001", "0.03"],
    ["c", "1419000000", "0.33"], ["c", "1419000001", "0.34"],
  ];
  for (const [category, gross, expected] of fixtures) {
    const row = resolveTaxAtDate(regime, {
      date: "2024-06-01", treatmentId: `pph21-ter-monthly-${category}`,
    })[0]!;
    const matches = row.rate.brackets!.filter((band) =>
      (!band.over || BigInt(gross!) > BigInt(band.over)) &&
      (!band.up_to || BigInt(gross!) <= BigInt(band.up_to)),
    );
    assert.equal(matches.length, 1, `${category}: ${gross}`);
    assert.equal(matches[0]!.rate, expected, `${category}: ${gross}`);
  }
});

test("TER schedules retain employment scope selectors and the authored 2024 policy transition", () => {
  const pph21 = regime.taxes.find((tax) => tax.id === "pph21")!;
  const permanent = pph21.treatments.find((treatment) => treatment.id === "pph21-ter-monthly")!;
  const nonPermanent = pph21.treatments.find((treatment) => treatment.id === "pph21-ter-monthly-tidak-tetap")!;
  assert.equal(permanent.collection?.reconciled_annually, true);
  assert.equal(nonPermanent.collection?.reconciled_annually, false);
  const diff = JSON.parse(readFileSync(
    join(root, "packs/id/diffs/2024-01-01-pp-58-2023-pph21-ter.json"), "utf8",
  )) as PolicyDiff;
  const found = diffPolicyChanges([diff], { from: "2024-01-01", to: "2024-01-01" });
  const affected = found[0]!.changes.flatMap((change) => change.affected.treatment_ids ?? []);
  for (const category of ["a", "b", "c"]) assert.ok(affected.includes(`pph21-ter-monthly-${category}`));
});

test("HPP corporate treatments begin at the encoded tax-year boundary and retain relief scope", () => {
  for (const [treatmentId, value] of [["corporate-standard", "0.22"], ["corporate-31e", "0.11"]]) {
    assert.deepEqual(resolveTaxAtDate(regime, { date: "2021-12-31", treatmentId }), []);
    const rows = resolveTaxAtDate(regime, { date: "2022-01-01", treatmentId });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.taxId, "corporate-income-tax");
    assert.equal(rows[0]!.rate.value, value);
  }
  const relief = resolveTaxAtDate(regime, { date: "2022-01-01", treatmentId: "corporate-31e" })[0]!;
  assert.equal(relief.semanticCode, "reduced");
  assert.equal(relief.rate.kind, "formula");
  assert.equal(relief.rate.statutory_value, "0.22");
  assert.match(relief.notes!, /at most IDR 50 billion/);
  assert.match(relief.notes!, /not apply to a permanent establishment/);
  assert.match(relief.rate.base_formula!, /PKP/);
});
