## Summary

<!-- What changed, and which jurisdiction or layer it touches. -->

## Jurisdiction pack

- [ ] Legal source cited for every new or changed rule (statute, regulation, gazette, or tax-authority page), with a URL or a formal instrument identifier.
- [ ] Every added or changed rate has `effective_from` and, when the rule ends, `effective_to`.
- [ ] Superseded rates stay in the file and are linked with `successor_of` / `superseded_by`. History is not overwritten.
- [ ] `npm run validate` passes (JSON Schema and pack integrity) for `packs/_template` and every touched pack.
- [ ] A policy diff is added under `packs/<iso>/diffs/` when a regulated rule changes. If this PR does not change a regulated rule (docs, schema, or tooling only), say so here:

<!-- Why no policy diff is required, or link the diff file. -->

- [ ] Numeric rates and thresholds are copied from the cited source. Nothing marked `verified` or `verified_starter` was estimated.

## Tests

- [ ] `npm test` and `npm run typecheck` pass, or this PR does not touch the TypeScript package or pack data.

## Not legal advice

Pack data is a coded reference for software. It is not a filing position.
