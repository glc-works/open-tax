# Open-Tax

Open-Tax is an open, machine-readable standard for tax codification: versioned jurisdiction packs and regulatory policy diffs for accounting systems and AI agents.

It is published under the [Apache License 2.0](LICENSE). Attribution for redistributors lives in [NOTICE](NOTICE).

**Not legal advice.** A pack is a coded reference so software can apply a cited rule on a cited date. It is not a filing position, a tax opinion, or a complete statement of the law. Where a number is missing, the pack is silent. Do not read silence as zero.

## Four layers

1. **Jurisdiction tax regime.** `packs/<iso>/regime.json` names the country, currency, tax authority, and maintainer, then lists each tax and its treatments. Every rate version has `effective_from`, an optional inclusive `effective_to`, legal citations, and `successor_of` / `superseded_by` links. History stays in the file.
2. **Semantic tax treatment codes.** Local rules map onto a small universal vocabulary: `standard`, `reduced`, `super_reduced`, `zero`, `exempt`, `out_of_scope`, `reverse_charge`, `withholding`, `luxury`, `not_collected`, and `final`. The mapping rule on each treatment says when to choose it. Local names stay in `local_name` and `local_code`.
3. **Authority, filing, and commodity dictionaries.** KAP/KJS, HS, BTKI, HSN/SAC, NCM, and similar codes are identifiers. A dictionary entry may point at a treatment. The code itself is not a rate.
4. **Regulatory policy diffs.** `packs/<iso>/diffs/*.json` is the change log: legal basis, effective date, affected codes, the base formula in words, and the migration impact on invoicing, payroll, or filing.

The reference library loads and checks this data. It does not evaluate `base_formula` and it does not compute money.

## Install

Requires Node.js 20 or newer.

Run the command without adding it to the project:

```bash
npx open-tax --help
pnpm dlx open-tax --help
```

Install the `open-tax` command:

```bash
npm install -g open-tax
pnpm add -g open-tax
```

Homebrew, from the [`glc-works/tap`](https://github.com/glc-works/homebrew-tap) tap:

```bash
brew tap glc-works/tap
brew install open-tax
```

`brew install glc-works/tap/open-tax` is the same install. The formula template lives in [`packaging/homebrew`](packaging/homebrew/README.md). A tagged release builds the tarball that formula installs. See [Develop from a checkout](#develop-from-a-checkout).

Install the library in another Node project:

```bash
npm install open-tax
```

```js
import { resolveTaxAtDate, validatePack } from "open-tax";
```

## Command line

```bash
open-tax --help
open-tax --version
open-tax validate
open-tax validate packs/id
open-tax validate packs/id/regime.json
open-tax resolve packs/id/regime.json --date 2025-06-01 --treatment ppn-standard
```

`validate` with no path searches upward from the current directory for a checkout that contains `schemas/` and `packs/`. A path may be that checkout, one pack folder, or a `regime.json` file.

`resolve` prints JSON from `resolveTaxAtDate`. It copies `base_formula` through as text and does not evaluate it.

`npm run validate` in this repository runs the same checker with no arguments.

## Develop from a checkout

```bash
git clone https://github.com/glc-works/open-tax.git
cd open-tax
npm ci
npm test
npm run typecheck
npm run validate
npm run build
```

`npm run validate` checks `packs/_template` and `packs/id` against the JSON Schemas and the integrity rules (successor links, non-overlapping dates, citations on verified rates).

Resolve the Indonesia standard VAT treatment on a date:

```js
import { readFileSync } from "node:fs";
import { resolveTaxAtDate, validatePack } from "open-tax";

const regime = JSON.parse(readFileSync("packs/id/regime.json", "utf8"));
const check = validatePack(regime);
if (!check.valid) throw new Error(check.issues.map((issue) => issue.message).join("\n"));

const [rate] = resolveTaxAtDate(regime, { date: "2025-06-01", treatmentId: "ppn-standard" });
// statutory 12% on a nilai lain base of 11/12; stated effective equivalent 11%
console.log(rate.rate.statutory_value, rate.rate.base_formula, rate.rate.value);
```

`npm run build` writes the package that `npm pack` publishes, including the `open-tax` command at `dist/cli.js`. Pushing a tag `vX.Y.Z` that matches `packages/open-tax/package.json` runs the release workflow: tests, the tarball, a GitHub release, and npm publish when the `NPM_TOKEN` secret is set. A data pull request does not publish.

The package name is `open-tax`, license `Apache-2.0`, `private` false. Schemas are exported from `open-tax/schemas/*.json` after the build copies them.

## Country packs

Copy [`packs/_template`](packs/_template) to `packs/<iso>/`. The step-by-step maintainer guide is [CONTRIBUTING.md](CONTRIBUTING.md#become-a-country-pack-maintainer). How a local rule lands on a universal key is [benchmarks/global-comparison.md](benchmarks/global-comparison.md).

The first real pack is [Indonesia](packs/id/README.md): PPN (including the 1 April 2022 move from 10% to 11%, and PMK 131/2024 from 1 January 2025), the dibebaskan / tidak dipungut / non-objek split, and starter PPh 21, 22, 23, 4(2), and 26 categories. Monthly TER percentages, PPh 22 percentages, PPh 4(2) percentages, and PPnBM rates are not invented to fill the file.

## Corrections

Wrong rate, outdated regulation, missing effective date, or an edge case: open a [tax error or update](.github/ISSUE_TEMPLATE/tax-error-or-update.yml) issue. Required fields are the jurisdiction, the code or rule, a legal reference or gazette URL, the effective date, and expected versus actual. The review path is [MAINTAINERS.md](MAINTAINERS.md).

A pull request that changes a regulated rule must cite the source, keep `effective_from` / `effective_to`, pass validation, and add a policy diff. The checklist is in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).

## Repository map

| Path | Role |
| --- | --- |
| `schemas/` | JSON Schema draft 2020-12 for regimes, policy diffs, and dictionary entries |
| `packs/_template/` | Copy-paste starter |
| `packs/id/` | Indonesia starter |
| `benchmarks/` | How other administrations and open projects relate to the four layers |
| `packages/open-tax/` | TypeScript ESM and CJS library, and the `open-tax` command |
| `packaging/homebrew/` | Homebrew formula template for `glc-works/tap` |
| `NOTICE` | Apache-2.0 Section 4(d) attribution |

## Inspiration

Open-Tax does not copy these projects. They shaped the design, and they keep their own licenses:

- [GOBL](https://github.com/invopop/gobl) (`invopop/gobl`): a regime-and-category model for business documents. Open-Tax is a dated reference pack and diff log, not an invoice schema.
- Singapore IRAS GST categories (standard-rated, zero-rated, exempt, out of scope), which line up with the semantic keys.
- China's 税收分类编码: a classification code on the VAT invoice, which belongs in the dictionary layer.
- India's HSN and SAC codes: commodity and service identifiers that a notification then attaches to a slab.
- WCO Harmonized System correlations, including Indonesia's BTKI. The code classifies the good. A regulation, not the code, sets the tax.
- [OpenFisca](https://openfisca.org/): parameters that carry a start date and a legal reference. Open-Tax keeps that idea in JSON and does not ship an executable formula engine.
- [datasets/harmonized-system](https://github.com/datasets/harmonized-system): an open HS dataset. Open-Tax points at HS as a correlation target and does not vendor the nomenclature.

The comparison is written out in [benchmarks/global-comparison.md](benchmarks/global-comparison.md).
