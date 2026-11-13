# Country pack template

Copy this folder to `packs/<iso>/`, using the lowercase ISO 3166-1 alpha-2 code (`sg`, `id`, `de`). Then replace every `REPLACE` marker and the `xx` / `XX` identifiers.

`XX` is not a country. The `none` rates in `regime.json` are placeholders so the file validates before you have a citation. Do not publish them as law.

## Minimum contents

1. `regime.json` with the authority, maintainer, one semantic mapping per treatment, and at least one cited rate version.
2. `README.md` stating what the pack covers and what it deliberately leaves out.
3. `diffs/` when you encode a change over time. An initial snapshot with no transition does not need a fake diff; delete `CHANGELOG.example.json` in that case.
4. `dictionaries/` when you map filing codes or commodity codes. A markdown note is enough until the first verified code exists.

## Dates

- `effective_from` is inclusive.
- `effective_to` is the inclusive last day. Omit it while the version is still open.
- Use `effective_from_bound: "in_force_by"` only when you have verified the rate on that date but have not yet cited the original commencement.
- When the law changes, add a new version. Point `superseded_by` and `successor_of` at each other. Do not edit the old number.

## Check

From the repository root:

```bash
npm run validate
npm test
npm run typecheck
```

The validator reads every folder under `packs/`.
