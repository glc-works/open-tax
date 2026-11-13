# Benchmarks

These notes are how a maintainer maps a local system onto Open-Tax. They are not a rate database. Numbers that belong in a pack live in `packs/<iso>/regime.json` with a citation. Numbers mentioned here are orientation, and the pack is the place to version them.

## Universal keys

Every treatment picks one key. The `rule` on `semantic_mappings` says when.

| Key | Use it when |
| --- | --- |
| `standard` | The generally applicable positive rate for that tax. Indonesia's 12% × 11/12 DPP Nilai Lain is still `standard`, because it is the ordinary charge, not a reduced schedule. |
| `reduced` | A statutory lower positive rate for a defined class of supplies. |
| `super_reduced` | A further statutory band below `reduced`, where the jurisdiction actually has one (some EU member states). |
| `zero` | A taxable supply taxed at 0%, distinct from an exemption, usually with input credit kept. Indonesia's export rate is this key. |
| `exempt` | The law relieves the supply. Indonesia: PPN dibebaskan. Input credit usually does not survive. Do not use this for a 0% rate. |
| `out_of_scope` | The supply is not an object of the tax. Indonesia: Pasal 4A. |
| `not_collected` | The tax is still due, but collection is waived. Indonesia: PPN tidak dipungut. |
| `reverse_charge` | The customer accounts for the tax. |
| `withholding` | The payer withholds. Mark `collection.interim` when the amount is reconciled later, as with Indonesia's monthly TER. |
| `final` | A withholding that is itself the final tax. Indonesia: PPh Pasal 4 ayat (2). |
| `luxury` | A distinct higher or special luxury treatment of the same tax. Indonesia uses this for the PMK 131/2024 full 12% base on PPnBM goods, not for the PPnBM schedule. |

If two treatments share a key, callers must pass `treatmentId` or read `localCode` on the object returned by `resolveTaxAtDate`. The pack file still stores that value as `local_code`. The function returns every match. That is deliberate: January 2025 luxury PPN in Indonesia is two treatments.

## Read next

[global-comparison.md](global-comparison.md) walks Singapore IRAS, Indonesia, China, India, EU TARIC/VAT, Brazil, and Malaysia, then GOBL, OpenFisca, and the Harmonized System dataset.

When a country pack is added, add a short subsection there: the local categories, the semantic keys you chose, and the official manual you followed. Do not paste a rate table into the benchmark if the pack already versions it.
