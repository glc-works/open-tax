import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { diffPolicyChanges, resolveTaxAtDate } from "../src/index.js";
import type { Dictionary, PolicyDiff, Regime } from "../src/types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const regime = JSON.parse(readFileSync(join(root, "packs/id/regime.json"), "utf8")) as Regime;
const on = (date: string) => resolveTaxAtDate(regime, { date, treatmentId: "pph4-2-umkm" });

test("UMKM encodes the PP 55 commencement and inclusive PP 20 scope transition", () => {
  assert.deepEqual(on("2022-12-19"), []);
  assert.equal(on("2022-12-20")[0]?.versionId, "umkm-pp55-2022");
  assert.equal(on("2026-04-21").length, 1);
  assert.equal(on("2026-04-21")[0]?.versionId, "umkm-pp55-2022");
  assert.equal(on("2026-04-22").length, 1);
  assert.equal(on("2026-04-22")[0]?.versionId, "umkm-pp20-2026");
  for (const date of ["2022-12-20", "2026-04-21", "2026-04-22"]) {
    assert.equal(on(date)[0]?.rate.value, "0.005");
    assert.equal(on(date)[0]?.semanticCode, "final");
    assert.equal(on(date)[0]?.rate.kind, "formula");
  }
});

test("UMKM keeps scope history, personal allowance and transition caveats separate from the rate", () => {
  const treatment = regime.taxes.flatMap((tax) => tax.treatments).find((item) => item.id === "pph4-2-umkm")!;
  assert.ok(treatment);
  assert.equal(treatment.rates[0]?.effective_to, "2026-04-21");
  assert.equal(treatment.rates[0]?.superseded_by, treatment.rates[1]?.id);
  assert.equal(treatment.rates[1]?.successor_of, treatment.rates[0]?.id);
  assert.equal(treatment.parameters?.find((item) => item.id === "umkm-turnover-limit")?.value, "4800000000");
  const allowance = treatment.parameters?.find((item) => item.id === "umkm-op-allowance");
  assert.equal(allowance?.value, "500000000");
  assert.match(allowance?.notes ?? "", /individuals only/);
  assert.match(treatment.rates[0]?.notes ?? "", /7.*4.*3/);
  assert.match(on("2026-04-22")[0]?.notes ?? "", /grandfather/);
  assert.match(on("2026-04-22")[0]?.notes ?? "", /2025/);
  assert.match(on("2026-04-22")[0]?.notes ?? "", /Article 61/);
  assert.ok(on("2026-04-22")[0]?.legalCitations.some((citation) => citation.instrument.includes("20/2026")));
});

test("UMKM policy diffs describe initial PP 55 coverage and a scope change, not a 2026 rate increase", () => {
  const load = (name: string) => JSON.parse(readFileSync(join(root, "packs/id/diffs", name), "utf8")) as PolicyDiff;
  const diffs = [load("2022-12-20-pp-55-2022-umkm.json"), load("2026-04-22-pp-20-2026-umkm.json")];
  const found = diffPolicyChanges(diffs, { from: "2026-04-22", to: "2026-04-22", semanticCodes: ["final"] });
  assert.equal(found.length, 1);
  assert.equal(found[0]?.changes[0]?.change_type, "scope_change");
  assert.equal(found[0]?.changes[0]?.before?.effective_rate, "0.005");
  assert.equal(found[0]?.changes[0]?.after?.effective_rate, "0.005");
  assert.deepEqual(found[0]?.changes[0]?.affected.treatment_ids, ["pph4-2-umkm"]);
});

test("UMKM billing dictionary distinguishes self-payment from withholding without selecting eligibility", () => {
  const dictionary = JSON.parse(readFileSync(join(root, "packs/id/dictionaries/kap-kjs.sample.json"), "utf8")) as Dictionary;
  for (const code of ["411128-420", "411128-423"]) {
    const entry = dictionary.entries.find((item) => item.code === code);
    assert.equal(entry?.maps_to?.treatment_id, "pph4-2-umkm");
    assert.equal(entry?.maps_to?.semantic_code, "final");
    assert.match(entry?.maps_to?.notes ?? "", /eligibility/);
    assert.ok(entry?.legal_citations?.every((citation) => citation.url?.startsWith("https://")));
  }
});
