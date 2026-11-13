# Singapore (`sg`)

Starter pack for GST, corporate income tax, and non-resident withholding. It is a software reference. It is not a filing position and not a complete Singapore tax engine.

Reviewed against the cited IRAS, AGC (Singapore Statutes Online), and MOF pages on 2026-11-13.

## What is encoded

| Local rule | Semantic key | What the numbers are |
| --- | --- | --- |
| Standard-rated GST: 3% (1 Apr 1994–31 Dec 2002), 4% (2003), 5% (1 Jan 2004–30 Jun 2007), 7% (1 Jul 2007–31 Dec 2022), 8% (2023), 9% (from 1 Jan 2024) | `standard` | Cited rates. The 3% step is `verified_starter` (IRAS historical table only; s 16 as printed starts at 4%). Later steps are cited to GST Act s 16 and the IRAS rate page. |
| Zero-rated GST (exports and international services, s 21) | `zero` | Rate 0 from GST commencement. Input tax stays creditable. |
| Exempt supplies (Fourth Schedule: financial services, residential property, investment precious metals; digital payment tokens from 1 Jan 2020) | `exempt` | Category only. Input tax is `see_citation`: blocked unless the De Minimis Rule or Regulation 33 applies. |
| Out-of-scope (third-country sales, TOGC, private transactions, supplies outside Singapore) | `out_of_scope` | Category only. Not a supply. |
| Reverse charge on imported B2B services (from 1 Jan 2020) and low-value goods (from 1 Jan 2023), for GST-registered persons not entitled to full input tax credit | `reverse_charge` | Tracks the prevailing standard rate: 7% then 8% then 9%. |
| Overseas Vendor Registration — B2C digital services (from 1 Jan 2020), then also B2C remote non-digital services and imported low-value goods (from 1 Jan 2023) | `standard` (`sg-gst-ovr`) | The overseas vendor collects the prevailing standard rate. This is not reverse charge. |
| Corporate income tax, flat 17% from YA 2010 | `standard` | Cited to the IRAS e-Tax Guide of 9 Sep 2024, para 4.2(i), and the current-rate pages. |
| Partial tax exemption (PTE), YA 2020+: 75% of the first S$10,000 and 50% of the next S$190,000 | `reduced` | Schedule of exemption fractions, not a second CIT percentage. |
| Start-up tax exemption (SUTE), YA 2020+, first 3 YAs: 75% of the first S$100,000 and 50% of the next S$100,000 | `reduced` | Same: exemption fractions, with the IRAS eligibility conditions in the notes. |
| S 45 withholding: interest 15%; royalties 10%; know-how 10%; movable-property rent 15%; technical assistance / management fees at the prevailing CIT rate (17%); non-resident director 22% through 31 Dec 2022, then 24% from 1 Jan 2023; professionals 15%; public entertainers 15%; NR property traders 15%; casino international market agents 3% | `withholding` | Rates as stated on the IRAS WHT page. Most figures use `effective_from_bound: in_force_by` on the review date because a legal start was not pinned. |

GST F5 boxes 1–17 are in `dictionaries/gst-f5-boxes.json`.

## What is not encoded

- Accounting-software tax codes (SR, ZR, ES33, TX and similar). These come from the IRAS ASR+ / IAF specification and were not verified.
- GST F5 boxes 18–21 (Import GST Deferment Scheme section), listed only as a note on the dictionary.
- Pre-YA 2020 PTE and SUTE exemption schedules (described on the IRAS page, but a legal start date for those earlier schedules was not pinned).
- Corporate tax rebates and other s 43 reliefs beyond PTE and SUTE.
- The S-REIT 10% withholding concession for distributions to non-resident non-individuals. The IRAS page indicated a Budget 2025 extension beyond 31 Dec 2025, but the fetched page was truncated and the concession end date was not confirmed. Do not treat 10% as an open-ended verified rate.
- Treaty (DTA) withholding rates.
- Individual income tax layers, other than the 22% / 24% highest marginal rates used to date director withholding.
- Customer accounting, MES, A3PL, and other approved GST schemes as separate treatments (Box 9 records MES/A3PL import values only).
- A full list of s 21(3) international services or Fourth Schedule lines.

If a field is missing, the pack is silent. Do not infer zero.

## Sources used for the numbers

- [Goods and Services Tax Act 1993, s 16](https://sso.agc.gov.sg/Act/GSTA1993?ProvIds=pr16-) (Attorney-General's Chambers, Singapore Statutes Online)
- [GST Act 1993](https://sso.agc.gov.sg/Act/GSTA1993) (ss 14, 21, 22 and Fourth Schedule)
- [IRAS | Current GST rates](https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/basics-of-gst/current-gst-rates)
- [IRAS | Completing GST Return](https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/filing-gst/completing-gst-returns)
- [IRAS | Local businesses importing services and importing or supplying low-value goods](https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/gst-and-digital-economy/local-businesses)
- [IRAS Extended Overseas Vendor Registration Regime slides](https://www.iras.gov.sg/media/docs/default-source/uploadedfiles/gst/extended-overseas-vendor-registration-regime-slides.pdf)
- [IRAS e-Tax Guide: GST General Guide for Businesses](https://www.iras.gov.sg/media/docs/default-source/e-tax/etaxguide_gst_gst-general-guide-for-businesses(1).pdf)
- [IRAS e-Tax Guide: Transfer of Business as a Going Concern](https://www.iras.gov.sg/media/docs/default-source/e-tax/etaxguide_gst_transfer-of-business-as-a-going-concern_2019-12-30.pdf)
- [IRAS e-Tax Guide: Incorporation of Companies by Medical Professionals and Relevant Tax Implications](https://www.iras.gov.sg/docs/default-source/e-tax/etaxguide-on-corporatisation-and-tax-implications.pdf) (para 4.2(i), published 9 Sep 2024)
- [IRAS | Corporate Income Tax Rates](https://www.iras.gov.sg/quick-links/tax-rates/corporate-income-tax-rates)
- [IRAS | Corporate Income Tax Rate, Rebates & Tax Exemption Schemes](https://www.iras.gov.sg/taxes/corporate-income-tax/basics-of-corporate-income-tax/corporate-income-tax-rate-rebates-and-tax-exemption-schemes)
- [MOF | Corporate Income Tax](https://www.mof.gov.sg/policies/taxes/corporate-income-tax/)
- [IRAS | Types of Payment & the Applicable Withholding Tax Rates](https://www.iras.gov.sg/taxes/withholding-tax/basics-of-withholding-tax/types-of-payment-and-withholding-tax-rates)

## History

Diffs in `diffs/` record the 1 January 2020 introduction of reverse charge and Overseas Vendor Registration, the 1 January 2023 move to 8% (and the low-value goods / remote non-digital extension), and the 1 January 2024 move to 9%. Earlier standard-rate steps (3%, 4%, 5%, 7%) stay in `regime.json` and point at their successor. Director withholding is versioned from 22% to 24% on 1 January 2023, the date IRAS uses for income due and payable. YA 2024 is the assessment year for that 2023 income, not the withholding start date.
