# open-tax

Reference loader and command-line tool for [Open-Tax](https://github.com/glc-works/open-tax) jurisdiction packs.

Licensed under the [Mozilla Public License 2.0 (MPL-2.0)](LICENSE). See [NOTICE](NOTICE) for attribution and source availability information. Source Code Form is available in the [Open-Tax repository](https://github.com/glc-works/open-tax).

## Install

Requires Node.js 20 or newer.

```bash
npx open-tax --help
pnpm dlx open-tax --help
npm install -g open-tax
pnpm add -g open-tax
```

Homebrew:

```bash
brew tap glc-works/tap
brew install open-tax
```

`brew install glc-works/tap/open-tax` is the same command. The tap formula is maintained from [`packaging/homebrew`](https://github.com/glc-works/open-tax/blob/main/packaging/homebrew/README.md).

Use the library from another project with `npm install open-tax` or `pnpm add open-tax`.

## Command line

```bash
open-tax --help
open-tax --version
open-tax validate
open-tax validate packs/id
open-tax validate packs/id/regime.json
open-tax resolve packs/id/regime.json --date 2025-06-01 [--semantic <code>] [--tax <id>] [--treatment <id>]
```

`validate` checks a checkout that contains `schemas/` and `packs/`, one pack folder, or a `regime.json` file. With no path, it searches upward from the current directory.

`resolve` prints the JSON array returned by `resolveTaxAtDate`. `base_formula` and `value` are copied as published. The command does not evaluate the formula.

`--version` reads `version` from this package's `package.json`.

## Library

```ts
import { validatePack, resolveTaxAtDate, diffPolicyChanges, getSchemas } from "open-tax";
```

- `validatePack(regime)` checks JSON Schema draft 2020-12 and pack integrity (citations, successor links, non-overlapping dates).
- `resolveTaxAtDate(regime, { date, treatmentId, semanticCode, taxId })` returns the versions in force on that inclusive date. It returns `base_formula` and any stated `value` as written. It does not evaluate the formula.
- `diffPolicyChanges(diffs, filter)` filters maintainer-authored policy diffs. `diffPolicyChanges(before, after)` reports structural edits between two regimes and does not invent a legal citation.
- `getSchemas()` returns the regime, policy-diff, and dictionary schemas. After `npm run build`, the same files are importable as `open-tax/schemas/regime.schema.json` and its siblings.

Build with `npm run build` from this package or from the repository root. The `open-tax` bin is `dist/cli.js` and starts with `#!/usr/bin/env node`.

A dataset pull request does not publish this package. A tag `vX.Y.Z` matching `version` in `package.json` runs the repository release workflow, which publishes to npm when `NPM_TOKEN` is configured.

Pack authoring, country maintainer steps, and the Indonesia starter live in the repository, not in this README.
