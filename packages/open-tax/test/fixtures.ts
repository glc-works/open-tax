import type { Regime } from "../src/types.js";

export function exampleRegime(): Regime {
  return {
    schema_version: "1.0.0",
    pack_id: "xx",
    jurisdiction: { code: "XX", name: "Example" },
    currency: "USD",
    authority: { id: "xx-auth", name: "Example Authority" },
    maintainer: { name: "Test" },
    semantic_mappings: [
      {
        semantic_code: "standard",
        treatment_id: "example-standard",
        rule: "Use for the example standard treatment only.",
      },
    ],
    taxes: [
      {
        id: "vat",
        name: "Example VAT",
        kind: "vat",
        treatments: [
          {
            id: "example-standard",
            name: "Standard",
            semantic_code: "standard",
            verification: { status: "structure_only" },
            rates: [
              {
                id: "example-standard-a",
                effective_from: "2020-01-01",
                effective_to: "2023-12-31",
                rate: { kind: "ad_valorem", value: "0.10" },
                legal_citations: [{ title: "Example A", instrument: "EX-1" }],
                superseded_by: "example-standard-b",
              },
              {
                id: "example-standard-b",
                effective_from: "2024-01-01",
                rate: {
                  kind: "formula",
                  statutory_value: "0.12",
                  value: "0.11",
                  base_formula: "process.exit(1)",
                },
                legal_citations: [{ title: "Example B", instrument: "EX-2" }],
                successor_of: "example-standard-a",
              },
            ],
          },
        ],
      },
    ],
  };
}
