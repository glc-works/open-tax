# Maintainers

Open-Tax is maintained as a cited dataset. A maintainer's job is to keep each number traceable to a source and each semantic key stable.

Project home: [glc-works/open-tax](https://github.com/glc-works/open-tax). Attribution for redistributors is in [NOTICE](NOTICE).

## Seats

| Scope | Maintainer | Status |
| --- | --- | --- |
| Schema, library, and review of new packs | GLC Works / Open-Tax | Active. GitHub team name reserved in `.github/CODEOWNERS` as `@glc-works/open-tax-maintainers` (commented until the team exists). |
| `packs/id/` | Seat open | Starter encoded in this repository. A named maintainer is added with a CODEOWNERS line after they follow [CONTRIBUTING.md](CONTRIBUTING.md#become-a-country-pack-maintainer). |

Create the GitHub labels `tax-data` and `country-pack` so the issue forms can apply them. Missing labels do not block the form.

## Accepting a country maintainer

1. The application issue lists the authority, the first taxes, the sources, and the non-goals.
2. The pull request validates, cites every verified number, and maps every treatment.
3. Add the person to the table above and uncomment the matching block in `.github/CODEOWNERS`:

   ```
   /packs/<iso>/    @github-handle
   ```

4. They review later pulls that touch that pack. Schema pulls still need a project maintainer.

## Corrections

Anyone can report a wrong rate, an outdated regulation, a missing effective date, or an edge case with the [tax error form](.github/ISSUE_TEMPLATE/tax-error-or-update.yml). A maintainer triages it as follows.

1. Confirm the five required fields are present: jurisdiction, code or rule, legal reference, effective date, expected versus actual. If one is missing, ask for it and do not guess the number.
2. Open the cited instrument. Prefer the gazette or the tax-authority text over a commentary. If the commentary and the instrument disagree, follow the instrument and say so on the issue.
3. Decide the edit:
   - **Wrong number, same legal interval.** This is a data correction, not a change in the law. Replace the rate on the version whose `effective_from` is the real start of that legal interval. Do not set `effective_to` before that start, and do not leave the wrong number in force until the report date. Keep the erroneous encoding in git history and describe the correction in a policy diff with `change_type` `clarification`, so downstream systems can see that earlier lookups were wrong. A successor link is for a later legal rule, not for repairing a mistake.
   - **The law changed.** Do not edit the old version's rate. Set `effective_to`, add the new version, link `successor_of` and `superseded_by`, and add `packs/<iso>/diffs/<date>-<instrument>.json` with the migration impact.
   - **Missing exemption or edge case.** Add a treatment with its own semantic key (`exempt`, `out_of_scope`, `not_collected`, `luxury`, `reverse_charge`, or another key already in the schema). Do not overload `standard` with a note and hope callers read it.
   - **The report is outside the pack's stated scope** (for example a PPnBM percentage, while the Indonesia README says those percentages are not encoded). Say that, and leave the file silent rather than inserting an uncited figure.
4. Run `npm run validate`, `npm test`, and `npm run typecheck`.
5. Credit the reporter in the diff `notes` or the pull request. Merge only when the pull request checklist is actually true.

A maintainer does not give filing advice on the issue. The reply points at the citation and the pack change.

## Release of the npm package

`packages/open-tax` is `private: false` so it can be published later. Publishing is a separate decision. Do not run `npm publish` as part of a data correction.
