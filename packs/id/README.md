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
| PPh 21 TER bulanan, pegawai tetap and pensioner, except the last period | `withholding` | Categories A/B/C and the effective date. The monthly percentage grid is not copied. |
| PPh 21 TER bulanan, monthly-paid pegawai tidak tetap, including December | `withholding` | Same unpublished monthly grid. Not the daily bands and not the December Pasal 17 switch. |
| PPh 21 TER harian | `withholding` | Non-monthly non-permanent employees. 0% up to Rp450,000; 0.5% above that up to Rp2,500,000. Nothing above that band. |
| PPh 21 Pasal 17 | `withholding` | Layer schedule from the DJP UU HPP comparison, from tax year 2022. Last-period withholding for permanent employees and pensioners. |
| PPh 22 | `withholding` | Category and KAP only. No percentage. |
| PPh 23 | `withholding` | Headline 15% and 2% as stated by DJP. Exemptions, the no-TIN uplift, and the service list are not fully encoded. |
| PPh 4 ayat (2) | `final` | Category and three filing-code names. No percentage. |
| PPh 26 | `withholding` | Statutory 20% when no treaty applies. Treaty rates are not encoded. |

## What is not encoded

- PPnBM percentages
- The monthly TER rows in the annex to PP 58/2023
- PPh 22 percentages
- PPh 4 ayat (2) percentages
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
