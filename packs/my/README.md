# Malaysia (`my`)

Starter pack for Sales Tax, Service Tax, corporate income tax, and selected non-resident withholding. It is a software reference. It is not a filing position and not a complete Malaysian tax engine.

The pack's primary authority is the Royal Malaysian Customs Department (RMCD), which administers SST. Corporate income tax and withholding are administered by the Inland Revenue Board of Malaysia (LHDN / IRBM) and are cited to LHDN sources.

Reviewed against the cited RMCD gazette orders, MySST pages, DCP 2/2025, and LHDN pages on 2026-11-13.

## What is encoded

| Local rule | Semantic key | What the numbers are |
| --- | --- | --- |
| Service tax, general rate: 6% (1 Sep 2018–29 Feb 2024), 8% (from 1 Mar 2024) | `standard` | 6% is `verified_starter` (MySST Background; parent order P.U.(A) 213/2018 was named but not opened). 8% is cited to P.U.(A) 64/2024 and restated by P.U.(A) 173/2025. |
| Service tax, First Schedule 6% from 1 Mar 2024 (F&B, telecoms, parking, logistics), widened on 1 Jul 2025 | `reduced` | Cited to P.U.(A) 64/2024 and P.U.(A) 173/2025. |
| Service tax on credit and charge cards, RM25 per card per year from 1 Jul 2025 | `standard` (`my-service-tax-credit-card`) | Specific charge under P.U.(A) 173/2025 Second Schedule, not a reduced ad valorem band. |
| Service tax on rental or leasing: 8% (1 Jul 2025–31 Dec 2025), then 8% statutory / 6% effective from 1 Jan 2026 | `standard` (`my-service-tax-rental-leasing`) | The 2026 step is an administrative 2% exemption under DCP 2/2025 (Amendment No. 4). It stays `standard`. |
| Sales tax 10% (general) and 5% (First Schedule), from 1 Jul 2025 | `standard` / `reduced` | Cited to P.U.(A) 170/2025 only. |
| Corporate income tax 24% from YA 2016 | `standard` | ITA 1967 Sch 1 para 2(1) and the LHDN company-rate page. |
| MSME tiers 15% / 17% / 24% from YA 2023 | `reduced` | Sch 1 paras 2A–2C, LHDN YA 2023–2024 table. |
| WHT: s 109 interest 15% and royalty 10%; s 109B (s 4A) 10%; s 109A entertainer 15%; s 109F (s 4(f)) 10% | `withholding` | LHDN WHT page, `in_force_by` the review date. |

Sales tax and service tax are two tax ids. `input_credit` is `not_creditable` on SST treatments: SST is not a credit-invoice VAT.

## What is not encoded

- The 5% and 10% sales-tax bands from the 1 September 2018 SST restart. MySST materials describe those bands, but the 2018 Rate Order text and P.U. number were not opened. This pack starts the sales-tax versions on 1 July 2025 with P.U.(A) 170/2025.
- Sales-tax exemptions under s 35 / P.U.(A) 199/2025 (named alongside 170/2025, not opened) and any specific (Second Schedule) sales-tax rates.
- Services that are not prescribed as taxable services (out of scope). The category is described in the research as structure only; it is not encoded as a treatment.
- A credit-card RM25 charge before 1 July 2025, if one existed under the 2018 order (not opened).
- ITA 1967 s 107A withholding on contract payments to non-residents (not in the verified LHDN table used for this pack).
- Treaty (DTA) withholding rates.
- Pre-YA 2023 MSME tier history recorded on the LHDN page (for example 17% on the first RM600,000 in YA 2020–2022). Those earlier schedules are not encoded as prior versions.
- The exact Year of Assessment from which Sch 1 para 2B(d) (the 20% foreign-ownership exclusion) applies — not pinned; check Finance Act 2023.
- Imported taxable services from 1 January 2019 as a separate treatment (mentioned on MySST Background only).

If a field is missing, the pack is silent. Do not infer zero.

## Sources used for the numbers

- [MySST | Background](https://mysst.customs.gov.my/background/)
- [P.U.(A) 64/2024 — Service Tax (Rate of Tax) (Amendment) Order 2024](https://mysst.customs.gov.my/wp-content/uploads/2025/03/PERINTAH-CUKAI-PERKHIDMATAN-KADAR-CUKAI-PINDAAN-2024.pdf)
- [P.U.(A) 173/2025 — Service Tax (Rate of Tax) (Amendment) Order 2025](https://mysst.customs.gov.my/wp-content/uploads/2025/11/Perintah-CP-Kadar-CukaiPindaan-2025.pdf)
- [P.U.(A) 170/2025 — Sales Tax (Rate of Sales Tax) Order 2025](https://mysst.customs.gov.my/wp-content/uploads/2025/07/1-PUA-170_2025.pdf)
- [Dasar Cukai Perkhidmatan Bil. 2/2025 (Pindaan No. 4) — Sewaan atau Pajakan](https://mysst.customs.gov.my/wp-content/uploads/2026/04/DCP-2-2025-Sewaan-atau-Pajakan-Pindaan-No.4.pdf)
- [Income Tax Act 1967 (LHDN online version as at 1 January 2026)](https://www.hasil.gov.my/wp-content/uploads/Income-Tax-Act-1967-online-version-as-at-1-January-2026.pdf)
- [LHDN | Tax Rate of Company](https://www.hasil.gov.my/en/syarikat/kadar-cukai-syarikat/)
- [LHDN | Withholding Tax](https://www.hasil.gov.my/en/perundangan/cukai-pegangan/)

## History

Diffs in `diffs/` record the 1 March 2024 general service-tax increase and retained 6% band, the 1 July 2025 SST orders (First Schedule expansion, RM25 card charge, and the opened sales-tax rate order), and the 1 January 2026 administrative reduction for rental or leasing. Old rate versions stay in `regime.json` and point at their successor.
