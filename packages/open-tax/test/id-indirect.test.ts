import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate, validatePolicyDiff } from "../src/index.js";
import type { PolicyDiff, Regime } from "../src/types.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const on = (treatmentId: string, date = "2025-01-01") => resolveTaxAtDate(regime, { treatmentId, date });

test("special DPP paths retain their own bases rather than implying 11% of every invoice", () => {
  for (const suffix of ["self-use", "free-supply", "film", "dissolution", "intermediary", "auction", "asset-gift", "labour-service", "public-message"]) {
    const id = `ppn-nilai-lain-${suffix}`;
    assert.deepEqual(on(id, "2024-12-31"), []);
    const row = on(id)[0]!;
    assert.equal(row.rate.statutory_value, "0.12");
    assert.equal(row.rate.value, undefined);
    assert.match(row.rate.base_formula!, /11\/12/);
    assert.match(row.notes!, /Article 22.*1 January 2025.*4 February 2025/);
  }
  assert.match(on("ppn-nilai-lain-labour-service")[0]!.notes!, /separately itemised/);
  assert.match(on("ppn-nilai-lain-public-message")[0]!.rate.base_formula!, /excluding.*non-advertising/);
});

test("specific amounts preserve component bases and supplier scope", () => {
  assert.equal(on("ppn-besaran-religious-itemised")[0]?.rate.value, "0.011");
  assert.equal(on("ppn-besaran-religious-unsplit")[0]?.rate.value, "0.0055");
  assert.match(on("ppn-besaran-religious-unsplit")[0]!.notes!, /whole package/);
  assert.match(on("ppn-besaran-freight-forwarding")[0]!.notes!, /include freight/);
  assert.match(on("ppn-besaran-used-vehicles")[0]!.notes!, /not disposals/);
  assert.match(on("ppn-besaran-agri")[0]!.notes!, /not all agricultural goods/);
  assert.equal(on("ppn-tobacco-retail")[0]?.rate.value, "0.099");
});

test("LPG stores the exact tax-included margin ratio without a fabricated decimal", () => {
  for (const suffix of ["agent", "base"]) {
    const row = on(`ppn-lpg-${suffix}`)[0]!;
    assert.equal(row.rate.kind, "formula");
    assert.equal(row.rate.value, undefined);
    assert.match(row.rate.base_formula!, /1\.1 \/ 101\.1/);
    assert.match(row.notes!, /VAT is already included/);
  }
});

test("PMK 53 restatement has reciprocal versions with no gap, overlap or percentage change", () => {
  for (const [suffix, value] of [["insurance-agent", "0.011"], ["insurance-broker", "0.022"], ["self-build", "0.022"]]) {
    const id = `ppn-besaran-${suffix}`;
    const previous = on(id, "2025-07-31");
    const next = on(id, "2025-08-01");
    assert.equal(previous.length, 1);
    assert.equal(next.length, 1);
    assert.equal(previous[0]!.effectiveTo, "2025-07-31");
    const versions = regime.taxes.flatMap((tax) => tax.treatments).find((t) => t.id === id)!.rates;
    assert.equal(versions[0]!.superseded_by, next[0]!.versionId);
    assert.equal(versions[1]!.successor_of, previous[0]!.versionId);
    assert.equal(previous[0]!.rate.value, value);
    assert.equal(next[0]!.rate.value, value);
    assert.ok(next[0]!.legalCitations.some((c) => c.instrument === "PMK 53/2025"));
  }
  assert.match(on("ppn-besaran-self-build")[0]!.rate.base_formula!, /tidak termasuk perolehan tanah/);
});

test("PPnBM non-vehicle groups remain separate from the PPN luxury base and conditional relief", () => {
  const expected = [["housing", "0.20"], ["unpowered-aircraft", "0.40"], ["ammunition", "0.40"], ["aircraft", "0.50"], ["firearms", "0.50"], ["ships", "0.75"], ["yachts", "0.75"]];
  for (const [suffix, value] of expected) {
    const id = `ppnbm-${suffix}`;
    assert.deepEqual(on(id, "2020-12-14"), []);
    const row = on(id, "2020-12-15")[0]!;
    assert.equal(row.taxId, "ppnbm");
    assert.equal(row.rate.value, value);
    assert.equal(row.semanticCode, "luxury");
    assert.match(row.notes!, /not automatically at every resale/);
  }
  assert.match(on("ppnbm-yachts")[0]!.notes!, /four years/);
  assert.match(on("ppnbm-housing")[0]!.notes!, /do not classify every house/);
  assert.equal(resolveTaxAtDate(regime, { date: "2025-01-01", taxId: "ppn", semanticCode: "luxury" }).length, 2);
});

test("indirect-tax policy records resolve only their declared tax and cited treatment scope", () => {
  for (const name of ["2020-12-15-pp-61-2020-ppnbm", "2025-01-01-pmk-11-2025-special-bases", "2025-08-01-pmk-53-2025-restatement"]) {
    const diff = JSON.parse(readFileSync(join(root, "packs/id/diffs", `${name}.json`), "utf8")) as PolicyDiff;
    assert.equal(validatePolicyDiff(diff).valid, true, name);
    for (const change of diff.changes) for (const id of change.affected.treatment_ids!) {
      const rows = on(id, change.effective_from);
      assert.equal(rows.length, 1, id);
      assert.ok(change.affected.tax_ids!.includes(rows[0]!.taxId));
    }
  }
});
