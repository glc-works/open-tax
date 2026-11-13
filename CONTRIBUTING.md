# Contributing to Open-Tax

Open-Tax is data plus a small validator. The valuable change is usually a cited rate, a mapping rule, or a policy diff. The risky change is a number with no source.

Pack data is not legal advice. Do not add a rate you cannot point at.

## Become a country pack maintainer

1. Read [benchmarks/global-comparison.md](benchmarks/global-comparison.md). Decide which local rules map to `standard`, `reduced`, `super_reduced`, `zero`, `exempt`, `out_of_scope`, `reverse_charge`, `withholding`, `luxury`, `not_collected`, and `final`. Write that decision down. It becomes `semantic_mappings` in the regime.
2. Open a [new country pack](.github/ISSUE_TEMPLATE/new-country-pack.yml) issue. Name the ISO code, the tax authority, the taxes in the first version, and what you will leave out.
3. Copy the starter:

   ```bash
   cp -R packs/_template packs/<iso>
   ```

   `<iso>` is the lowercase ISO 3166-1 alpha-2 code (`sg`, `de`, `br`). A subdivision pack uses `packs/<iso>-<subdivision>/` and a `pack_id` such as `us-ca`.
4. Replace `xx`, `XX`, `XXX`, and every `REPLACE` marker in `regime.json`. Set:
   - `jurisdiction`, `currency`, `authority`, and `maintainer`
   - one tax object per tax you actually encode
   - one treatment per local rule, with `semantic_code` and a `rule` that says when to pick it
   - at least one rate version per treatment, with `legal_citations`
5. Cite the law on every version you mark `verified` or `verified_starter`. The citation needs an `instrument` (statute, regulation, or gazette, with the article) and a `url`. A blog summary is not enough for a verified rate. If you know the rate is in force on a date but have not cited the original commencement, set `effective_from_bound` to `in_force_by` and say so in `notes`.
6. Keep history. When a rate changes, add a new version. Set `effective_to` on the old one to the inclusive last day. Link them with `superseded_by` and `successor_of`. Do not overwrite the old number.
7. Add `packs/<iso>/diffs/<date>-<instrument>.json` when the first version includes a transition. An initial snapshot with no transition does not need a fake diff. Delete `diffs/CHANGELOG.example.json` if you are not using it.
8. Add `packs/<iso>/dictionaries/` when you have filing codes or commodity codes. A code without a cited tax consequence stays out of the file. A markdown note is enough until the first real code exists. Indonesia's KBLI file is an empty structure on purpose.
9. Write `packs/<iso>/README.md`: what is encoded, what is not, and the URLs you used. State that silence is not zero.
10. Minimum fixtures, all of which the shared test suite already runs:
    - `regime.json` passes `npm run validate`
    - every treatment has a semantic mapping and at least one cited version
    - verified versions include a URL
    - date ranges inside one treatment do not overlap
    - the pack README names the non-goals
11. Test locally:

    ```bash
    npm ci
    npm test
    npm run typecheck
    npm run validate
    ```

    Node.js 20 or newer. `npm run validate` walks every directory under `packs/`.
12. Open a pull request. The template requires the legal citation, the effective dates, a green validation run, and a policy diff or an explanation of why there is no diff.
13. After the pack is accepted, a project maintainer adds you to [MAINTAINERS.md](MAINTAINERS.md) and uncomments a CODEOWNERS line:

    ```
    /packs/<iso>/    @your-github-handle
    ```

    `.github/CODEOWNERS` is ready for that line. Do not add yourself as owner in the same pull request that introduces unverified rates.

`packs/_template` uses pack id `xx` so the folder name does not have to match. A real folder must match `pack_id`.

## Report a wrong rate or an outdated rule

Use the [tax error or update](.github/ISSUE_TEMPLATE/tax-error-or-update.yml) form. The issue is not reviewable without all of these:

| Field | What to put |
| --- | --- |
| Jurisdiction | ISO code, and subdivision if the rule is local |
| Code or rule | Semantic code, treatment id, authority code, or the name of the missing rule |
| Legal reference | Statute, regulation, gazette, or tax-authority URL |
| Pinpoint | Article, section, or page |
| Effective date | `YYYY-MM-DD`. Include the end date if the rule is temporary |
| Expected versus actual | What a caller of `resolveTaxAtDate` gets today, and what the source requires |

Also say whether this is a wrong rate, an outdated regulation, a missing effective date, a missing exemption, a wrong semantic mapping, or an edge case (who is selling, what the good is, and which condition the general rate misses).

What happens next is in [MAINTAINERS.md](MAINTAINERS.md). Short version: a correction adds a new rate version and a policy diff. It does not silently edit yesterday's number.

## Change the schema or the library

- Schemas are draft 2020-12 in `schemas/`. The package copies them at build time.
- `packages/open-tax` is ESM and CJS. Public functions are `validatePack`, `resolveTaxAtDate`, and `diffPolicyChanges`.
- `base_formula` is a string for humans and agents. Do not evaluate it.
- Rates in JSON are decimal strings (`0.11` for 11%). Do not put binary floats in the files.
- Run `npm test`, `npm run typecheck`, and `npm run validate` before opening the pull request.

## Code of conduct

Disagree about a mapping in the open, with the citation attached. Do not present an estimate as a verified rate.
