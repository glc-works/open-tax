# open-tax

Reference loader for [Open-Tax](https://github.com/glc-works/open-tax) jurisdiction packs.

Apache-2.0. See the repository [NOTICE](https://github.com/glc-works/open-tax/blob/main/NOTICE) for the attribution redistributors keep under Section 4(d).

```ts
import { validatePack, resolveTaxAtDate, diffPolicyChanges, getSchemas } from "open-tax";
```

- `validatePack(regime)` checks JSON Schema draft 2020-12 and pack integrity (citations, successor links, non-overlapping dates).
- `resolveTaxAtDate(regime, { date, treatmentId, semanticCode, taxId })` returns the versions in force on that inclusive date. It returns `base_formula` and any stated `value` as written. It does not evaluate the formula.
- `diffPolicyChanges(diffs, filter)` filters maintainer-authored policy diffs. `diffPolicyChanges(before, after)` reports structural edits between two regimes and does not invent a legal citation.
- `getSchemas()` returns the regime, policy-diff, and dictionary schemas. After `npm run build`, the same files are importable as `open-tax/schemas/regime.schema.json` and its siblings.

Build with `npm run build` from this package or from the repository root. This package is `private: false` and is not published from the dataset pull request.

Pack authoring, country maintainer steps, and the Indonesia starter live in the repository, not in this README.
