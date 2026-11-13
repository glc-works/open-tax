import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate, validatePack } from "../src/index.js";
import type { Dictionary, Regime } from "../src/types.js";
import { validateRepository } from "../src/cli.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadRegime(packId: string): Regime {
  return JSON.parse(readFileSync(join(repoRoot, "packs", packId, "regime.json"), "utf8")) as Regime;
}

function loadDictionary(packId: string, file: string): Dictionary {
  return JSON.parse(
    readFileSync(join(repoRoot, "packs", packId, "dictionaries", file), "utf8"),
  ) as Dictionary;
}

test("repository validation counts the new jurisdiction packs without a fixed total", () => {
  const report = validateRepository(repoRoot);
  const errors = report.issues.filter((item) => item.level === "error");
  assert.equal(report.valid, true, JSON.stringify(errors, null, 2));
  assert.ok(report.packs >= 5);
});

test("Singapore, Malaysia, China, and India packs validate on their own", () => {
  for (const packId of ["sg", "my", "cn", "in"]) {
    const regime = loadRegime(packId);
    const result = validatePack(regime, { expectedPackId: packId });
    const errors = result.issues.filter((item) => item.level === "error");
    assert.equal(result.valid, true, `${packId}: ${JSON.stringify(errors, null, 2)}`);
  }
});

test("Singapore GST steps from 3% to 9%, with zero, exempt, and out of scope kept apart", () => {
  const regime = loadRegime("sg");
  const standard = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "sg-gst-standard" })[0];

  assert.equal(standard("2002-12-31")?.rate.value, "0.03");
  assert.equal(standard("2003-01-01")?.rate.value, "0.04");
  assert.equal(standard("2004-01-01")?.rate.value, "0.05");
  assert.equal(standard("2007-07-01")?.rate.value, "0.07");
  assert.equal(standard("2023-01-01")?.rate.value, "0.08");
  assert.equal(standard("2024-01-01")?.versionId, "sg-gst-standard-9");
  assert.equal(standard("2024-06-01")?.rate.value, "0.09");

  const date = "2024-06-01";
  const zero = resolveTaxAtDate(regime, { date, treatmentId: "sg-gst-zero" })[0];
  const exempt = resolveTaxAtDate(regime, { date, treatmentId: "sg-gst-exempt" })[0];
  const outOfScope = resolveTaxAtDate(regime, { date, treatmentId: "sg-gst-out-of-scope" })[0];
  assert.equal(zero?.semanticCode, "zero");
  assert.equal(zero?.rate.value, "0");
  assert.equal(zero?.inputCredit, "creditable");
  assert.equal(exempt?.semanticCode, "exempt");
  assert.equal(exempt?.inputCredit, "not_creditable");
  assert.equal(outOfScope?.semanticCode, "out_of_scope");
  assert.notEqual(exempt?.treatmentId, outOfScope?.treatmentId);
});

test("Singapore reverse charge and overseas vendor registration start on 2020-01-01", () => {
  const regime = loadRegime("sg");
  const beforeRc = resolveTaxAtDate(regime, {
    date: "2019-12-31",
    treatmentId: "sg-gst-reverse-charge",
  });
  const beforeOvr = resolveTaxAtDate(regime, { date: "2019-12-31", treatmentId: "sg-gst-ovr" });
  assert.deepEqual(beforeRc, []);
  assert.deepEqual(beforeOvr, []);

  const rc = resolveTaxAtDate(regime, { date: "2020-01-01", treatmentId: "sg-gst-reverse-charge" })[0];
  const ovr = resolveTaxAtDate(regime, { date: "2020-01-01", treatmentId: "sg-gst-ovr" })[0];
  assert.equal(rc?.rate.value, "0.07");
  assert.equal(rc?.semanticCode, "reverse_charge");
  assert.equal(ovr?.rate.value, "0.07");
  assert.equal(ovr?.treatmentId, "sg-gst-ovr");
});

test("Singapore corporate tax is 17% and director withholding moves from 22% to 24%", () => {
  const regime = loadRegime("sg");
  const cit = resolveTaxAtDate(regime, { date: "2024-01-01", treatmentId: "sg-cit-standard" })[0];
  assert.equal(cit?.rate.value, "0.17");

  const before = resolveTaxAtDate(regime, { date: "2023-12-31", treatmentId: "sg-wht-director" })[0];
  const after = resolveTaxAtDate(regime, { date: "2024-01-01", treatmentId: "sg-wht-director" })[0];
  assert.equal(before?.versionId, "sg-wht-director-22");
  assert.equal(before?.rate.value, "0.22");
  assert.equal(after?.versionId, "sg-wht-director-24");
  assert.equal(after?.rate.value, "0.24");
});

test("Singapore GST F5 dictionary lists boxes 1 through 17", () => {
  const dictionary = loadDictionary("sg", "gst-f5-boxes.json");
  assert.equal(dictionary.dictionary_id, "sg-gst-f5-boxes");
  const codes = dictionary.entries.map((entry) => entry.code);
  assert.deepEqual(
    codes,
    Array.from({ length: 17 }, (_, index) => String(index + 1)),
  );
});

test("Malaysia service tax and sales tax are not creditable", () => {
  const regime = loadRegime("my");
  const date = "2026-01-01";
  for (const treatmentId of [
    "my-service-tax-standard",
    "my-service-tax-first-schedule-6",
    "my-service-tax-rental-leasing",
    "my-sales-tax-standard",
    "my-sales-tax-reduced",
  ]) {
    const row = resolveTaxAtDate(regime, { date, treatmentId })[0];
    assert.equal(row?.inputCredit, "not_creditable", treatmentId);
  }
});

test("Malaysia service tax moves from 6% to 8% on 2024-03-01", () => {
  const regime = loadRegime("my");
  const on = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "my-service-tax-standard" })[0];
  assert.equal(on("2024-02-29")?.rate.value, "0.06");
  assert.equal(on("2024-03-01")?.versionId, "my-service-tax-standard-8");
  assert.equal(on("2024-03-01")?.rate.value, "0.08");
});

test("Malaysia rental and leasing is 8% then a 6% effective formula on an 8% statutory rate", () => {
  const regime = loadRegime("my");
  const introduced = resolveTaxAtDate(regime, {
    date: "2025-07-01",
    treatmentId: "my-service-tax-rental-leasing",
  })[0];
  assert.equal(introduced?.versionId, "my-service-tax-rental-leasing-8");
  assert.equal(introduced?.rate.value, "0.08");

  const before = resolveTaxAtDate(regime, {
    date: "2025-06-30",
    treatmentId: "my-service-tax-rental-leasing",
  });
  assert.deepEqual(before, []);

  const adjusted = resolveTaxAtDate(regime, {
    date: "2026-01-01",
    treatmentId: "my-service-tax-rental-leasing",
  })[0];
  assert.equal(adjusted?.versionId, "my-service-tax-rental-leasing-admin-6");
  assert.equal(adjusted?.rate.kind, "formula");
  assert.equal(adjusted?.rate.value, "0.06");
  assert.equal(adjusted?.rate.statutory_value, "0.08");
});

test("Malaysia sales tax 10% and 5% start on 2025-07-01", () => {
  const regime = loadRegime("my");
  const standard = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "my-sales-tax-standard" });
  const reduced = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "my-sales-tax-reduced" });
  assert.deepEqual(standard("2025-06-30"), []);
  assert.deepEqual(reduced("2025-06-30"), []);
  assert.equal(standard("2025-07-01")[0]?.rate.value, "0.10");
  assert.equal(reduced("2025-07-01")[0]?.rate.value, "0.05");
});

test("Malaysia corporate tax is 24% with MSME tiers", () => {
  const regime = loadRegime("my");
  const cit = resolveTaxAtDate(regime, { date: "2024-01-01", treatmentId: "my-cit-standard" })[0];
  assert.equal(cit?.rate.value, "0.24");
  const msme = resolveTaxAtDate(regime, { date: "2023-01-01", treatmentId: "my-cit-msme" })[0];
  assert.equal(msme?.rate.kind, "schedule");
  assert.deepEqual(
    msme?.rate.brackets?.map((bracket) => bracket.rate),
    ["0.15", "0.17", "0.24"],
  );
});

test("China standard VAT steps from 17% to 16% to 13% and the 2026 VAT Law", () => {
  const regime = loadRegime("cn");
  const on = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "cn-vat-standard" })[0];
  assert.equal(on("2018-04-30")?.rate.value, "0.17");
  assert.equal(on("2018-05-01")?.versionId, "cn-vat-standard-16");
  assert.equal(on("2018-05-01")?.rate.value, "0.16");
  assert.equal(on("2019-03-31")?.rate.value, "0.16");
  assert.equal(on("2019-04-01")?.versionId, "cn-vat-standard-13");
  assert.equal(on("2019-04-01")?.rate.value, "0.13");
  assert.equal(on("2025-12-31")?.versionId, "cn-vat-standard-13");
  assert.equal(on("2026-01-01")?.versionId, "cn-vat-standard-13-law");
  assert.equal(on("2026-01-01")?.rate.value, "0.13");
});

test("China reduced 9% and 6% bands and the 3% simplified rate", () => {
  const regime = loadRegime("cn");
  const reduced = resolveTaxAtDate(regime, { date: "2019-04-01", treatmentId: "cn-vat-reduced-9" })[0];
  assert.equal(reduced?.rate.value, "0.09");

  const six = resolveTaxAtDate(regime, { date: "2016-05-01", treatmentId: "cn-vat-reduced-6" })[0];
  assert.equal(six?.versionId, "cn-vat-reduced-6-pilot");
  assert.equal(six?.rate.value, "0.06");
  assert.ok(
    six?.legalCitations.some((citation) => citation.instrument.includes("财税〔2016〕36号")),
  );

  const simplified = resolveTaxAtDate(regime, {
    date: "2026-01-01",
    treatmentId: "cn-vat-simplified-3",
  })[0];
  assert.equal(simplified?.rate.value, "0.03");
  const beforeSimplified = resolveTaxAtDate(regime, {
    date: "2025-12-31",
    treatmentId: "cn-vat-simplified-3",
  });
  assert.deepEqual(beforeSimplified, []);
});

test("China tax classification sample uses 19-digit codes", () => {
  const dictionary = loadDictionary("cn", "tax-classification-codes.sample.json");
  assert.equal(dictionary.entries.length, 15);
  for (const entry of dictionary.entries) {
    assert.match(entry.code, /^\d{19}$/);
  }
});

test("India GST keeps 18% and 5%, and retires 12% on 2025-09-21", () => {
  const regime = loadRegime("in");
  const standard = resolveTaxAtDate(regime, { date: "2025-09-22", treatmentId: "in-gst-standard" })[0];
  assert.equal(standard?.rate.value, "0.18");
  const reduced = resolveTaxAtDate(regime, { date: "2025-09-22", treatmentId: "in-gst-reduced-5" })[0];
  assert.equal(reduced?.rate.value, "0.05");

  const retired = resolveTaxAtDate(regime, {
    date: "2025-09-21",
    treatmentId: "in-gst-reduced-12",
  })[0];
  assert.equal(retired?.rate.value, "0.12");
  assert.equal(retired?.effectiveTo, "2025-09-21");
  const after = resolveTaxAtDate(regime, {
    date: "2025-09-22",
    treatmentId: "in-gst-reduced-12",
  });
  assert.deepEqual(after, []);
});

test("India luxury GST moves from 28% to 40% on 2025-09-22 and again on 2026-02-01", () => {
  const regime = loadRegime("in");
  const on = (date: string) =>
    resolveTaxAtDate(regime, { date, treatmentId: "in-gst-luxury-28-40" })[0];
  assert.equal(on("2025-09-21")?.versionId, "in-gst-luxury-28");
  assert.equal(on("2025-09-21")?.rate.value, "0.28");
  assert.equal(on("2025-09-22")?.versionId, "in-gst-luxury-40");
  assert.equal(on("2025-09-22")?.rate.value, "0.40");
  assert.equal(on("2026-01-31")?.versionId, "in-gst-luxury-40");
  assert.equal(on("2026-02-01")?.versionId, "in-gst-luxury-40-tobacco");
  assert.equal(on("2026-02-01")?.rate.value, "0.40");
});

test("India HSN/SAC dictionary is present", () => {
  const dictionary = loadDictionary("in", "hsn-sac.sample.json");
  assert.equal(dictionary.dictionary_id, "in-hsn-sac");
  assert.ok(dictionary.entries.length > 0);
  assert.ok(dictionary.entries.some((entry) => entry.code === "0401"));
});
