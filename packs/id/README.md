# Indonesia (`id`)

Starter pack for PPN and the core PPh withholding categories. It is a software reference. It is not a filing position and not a complete Indonesian tax engine.

Reviewed against the cited DJP and Ministry of Finance instruments on 2026-11-14. Coverage remains partial as itemised below.

## What is encoded

| Local rule | Semantic key | What the numbers are |
| --- | --- | --- |
| PPN 10% through 2022-03-31, 11% from 2022-04-01, then 12% × DPP Nilai Lain 11/12 from 2025-01-01 | `standard` | Cited rates. The 11/12 path is not `reduced`. |
| Ekspor, tarif 0% | `zero` | Input VAT stays creditable. Not `exempt`. |
| PPN dibebaskan | `exempt` | Category only. Input VAT is not creditable (Pasal 16B ayat (3)). The goods list is in the granting PP. |
| PPN tidak dipungut | `not_collected` | Category only. The tax is still due. Input VAT can be credited (Pasal 16B ayat (2)). |
| Pasal 4A | `out_of_scope` | The groups in the UU HPP text of Pasal 4A. Later amendments are not certified. |
| Pemanfaatan BKP tidak berwujud / JKP dari luar Daerah Pabean | `reverse_charge` | Same rate path as standard. The recipient accounts for it. |
| BKP mewah yang dikenai PPnBM, from 2025-01-01 | `luxury` | 12% on the full base. Final consumers use 11/12 only during January 2025. |
| PPh 21 TER bulanan, pegawai tetap and pensioner, except the last period | `withholding` | Categories A/B/C and the effective date. Complete A/B/C percentage tables; one rate applies to the whole monthly gross amount. |
| PPh 21 TER bulanan, monthly-paid pegawai tidak tetap, including December | `withholding` | Same A/B/C tables. Not the daily bands and not the December Pasal 17 switch. |
| PPh 21 TER harian | `withholding` | Non-monthly non-permanent employees. 0% up to Rp450,000; 0.5% above that up to Rp2,500,000. Above that band, a separate PMK 168 treatment applies Pasal 17 to 50% of gross. |
| PPh 21 Pasal 17 | `withholding` | Layer schedule from the DJP UU HPP comparison, from tax year 2022. Last-period withholding for permanent employees and pensioners. |
| PPh 22 | `withholding` / `final` | 28 PMK 51/2025 base-rate classes, including separate fuel/gas finality. |
| PPh 23 | `withholding` | Ordinary 15%/2% plus separately scoped no-NPWP snapshots and exclusion notes; detailed service-list eligibility remains external. |
| PPh 4 ayat (2) | `final` | Separately scoped UMKM, property, construction and resident-bond classes; no universal final-tax percentage. |
| PPh Badan and Pasal 31E | `standard` / `reduced` | HPP 22% on taxable income; conditional 50% rate reduction on the eligible Article 31E taxable-income portion. |
| PPN special bases/amounts, PMK 11/53 | `standard` | 43 separately scoped formulas; gold/crypto omitted pending successor review. |
| PPnBM | `luxury` on tax ID `ppnbm` | Seven PP 61 non-vehicle groups plus 14 selected ordinary vehicle classes. Classification remains conditional. |
| PPh 26 | `withholding` | General statutory 20% plus separately scoped non-resident bond interest; treaty rates and other bases remain external. |

## What is not encoded

- PPnBM bus/double-cab/low-carbon program schedules, ministerial goods/HS classification and housing thresholds
- Gold and crypto PMK 11 histories pending complete PMK 52/53 and successor-regime verification
- Earlier PPh 22 numerical history, full HS annex membership and special Article 22 regimes outside PMK 51/2025
- Other final-tax families outside the explicitly encoded UMKM, rent, land-transfer, construction and resident-bond snapshots
- Tax-treaty withholding tables
- A KBLI-to-tax map (the dictionary is an empty, labeled structure)
- BTKI or HS lines

If a field is missing, the pack is silent. Do not infer zero.

## Sources used for the numbers

- [UU PPN consolidation with UU HPP marks](https://pajak.go.id/sites/default/files/2021-12/SDSN%20UU%20PPN%20Indo-%20dengan%20tanda%20perubahan_UU%20HPP.pdf) (DJP PDF)
- [PMK 131/2024 PDF](https://jdih.kemenkeu.go.id/api/download/f128868e-3cf6-4596-8407-c34eeca0e7be/2024pmkeuangan131.pdf)
- [DJP on PMK 131/2024](https://www.pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas)
- [DJP on the 10% to 11% change](https://www.pajak.go.id/id/artikel/penyesuaian-tarif-ppn-tidak-bikin-masyarakat-susah-ini-penjelasannya)
- [DJP press release on UU HPP, including Pasal 17 layers](https://www.pajak.go.id/id/siaran-pers/presiden-ri-sahkan-uu-harmonisasi-peraturan-perpajakan)
- [PP 58/2023 on the DJP regulations page](https://www.pajak.go.id/id/peraturan/tarif-pemotongan-pajak-penghasiian-pasal-21-atas-penghasilan-sehubungan-dengan-pekerjaan)
- [PMK 168/2023 explainer PDF](https://pajak.go.id/sites/default/files/2024-02/PMK%20168%20Tahun%202023%20Tentang%20PPh%20Pasal%2021%20TER.pdf)
- [DJP on TER](https://www.pajak.go.id/id/artikel/yuk-taaruf-dengan-ter)
- [DJP PPh Pasal 23/26](https://www.pajak.go.id/id/pph-pasal-2326) and [Pasal 26](https://www.pajak.go.id/id/pemotongan-pajak-penghasilan-pasal-26)
- [DJP KAP/KJS list](https://www.pajak.go.id/id/kode-jenis-pajak-dan-kode-jenis-setoran)

## History

Diffs in `diffs/` record the 2022 Pasal 17 layers, the 1 April 2022 move to 11%, the 1 January 2024 TER, and PMK 131/2024. Old rate versions stay in `regime.json` and point at their successor.

## Monthly TER schedules

`pph21-ter-monthly` and `pph21-ter-monthly-tidak-tetap` retain the employment
scope rules. Select `pph21-ter-monthly-a`, `pph21-ter-monthly-b`, or
`pph21-ter-monthly-c` using PTKP status. The [official PP 58/2023 annex](https://www.pajak.go.id/sites/default/files/lampiran/Lampiran%20PP58TAHUN2023.pdf)
contains 44, 40, and 41 bands respectively, effective 1 January 2024.
`over` is exclusive and `up_to` inclusive. Apply the selected percentage to
the entire monthly gross income; these are not progressive marginal layers.
Permanent employees and pensioners switch to Pasal 17 in their last tax period.
Monthly-paid non-permanent employees continue monthly TER through December.
The library returns the schedule and does not select a gross-income band or
calculate tax.

## Corporate income tax

`corporate-standard` records the UU HPP general rate of 22% from tax year 2022
on taxable income. `corporate-31e` records a 50% reduction of that rate only on
the qualifying taxable-income portion for domestic corporate taxpayers whose
annual turnover does not exceed IDR 50 billion. The qualifying turnover portion
is capped at IDR 4.8 billion. The stated 11% is not a tax on turnover and does
not apply to all profits when turnover exceeds the qualifying portion.
See [UU HPP](https://pajak.go.id/id/peraturan/harmonisasi-peraturan-perpajakan)
and [DJP's Article 31E explanation](https://www.pajak.go.id/index.php/en/node/94054).
Earlier corporate regimes, listed-company relief, global minimum tax and other
special regimes are not reconstructed. The date-only resolver returns candidate
treatments; the caller must determine eligibility and the taxable-income allocation.

## UMKM final turnover tax

`pph4-2-umkm` encodes the 0.5% final rate under
[PP 55/2022](https://pajak.go.id/id/peraturan/penyesuaian-pengaturan-di-bidang-pajak-penghasilan)
from 20 December 2022, followed by a linked scope version from 22 April 2026
under [PP 20/2026](https://pajak.go.id/id/peraturan/perubahan-atas-peraturan-pemerintah-nomor-55-tahun-2022-tentang-penyesuaian-pengaturan-di).
The original version ends inclusively on 21 April 2026. The rate is unchanged.
The turnover eligibility limit is IDR 4.8 billion. The annual cumulative
IDR 500 million excluded turnover portion applies to individuals only.
Article 61 retains the final regime through the tax year of an in-year ceiling
crossing; it does not impose an immediate switch on the crossing transaction.

The new ordinary entry scope covers individuals, single-person companies and
cooperatives, with additional exclusions, turnover aggregation and cooperative
time limits. Existing CV/firms, other PT and BUM Desa may retain eligibility
under Article II grandfathering. That article also provides specific relief
for tax years 2025/2026 and cooperatives. The resolver models instrument
commencement, not retrospective eligibility or an as-known-at legal state.
The notes and citations must accompany the rate; a date and turnover amount
alone cannot establish eligibility. PP 23/2018 history is not reconstructed.

The KAP/KJS sample adds 411128-420 for self-payment and 411128-423 for
withholding/collection, verified against the
[Ministry of Finance billing explanation](https://mediakeuangan.kemenkeu.go.id/article/show/kewajiban-bendahara-memotong-pph-final-umkm).
These codes identify payment types, not tax eligibility, commencement dates or
current filing deadlines. The generic PPh 4(2) category still has no universal
rate; each encoded final-tax family has a separate scoped treatment.

## PPh 22 collection classes

[PMK 51/2025](https://www.pajak.go.id/index.php/id/peraturan/pemungutan-pajak-penghasilan-pasal-22-sehubungan-dengan-pembayaran-atas-penyerahan-1)
Pasal 15 starts the encoded classes on 1 August 2025. There are 28 scoped
treatments: seven import/auction classes, mining exports, government and
specified-body purchases, five producer/distributor industries, motor-vehicle
agents, raw materials, mining purchases, bullion purchases, eight fuel/gas
final/non-final variants, and lubricants. Import value includes the cited CIF,
duty and other customs levies; auction price is a different base.

Apply the Article 4 exceptions before choosing a rate. Government and
specified-body/bullion purchase limits require that payments are not split
from a larger transaction. The raw-material IDR 20 million exception is a
tax-period aggregate. Annex goods/HS membership must be checked against the
original annex; no unverified tariff lines are vendored. Fuel/gas collection
is final only for distributors/agents; lubricants remain non-final. These
are ordinary taxpayer-identification base rates; no-NPWP uplifts and special
Article 22 regimes outside PMK 51/2025 remain unencoded.

## Other final income tax and withholding scope

The pack adds land/building rent under PP 34/2017 (2 January 2018), three
land-transfer classes under PP 34/2016 (7 September 2016), seven construction
classes under PP 9/2022 (21 February 2022), and resident/BUT bond interest
under PP 91/2021 (30 August 2021). Each treatment and policy diff cites its
statute. Collection can be withholding or self-payment. Rental includes the
related gross charges but excludes accommodation. Land-transfer exceptions
and simple-housing/public-interest qualifications must be checked first.
Construction follows payment dates even for earlier contracts; the three-year
evaluation clause is not an automatic expiry. Prior numeric histories, PPJB
special computation, and other final-tax families remain absent.

PPh 23 has separate no-NPWP 100%-higher snapshots and scope notes for bank,
lease-option, dividend, profit-share, cooperative and specified financial
service exclusions. These snapshots are verified in force on 14 November
2026; that date does not assert the law first commenced then. The ordinary
headline treatments assume the ordinary NPWP case; no exemption is inferred
from missing rates. Full service-list/detailed documentary qualification is
not encoded.

PPh 26 separately records the PP 9/2021 non-resident bond-interest rate from
2 August 2021, after the regulation's six-month delay, with its bond-specific
base. It is distinct from PP 91/2021 resident/BUT final bond tax and the
general Article 26(1) gross-income class. Treaty eligibility, Article 26(2)
estimated-net-income coefficients and branch-profit computations remain
unencoded; do not apply the gross-income percentage to those other bases.

## Specific PPN bases and non-vehicle PPnBM

22 scoped PMK 11/2025 treatments preserve nine expressly stated special DPP
paths, specified agricultural/used-vehicle regimes, selected PMK 71 services,
insurance commissions, self-building, tobacco and LPG margins. Article 22
applies the calculations to collections since 1 January 2025; promulgation
was 4 February 2025. PMK 53/2025 restates insurance/self-building from
1 August 2025; those treatments have linked versions with an inclusive
31 July end date. Crypto rates are absent, including the removed provisions.
All formulas remain text; a missing decimal value is not zero. Special input
credit rules and supplier/invoice/classification conditions remain external.

PP 61/2020 contributes seven **non-vehicle PPnBM** groups from 15 December
2020, after its 60-day delay. PPnBM has its own tax ID and is separate from
the PPN luxury base. Its housing/HS ministerial classification and bus/double-cab/low-carbon
program schedules remain unencoded. Selected ordinary vehicle classes are below. The tourism-yacht exception has a four-year
recapture condition; no unverified zero-rate exemption is asserted.

Sources: [PMK 11](https://www.pajak.go.id/index.php/id/peraturan/ketentuan-nilai-lain-sebagai-dasar-pengenaan-pajak-dan-besaran-tertentu-pajak-pertambahan),
[PMK 53](https://jdih.kemenkeu.go.id/download/f5252d58-c4a6-45c3-87b7-cb3b6c3abbf9/2025pmkeuangan053.pdf),
[PP 61](https://www.pajak.go.id/id/peraturan/barang-kena-pajak-yang-tergolong-mewah-selain-kendaraan-bermotor-yang-dikenai-pajak).

## PMK 168 recipient classes and final-period reconciliation

Seven scoped treatments add the Article 17 bases for non-monthly non-permanent
employees above the daily IDR 2.5 million cutoff, Bukan Pegawai, event
participants, employed pension-program withdrawals, and irregular former-employee
payments; irregular commissioners instead use the monthly TER grid. The
Bukan Pegawai path is for resident individuals, not a company service invoice.
Its 50% base and documentary exclusions differ from participant/former-employee
whole-gross bases; catering does not receive the other-service cost exclusions.

`pph21-last-period` expresses annual/part-year Article 17 liability less earlier
withholding, using net income minus eligible PTKP, rounded down to IDR thousands.
It records separate capped job/pension costs and the subjective-liability
annualisation condition. It is not a tax on December gross and does not apply
to monthly-paid non-permanent employees. The library does not execute formulas.
All begin on 1 January 2024 under [PMK 168](https://pajak.go.id/id/peraturan/petunjuk-pelaksanaan-pemotongan-pajak-atas-penghasilan-sehubungan-dengan-pekerjaan-jasa-1).

## Additional PMK 11 base paths

21 further scoped treatments encode imported-film copy bases, telecom
distribution levels, token/voucher fees or margins, the no-fee/no-margin voucher
path, LPG retail DPP, both fertiliser price portions, member-to-KSO contributions,
creditor disposals of repossessed collateral and six KPBPB movement/classification
bases. DPP multipliers are distinguished from tax-due formulas; token face value
is not the service commission. The cinema-copy VAT is collected once per copy.

KPBPB location does not itself mean `not_collected`: origin, processing, temporary
movement deadlines, luxury status and any specific facility determine treatment.
The six base paths encode PPN only; PPnBM is determined separately. All are
subject to [PMK 11](https://www.pajak.go.id/index.php/id/peraturan/ketentuan-nilai-lain-sebagai-dasar-pengenaan-pajak-dan-besaran-tertentu-pajak-pertambahan)
Article 22's January 2025 application. Gold and crypto are deliberately absent:
PMK 52/53 and successor regimes need a complete transition review before those
numbers can be published. An omitted treatment is not zero or exempt.

## Selected PPnBM vehicle classes and verification gaps

[PMK 42/2022](https://jdih.kemenkeu.go.id/download/9d340161-7cda-41d6-aec2-b4fe66a2d66b/42~PMK.010~2022Per.pdf)
adds eight CO2-based passenger classes (two engine-capacity groups) and six
other vehicle classes from 1 April 2022, the amended-annex date. The passenger
entries are **CO2 branches only** for fewer than ten persons including the
driver; fuel-economy alternative tests remain in the instrument. Conditional
low-carbon program treatment must be checked first. Missing required test
evidence triggers the highest rate in the applicable vehicle/capacity group,
not a favourable assumed emissions class. Import and producer-supply bases differ.

Bus, double-cab, electric/hybrid program, investment-triggered changes and
government-borne incentives remain absent. The DJP HTML for PMK 141 contains
misplaced text and duplicate/OCR errors; the original official PDF and amended
annex are authoritative. Ambiguous table boundaries were not normalised from
memory. Verify the source PDFs and applicable program decisions before adding
those rows. The HS `Ex.` descriptions are not a universal vehicle-code map.

### Remaining work before the Indonesia delivery is ready

- Resolve the omitted vehicle/program schedules and ministerial non-vehicle
  classifications/thresholds against authoritative original documents.
- Review PMK 52/53 and successor gold/crypto transitions before encoding them.
- Expand the explicitly sampled KAP/KJS filing dictionary where source-verified;
  keep KBLI/BTKI omissions labelled rather than inventing code correlations.
- Review remaining final-tax families and Article 26 bases beyond the encoded
  snapshots. Treaty tables and unverified history stay absent.
- Refresh comparison-pack status only after PR #3 lands; its files retain their owner.

PR #5 remains draft while these coverage checks are outstanding.
