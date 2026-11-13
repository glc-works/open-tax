# Indonesia (`id`)

Starter pack for PPN and the core PPh withholding categories. It is a software reference. It is not a filing position and not a complete Indonesian tax engine.

Reviewed against the cited DJP and Ministry of Finance pages on 2026-11-13.

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
| PPh 21 TER harian | `withholding` | Non-monthly non-permanent employees. 0% up to Rp450,000; 0.5% above that up to Rp2,500,000. Nothing above that band. |
| PPh 21 Pasal 17 | `withholding` | Layer schedule from the DJP UU HPP comparison, from tax year 2022. Last-period withholding for permanent employees and pensioners. |
| PPh 22 | `withholding` | Category and KAP only. No percentage. |
| PPh 23 | `withholding` | Headline 15% and 2% as stated by DJP. Exemptions, the no-TIN uplift, and the service list are not fully encoded. |
| PPh 4 ayat (2) | `final` | General category plus a separately scoped UMKM 0.5% treatment and sample billing codes. |
| PPh Badan and Pasal 31E | `standard` / `reduced` | HPP 22% on taxable income; conditional 50% rate reduction on the eligible Article 31E taxable-income portion. |
| PPh 26 | `withholding` | Statutory 20% when no treaty applies. Treaty rates are not encoded. |

## What is not encoded

- PPnBM percentages
- PPN DPP/besaran tertentu schedules under PMK 11/2025
- PPh 22 percentages
- PPh 4 ayat (2) percentages outside UMKM
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
rate; other final-tax schedules remain absent.
