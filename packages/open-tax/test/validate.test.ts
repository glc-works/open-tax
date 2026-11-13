import assert from "node:assert/strict";
import { test } from "node:test";
import { getSchemas, SEMANTIC_CODES, validatePack } from "../src/index.js";
import { exampleRegime } from "./fixtures.js";

test("semantic codes in the regime schema match the TypeScript list", () => {
  const schema = getSchemas().regime as {
    $defs: { semanticCode: { enum: string[] } };
  };
  assert.deepEqual(schema.$defs.semanticCode.enum, [...SEMANTIC_CODES]);
});

test("a linked two-version regime validates", () => {
  const result = validatePack(exampleRegime());
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});

test("overlapping rate versions fail integrity", () => {
  const regime = exampleRegime();
  const current = regime.taxes[0]?.treatments[0]?.rates[1];
  assert.ok(current);
  current.effective_from = "2023-06-01";
  const result = validatePack(regime);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((item) => item.message.includes("overlaps")));
});

test("a one-sided successor link fails integrity", () => {
  const regime = exampleRegime();
  const previous = regime.taxes[0]?.treatments[0]?.rates[0];
  assert.ok(previous);
  delete previous.superseded_by;
  const result = validatePack(regime);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((item) => item.path.endsWith("/successor_of")));
});

test("an unknown semantic code fails the schema", () => {
  const regime = exampleRegime();
  const treatment = regime.taxes[0]?.treatments[0];
  assert.ok(treatment);
  (treatment as { semantic_code: string }).semantic_code = "super_luxury";
  const mapping = regime.semantic_mappings[0];
  assert.ok(mapping);
  (mapping as { semantic_code: string }).semantic_code = "super_luxury";
  const result = validatePack(regime);
  assert.equal(result.valid, false);
});

test("verified rates need a citation URL", () => {
  const regime = exampleRegime();
  const treatment = regime.taxes[0]?.treatments[0];
  assert.ok(treatment?.verification);
  treatment.verification.status = "verified_starter";
  const result = validatePack(regime);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((item) => item.message.includes("instrument and a URL")));
});
