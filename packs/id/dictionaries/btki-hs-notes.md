# BTKI, HS, and tax treatment

BTKI (Buku Tarif Kepabeanan Indonesia) is Indonesia's customs tariff book. Its headings follow the World Customs Organization Harmonized System. A BTKI or HS code classifies a good. It does not state a PPN rate, a PPh rate, or a PPnBM rate.

This starter does not vendor BTKI lines or the HS nomenclature. `datasets/harmonized-system` is a separate project; see `benchmarks/global-comparison.md`. Open-Tax does not copy it.

## When a code belongs in a dictionary

Add a JSON dictionary entry, validated by `schemas/dictionary-entry.schema.json`, only when a regulation attaches a tax consequence to a heading. The entry needs:

- `code`: the BTKI or HS heading you actually read
- `kind` on the dictionary: `commodity` or `correlation`
- `correlates_to`: for example `{ "system": "HS", "code": "the correlated heading" }`
- `maps_to`: the Open-Tax treatment (`ppn-standard`, `ppn-luxury`, `ppn-dibebaskan`, `out_of_scope`, and so on)
- `legal_citations`: the PMK, PP, or customs regulation, with a URL
- `verification.status`: `verified_starter` or `verified` only after that citation is in the file

Until that citation exists, leave the code out. An empty hint is better than a guessed heading.

## Illustration, not data

The following is a shape, not a classification. `REPLACE` is not an HS code.

```json
{
  "code": "REPLACE",
  "name": "Replace with the heading title from BTKI",
  "status": "sample",
  "verification": { "status": "structure_only" },
  "correlates_to": [{ "system": "HS", "code": "REPLACE", "notes": "Same heading in the HS edition you cite." }],
  "maps_to": {
    "tax_id": "ppn",
    "treatment_id": "ppn-standard",
    "semantic_code": "standard",
    "notes": "Say why this heading takes the standard treatment, and name the article."
  }
}
```

Luxury PPN under PMK 131/2024 depends on whether the good is a PPnBM luxury good, not on the mere fact that it has an HS code. Do not mark a heading `luxury` without the PPnBM instrument that lists it.
