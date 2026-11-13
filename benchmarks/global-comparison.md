# Global comparison

How a country maintainer maps local rules onto Open-Tax, and how this repository relates to the systems it learned from.

This file is architectural. It is not a rate table and not legal advice. Put a number in a pack only with `effective_from` and a citation. If this note and a pack disagree, the pack's citation wins until someone opens a correction.

## Cross-jurisdiction architecture and coverage matrix

Reviewed 14 November 2026. This matrix separates legal architecture from pack
coverage in this branch. A key listed as a mapping candidate is not a verified
rate or an encoded treatment. “Not verified” and “not encoded” never mean zero.
Pending packs in [PR #3](https://github.com/glc-works/open-tax/pull/3) are not
counted as delivered coverage. Dates and eligibility still come from each rule.

| Jurisdiction | Indirect tax system / primary source | Semantic mapping | Withholding / final | Commodity and filing dictionaries | Pack status in this branch |
| --- | --- | --- | --- | --- | --- |
| ID | PPN plus separate PPnBM; [UU PPN / HPP][id-vat] | General PPN → `standard`; export → `zero`; dibebaskan → `exempt`; tidak dipungut → `not_collected`; Pasal 4A → `out_of_scope`; recipient-accounted offshore use → `reverse_charge`. Article 31E corporate relief → `reduced` on the eligible taxable-income portion; no reduced PPN band encoded. | PPh 21/23/26 and non-final PPh 22 → `withholding`; final PPh 22 fuel/gas to agents and PPh 4(2) → `final`. Scope and omissions in [pack README](../packs/id/README.md). | KAP/KJS sample; KBLI empty; BTKI note. Codes do not determine rates. | Starter present; complete monthly TER A/B/C and general corporate/31E rules added. UMKM final 0.5% scope history is present; PMK 51 PPh 22 classes are present; selected other final-tax and PMK 11/53 PPN classes plus PP 61 non-vehicle and 14 selected PMK 42 vehicle PPnBM classes are present; detailed HS/program coverage remains partial. |
| SG | Credit-invoice GST; [IRAS supply types][sg-types] | Standard-rated → `standard`; zero-rated → `zero`; exempt → `exempt`; out-of-scope → `out_of_scope`; applicable recipient accounting → `reverse_charge` [IRAS][sg-import]. No `reduced` or `not_collected` mapping asserted here. | Specified non-resident payments → `withholding` [IRAS][sg-wht]. Finality is payment-specific; not inferred from withholding. | IRAS GST return boxes are a filing dictionary, not percentages [IRAS][sg-return]. | No local pack yet; SG pack remains with PR #3 ownership; integrate it after that PR lands. This table is reference comparison, not resolver coverage. |
| MY | Separate sales and service taxes, not one VAT; [Royal Malaysian Customs][my-sst] | Map prescribed taxable goods/services to separate tax IDs. `standard`, `reduced`, `exempt`, `out_of_scope`, `zero`, `not_collected`, and `reverse_charge` need rule-by-rule verification; this matrix asserts no complete mapping. | Section 109B services use withholding forms [LHDN][my-wht]; other withholding/finality not verified here. | Goods classification and SST filing belong to dictionaries; no local entries. | No local pack; proposed in PR #3. |
| IN | Central/state GST and integrated GST; [CBIC CGST Act][in-cgst], [IGST Act s.16][in-zero] | Ordinary/notified lower bands → candidate `standard`/`reduced`; notified exemptions → `exempt`; eligible exports and SEZ authorised operations → `zero`; CGST s.9(3) recipient liability → `reverse_charge`. `out_of_scope`/`not_collected` not verified here. | Income-tax withholding/final rules not verified in this matrix. | HSN/SAC classify supplies; a notification supplies the tax consequence. | No local pack; proposed in PR #3. No notification-level rate assertions here. |
| CN | VAT under the law effective 2026; [STA law text][cn-vat] | Article 10 ordinary/lower bands → candidate `standard`/`reduced`, specified exports → `zero`; statutory exemptions → `exempt`. Other keys need separate scope verification. | Income-tax withholding/finality not verified here. VAT tax collection must not be confused with income withholding. | Invoice tax classification codes are a dictionary layer, not a rate history. | No local pack; proposed in PR #3. |
| EU | Common VAT Directive framework, implemented nationally; [Commission rates overview][eu-vat] | Framework supports `standard`/`reduced`; remaining mappings require the relevant Directive provision and member-state law. Do not infer one EU-wide rate or one exemption list from this row. | No EU-wide withholding/final treatment asserted. | [TARIC][eu-taric] carries customs measures; it does not select a national VAT rate. | No `eu` or member-state pack. EU is a framework comparison, not a national rate jurisdiction. |
| BR | Multiple consumption taxes transitioning toward CBS/IBS, with a separate selective tax; [Receita Federal reform overview][br-rtc] | Map each tax and transition separately. `standard`, `reduced`, `zero`, `exempt`, `not_collected`, `out_of_scope`, and `reverse_charge` not verified here; no blended national VAT mapping. | Withholding/final rules not verified here. | NCM and tax-specific situation codes belong to dictionaries; no local entries. | No local pack. Reform transition is context, not encoded rates. |

## Same-item / same-transaction comparison matrix

These are conditional classification examples, not automatic results of
`resolveTaxAtDate`. That function filters authored treatments by date and ID;
it does not infer place of supply, residency, treaty eligibility, customer
status, or zone authorisation. Compare the same facts first, then classify each
tax separately. A service can have both a VAT treatment and income withholding.
Rules below describe the cited instruments; they do not certify every later
amendment or establish commencement dates for missing packs.

| Real-world scenario and required facts | Indonesia | Singapore | Other verified comparison / coverage limit |
| --- | --- | --- | --- |
| Domestic B2B ordinary SaaS/consultancy; registered supplier, domestic taxable supply, no exemption | PPN `standard`, `ppn-standard`; ordinary JKP under Pasal 4(1)(c) [UU PPN][id-vat]. A software licence must be classified separately if its legal character differs. | GST `standard` under the domestic supply rule [IRAS][sg-types]. B2B status alone creates no exemption. | Other jurisdictions: not verified at this scenario level. SG is reference-only until its pack lands. |
| Exported goods with export evidence; distinguish services from goods | PPN `zero`, `ppn-export`, Pasal 7(2) [UU PPN][id-vat]. Export services require their own statutory conditions; an overseas customer alone is insufficient. | GST `zero` for exports meeting the documentary requirements [IRAS][sg-types]. International services need their own qualifying conditions. | IN: eligible exports and supplies to SEZ developers/units for authorised operations are zero-rated under [IGST s.16][in-zero]. No IN resolver coverage in this branch. |
| Listed exempt domestic financial service; exclude a separately taxable advisory fee | PPN `exempt` only where the listed facility applies; [PP 49/2022][id-finance], Pasal 10 and financial-services provisions. Existing `ppn-dibebaskan` is a facility category, not a full product list. | GST `exempt` for listed financial services [IRAS][sg-exempt]. Input credit is conditional: De Minimis and Regulation 33 exceptions require [separate review][sg-input]. | “Financial service” alone is too broad to classify; other jurisdictions not verified. |
| Goods entering or sold within an authorised bonded/FTZ facility; distinguish domestic entry from overseas-goods sale | Qualifying domestic entry to Kawasan Berikat → PPN `not_collected`, subject to goods, production and documentation conditions [PMK 65/2021][id-bonded]. This does not cover all purchases by a business located in the zone. | A sale of overseas goods within an FTZ/Zero GST Warehouse can be `out_of_scope` [IRAS][sg-outside]. Import GST on stored goods is **suspended**, not an exemption or a general `not_collected` mapping [Customs][sg-ftz]. | Similar zone labels do not imply the same taxable event or semantic key. Removal for domestic consumption requires a fresh classification. No zone-specific pack treatment is added by this table. |
| Offshore B2B digital/service import; recipient is liable rather than an appointed overseas supplier | Recipient self-assessed PPN → `reverse_charge`, `ppn-inbound`, Pasal 4(1)(d)/(e) [UU PPN][id-vat]. Check whether a designated collector already collects PPN; do not charge twice. | `reverse_charge` for an in-scope RC business, including the input-credit/GST-group conditions [IRAS][sg-import]. Full input-credit entitlement can change applicability; “B2B import” alone is insufficient. | Vendor-collected GST/PPN must be distinguished from reverse charge. No universal import classification asserted. |
| Resident payer pays a non-resident company for qualifying technical services performed locally; no treaty relief assumed | PPh `withholding` only when the income and payee meet Pasal 26; existing `pph26` covers its specified gross-income category [DJP][id-pph26]. | `withholding` for service fees attributable to work performed in Singapore [IRAS][sg-wht]. Services performed wholly abroad require a different analysis. | Income withholding is separate from VAT/GST; neither tax key replaces the other. Treaty rates and permanent-establishment effects not compared here. |
| Resident business pays a resident provider for listed technical/management/consultancy services | PPh 23 `withholding`, `pph23-2`, subject to statutory exclusions and payer/payee qualifications [DJP][id-pph23]. | The cited [non-resident WHT regime][sg-wht] cannot classify a resident-payee transaction. Resident service withholding is not verified here; no key or zero rate inferred. | Identical commercial descriptions can produce different withholding obligations. Do not force `withholding` into every cell. |

## Ecosystem positioning matrix

This compares the projects' documented roles; it does not imply compatible
schemas, imported code, equivalent tax coverage, or permission to relicense
third-party material.

| Project / official reference | Primary object | History and calculation | Classification / filing layer | Relationship to Open-Tax |
| --- | --- | --- | --- | --- |
| Open-Tax ([README](../README.md)) | JSON jurisdiction packs, semantic treatments, citations and regulatory diffs | Effective intervals and successor links; resolver returns published values/formula text; no money calculation | Separate commodity, sector and authority-filing dictionaries | Deterministic reference-data SSOT for SDK/CLI consumers. Planned OKF export/search is not shipped coverage. |
| [GOBL](https://github.com/invopop/gobl) | Business documents with tax regimes and extensions | Validates/calculates business documents using its own models | Document/regime metadata and extensions, not Open-Tax dictionary files | Complementary document model; no automatic compatibility or addon generation asserted. |
| [OpenFisca](https://openfisca.org/doc/) | Tax-benefit systems, entities, variables and legislative parameters | Dated parameters plus executable formulas and simulations | Country-package concepts, not an Open-Tax filing-code dictionary contract | Complementary computation/simulation layer; Open-Tax does not evaluate its formula text. |
| [datasets/harmonized-system](https://github.com/datasets/harmonized-system) | HS classification data package | Classification data, not a tax calculation or effective-dated tax-rate resolver | HS commodity codes/descriptions, not jurisdiction filing codes | Potential correlation target; a code needs a separate cited tax consequence. Not vendored by Open-Tax. |

[id-vat]: https://pajak.go.id/sites/default/files/2021-12/SDSN%20UU%20PPN%20Indo-%20dengan%20tanda%20perubahan_UU%20HPP.pdf
[id-finance]: https://pajak.go.id/index.php/id/peraturan/pajak-pertambahan-nilai-dibebaskan-dan-pajak-pertambahan-nilai-atau-pajak-pertambahan
[id-bonded]: https://www.pajak.go.id/en/node/68121
[id-pph23]: https://www.pajak.go.id/id/pph-pasal-2326
[id-pph26]: https://www.pajak.go.id/id/pemotongan-pajak-penghasilan-pasal-26
[sg-types]: https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/basics-of-gst/goods-and-services-tax-%28gst%29-what-it-is-and-how-it-works
[sg-import]: https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/gst-and-digital-economy/local-businesses
[sg-wht]: https://www.iras.gov.sg/taxes/withholding-tax/payments-to-non-resident-company/payments-that-are-subject-to-withholding-tax
[sg-return]: https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/filing-gst/completing-gst-returns
[sg-exempt]: https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/charging-gst-%28output-tax%29/when-is-gst-not-charged/supplies-exempt-from-gst
[sg-input]: https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/claiming-gst-%28input-tax%29/claiming-input-tax-incurred-to-make-exempt-supplies
[sg-outside]: https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/charging-gst-%28output-tax%29/when-is-gst-not-charged/out-of-scope-supplies
[sg-ftz]: https://www.customs.gov.sg/doing-business/import-operations/import-procedures/depositing-goods-in-free-trade-zones/
[my-sst]: https://mysst.customs.gov.my/background/
[my-wht]: https://www.hasil.gov.my/media/fuaddktd/cp37ds_pin-1_2025.pdf
[in-cgst]: https://cbic-gst.gov.in/pdf/CGST-Act-Updated-01082021.pdf
[in-zero]: https://taxinformation.cbic.gov.in/content-page/explore-act/1000624/1000001/section%2016/ACTS
[cn-vat]: https://shanghai.chinatax.gov.cn/zcfw/zcfgk/zzs/202412/t474694.html
[eu-vat]: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/vat-rates_en
[eu-taric]: https://taxation-customs.ec.europa.eu/online-services/online-services-and-databases-customs/eu-customs-tariff-taric_en
[br-rtc]: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda

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
- `luxury` is a special higher path of the same tax. Use it when the luxury rule changes the rate or the base, as PMK 131/2024 does for PPnBM goods. Do not use it as a drawer for a different tax. Indonesian PPnBM uses its own `ppnbm` tax ID.

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
- PPh 21, non-final PPh 22, PPh 23 and PPh 26 use `withholding`. PPh 21's monthly TER is interim. Final PPh 22 fuel/gas to distributors/agents and PPh 4 ayat (2) use `final`.

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
