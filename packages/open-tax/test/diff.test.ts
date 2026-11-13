import assert from "node:assert/strict";
import { test } from "node:test";
import { diffPolicyChanges } from "../src/index.js";
import type { PolicyDiff } from "../src/types.js";
import { exampleRegime } from "./fixtures.js";

const diffs: PolicyDiff[] = [
  {
    schema_version: "1.0.0",
    id: "sample-diff",
    jurisdiction: "XX",
    title: "Sample",
    legal_basis: [{ title: "Example", instrument: "EX-2" }],
    changes: [
      {
        id: "rate",
        effective_from: "2024-01-01",
        change_type: "rate_change",
        summary: "Rate change.",
        affected: { semantic_codes: ["standard"], tax_ids: ["vat"] },
        migration_impact: { severity: "low", summary: "Update the rate." },
      },
      {
        id: "other",
        effective_from: "2020-01-01",
        effective_to: "2020-01-31",
        change_type: "clarification",
        summary: "Old note.",
        affected: { semantic_codes: ["exempt"] },
        migration_impact: { severity: "low", summary: "No system change." },
      },
    ],
  },
];

test("diffPolicyChanges filters authored diffs by date and semantic code", () => {
  const found = diffPolicyChanges(diffs, {
    from: "2024-01-01",
    to: "2024-12-31",
    semanticCodes: ["standard"],
  });
  assert.equal(found.length, 1);
  assert.deepEqual(
    found[0]?.changes.map((change) => change.id),
    ["rate"],
  );
  assert.equal(diffs[0]?.changes.length, 2);
});

test("diffPolicyChanges reports a regime edit without inventing a citation", () => {
  const before = exampleRegime();
  const after = exampleRegime();
  const version = after.taxes[0]?.treatments[0]?.rates[1];
  assert.ok(version);
  version.rate = { ...version.rate, value: "0.12" };
  const changes = diffPolicyChanges(before, after);
  assert.equal(changes.length, 1);
  assert.equal(changes[0]?.changeType, "modified");
  assert.equal(changes[0]?.versionId, "example-standard-b");
  assert.equal("legal_basis" in changes[0], false);
});
