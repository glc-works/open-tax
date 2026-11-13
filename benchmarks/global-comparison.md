# Global comparison

How a country maintainer maps local rules onto Open-Tax, and how this repository relates to the systems it learned from.

This file is architectural. It is not a rate table and not legal advice. Put a number in a pack only with `effective_from` and a citation. If this note and a pack disagree, the pack's citation wins until someone opens a correction.

## The mapping rule

A treatment has one semantic key. The local statute keeps its own name in `local_name`. The universal key is how software and agents line up two countries without pretending the laws are the same.

Choose the key from the legal character of the rule, not from the size of the percentage:

- The ordinary positive rate is `standard`, even when the statute reaches that charge through a formula. Indonesia's post-2024 PPN is the example: PMK 131/2024 sets a 12% statutory rate and, for non-luxury supplies, a DPP Nilai Lain of 11/12. The stated effective charge is 11%. That is still `standard`. Calling it `reduced` would hide the fact that it is the general rule.
- A second, lower statutory band for a defined class is `reduced`. A third, lower band is `super_reduced` only where that band exists.
- `zero` means the supply is inside the tax and the rate is 0%. Keep this off `exempt` when the law says input tax survives. Indonesia's Penjelasan Pasal 7 says exactly that for exports.
- `exempt` means the law relieves the supply. Indonesia's word is dibebaskan. Pasal 16B ayat (3) says input VAT on that supply is not creditable.
- `out_of_scope` means the supply was never an object. Indonesia's word is non-objek, Pasal 4A.
- `not_collected` means the tax is due and collection is waived. Indonesia's word is tidak dipungut. Pasal 16B ayat (2) says input VAT on that supply can still be credited. Mapping tidak dipungut to `exempt` is the mistake this key exists to prevent.
- `reverse_charge` means the customer accounts for the tax.
- `withholding` means the payer deducts it. If the deduction is an interim calculation, set `collection.interim` and `collection.reconciled_annually`. Indonesia's monthly TER is interim. The annual Pasal 17 layers are the reconciliation, and they are a separate treatment that is also `withholding`.
- `final` means the withholding is the tax. Do not also treat it as a credit against an assessed income tax unless the statute says so.
- `luxury` is a special higher path of the same tax. Use it when the luxury rule changes the rate or the base, as PMK 131/2024 does for PPnBM goods. Do not use it as a drawer for a different tax. Indonesian PPnBM stays a separate tax id when someone encodes it.

When one key has two treatments on the same day, return both and let `local_code` distinguish them. The Indonesia pack does this for luxury goods in January 2025: the general full base, and the final-consumer 11/12 transition.

## Singapore (IRAS GST)

IRAS publishes GST as four treatments: standard-rated, zero-rated, exempt, and out-of-scope. Those map directly:

| IRAS category | Open-Tax key |
| --- | --- |
| Standard-rated | `standard` |
| Zero-rated | `zero` |
| Exempt | `exempt` |
| Out-of-scope | `out_of_scope` |

A Singapore pack should version the standard rate with the GST Act and the IRAS rate page, including the published steps through 8% (1 January 2023) and 9% (1 January 2024). Those dates are the kind of history `effective_from` is for. Confirm them on [iras.gov.sg](https://www.iras.gov.sg) before marking a version verified. Customer accounting and reverse charge, where IRAS applies them, use `reverse_charge` rather than a new key.

GST filing codes, if a pack records them, go in a dictionary. They do not replace the semantic key.

## Indonesia (DJP)

The working sample is [`packs/id`](../packs/id/README.md). The distinctions that matter for the universal keys:

- Tarif umum, including the 2025 nilai lain formula, is `standard`.
- Ekspor at 0% is `zero`.
- Dibebaskan is `exempt`.
- Tidak dipungut is `not_collected`.
- Pasal 4A is `out_of_scope`.
- The recipient's PPN on offshore services and intangible goods is `reverse_charge`.
- The 12% full base on luxury goods that are also subject to PPnBM is `luxury`.
- PPh 21, 22, 23, and 26 are `withholding`. PPh 21's monthly TER is interim. PPh 4 ayat (2) is `final`.

KAP/KJS codes are dictionary entries. KBLI and BTKI are not rates; the Indonesia pack leaves KBLI empty and explains BTKI in a note so nobody backfills a heading from memory.

Sources for the encoded path include UU No. 7 Tahun 2021 (UU HPP), PMK 131/2024, and PP 58/2023. The pack README lists the URLs.

## China (税收分类编码)

The State Taxation Administration's tax classification codes for goods and services are the codes printed on VAT fapiao. They are a dictionary: a code identifies the supply so an invoice can carry the treatment the current VAT rule assigns to that class.

A China maintainer maps the treatment, not the code, onto semantic keys. A practical convention, to write into `semantic_mappings` and then version with STA announcements:

- the headline standard VAT band → `standard`
- the lower statutory bands (the widely published 9% and 6% bands after the 2018–2019 consolidation) → `reduced`, as separate treatments if the law treats them as different classes
- exports taxed at 0% with credit or refund → `zero`
- statutory exemption → `exempt`

Do not store the classification code as a rate. Do not collapse a later STA rate announcement into the code list. The code can outlive the percentage. Local incentives and refund pilots stay out until a citation names them. Confirm current bands on the STA or State Council text before a `verified` version; this paragraph is the convention, not the pack.

## India (HSN / SAC)

GST identifies goods with HSN codes and services with SAC codes. Rate notifications attach slabs to those codes. The code is the dictionary layer. The notification, with its effective date, is the rate version.

India's slab table moves. This benchmark does not freeze today's percentages. A maintainer copies the notification in force, sets `effective_from` from that notification, and maps:

- the slab the pack's own mapping rule calls the ordinary rate → `standard`
- lower positive slabs → `reduced` (one treatment per slab, so 5% and 12% do not share a version)
- a nil rate that is still a taxable supply with input credit → `zero`
- a nil rate that is an exemption → `exempt`
- supplies outside GST → `out_of_scope`
- supplies where the recipient pays → `reverse_charge`

HSN correlation to the WCO HS belongs in `correlates_to`, not in `value`.

## European Union (TARIC and VAT)

TARIC and the Combined Nomenclature classify goods for customs. They do not carry one EU-wide VAT rate. VAT is national, on top of a shared directive vocabulary.

Recommend country packs (`de`, `fr`, `it`, …) for rates. A note under `eu` can record shared vocabulary, not a blended percentage. Map each member state's law onto:

| Directive-style category | Open-Tax key |
| --- | --- |
| Standard rate | `standard` |
| Reduced rate | `reduced` |
| Super-reduced rate, where used | `super_reduced` |
| Zero rate | `zero` |
| Exemption | `exempt` |
| Reverse charge | `reverse_charge` |
| Outside the scope | `out_of_scope` |

A TARIC code may correlate to a commodity dictionary entry. The VAT treatment still comes from the member state's rate law on that date. Intrastat and customs duty are other taxes; give them their own tax ids if a pack encodes them.

## Brazil (Classif / NCM)

NCM is the Mercosur nomenclature, HS-derived. Brazilian indirect tax is several taxes on the same supply (ICMS, IPI, PIS, COFINS, and the reforms that succeed them). CST and related situation codes describe the situation of each tax.

A Brazil pack should:

- put NCM in a commodity dictionary, with an HS correlation
- give each tax its own tax id
- map that tax's situation onto semantic keys separately

Do not average ICMS and PIS into one `standard` rate. A situation code that means the operation is not taxed is `out_of_scope` or `exempt` according to the statute for that tax, and the mapping rule must say which. Withholding regimes (for example on services) use `withholding` or `final` per the law, not a VAT key.

## Malaysia (SST)

Sales and Service Tax is two taxes, not a credit-invoice VAT. A Malaysia pack should use two tax ids.

- Taxable goods under a sales-tax order → `standard`, or `reduced` where the order has a lower rate
- Taxable services under a service-tax order → `standard` on the service-tax id
- Goods and services not in those orders → `out_of_scope`
- Do not mark SST `input_credit` as `creditable` the way a VAT pack would. The mapping rule should say SST is not an input-credit invoice tax.

Service-tax percentages have changed by order (including the 2024 increase for many taxable services). Version them from the order. Do not copy a single national VAT-style rate into the pack.

## GOBL

[GOBL](https://github.com/invopop/gobl) (`invopop/gobl`) models invoices and supporting documents. Country behaviour arrives as regimes, tax categories, and extensions. That category normalisation is the idea Open-Tax borrows: a document, or an agent, should be able to say `standard` and also keep the local code.

Open-Tax is not an invoice schema and it does not import GOBL code. A regime here is a dated reference file. Policy diffs and `successor_of` links are first-class, because accounting systems need to know what changed on a Monday, not only how to print today's invoice. A later project could generate a GOBL addon from a pack. That generator is out of scope, and it would be a derivative that must keep both licenses' notices.

## OpenFisca

[OpenFisca](https://openfisca.org/) versions legislative parameters: a value, a start date, and a reference, then executable formulas in Python. Open-Tax takes the versioning idea and stops before the formula engine.

Each Open-Tax rate version has an effective interval and a citation. `successor_of` / `superseded_by` name both sides of a change so a diff can point at them. `base_formula` is text. `resolveTaxAtDate` returns that text. It does not run it. An agent that wants to calculate must use its own decimal library and must show the citation beside the result.

## datasets/harmonized-system

[datasets/harmonized-system](https://github.com/datasets/harmonized-system) distributes Harmonized System codes as open data. Open-Tax does not vendor those tables.

Dictionary entries may set `correlates_to.system` to `HS` and store the heading a maintainer has checked. BTKI, NCM, TARIC, and the goods side of China's classification all correlate to HS to different degrees. The correlation helps a pack say "this heading". It never supplies the tax rate. Duty, VAT, and excise stay in their own treatments, each with a legal citation.

## What a new maintainer writes first

1. A table like the Indonesia one: local word, semantic key, one sentence on why.
2. The ordinary rate, with the last two changes if they are recent, each cited.
3. The three-way split if the jurisdiction has one: zero rate, exemption, and out of scope. Add `not_collected` only when the statute distinguishes it.
4. Filing codes as a dictionary sample, marked as a sample, after reading the authority's own code list.
5. A policy diff for each dated change the pack actually encodes.

That is enough for a first pull request. A thin sketch of every tax in the country, with guessed percentages, is not.
