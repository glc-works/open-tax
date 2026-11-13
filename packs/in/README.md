# India (`in`)

Starter pack for Indian GST slabs, plus a sample of HSN and SAC codes drawn from the 56th GST Council annexures. It is a software reference. It is not a filing position and not a complete Indian tax engine.

The pack authority is the Central Board of Indirect Taxes and Customs (CBIC). Rate notifications are made on the recommendations of the GST Council.

Reviewed against official GST Council and Press Information Bureau releases on 2026-11-13. Official CBIC rate-notification PDFs (including 1/2017-CT(Rate), 9/2025-CT(Rate), 10/2025-CT(Rate), and 19/2025-CT(Rate)) timed out from the research box. Encoded GST versions that rest on those press releases are marked `verified_starter`. Open the notification PDFs before marking a rate `verified`.

## What is encoded

| Local rule | Semantic key | What the numbers are |
| --- | --- | --- |
| Standard GST 18%, from 1 July 2017 (still the standard rate after 22 September 2025) | `standard` | Combined GST. `verified_starter`. |
| Merit / reduced GST 5%, from 1 July 2017, widened on 22 September 2025 | `reduced` (`in-gst-reduced-5`) | Same 5% figure; the set of supplies in the slab changes on 22 September 2025. |
| Reduced GST 12%, 1 July 2017–21 September 2025, then retired | `reduced` (`in-gst-reduced-12`) | Historical only. `effective_to` is 21 September 2025. |
| De-merit / luxury: 28% (1 July 2017–21 September 2025), 40% (22 September 2025–31 January 2026 for goods that moved on 22 September; cigarettes, zarda, unmanufactured tobacco, and beedi kept their old rate, which is not encoded for that window), 40% (from 1 February 2026 for the notified tobacco and pan masala goods other than bidis and tobacco leaves) | `luxury` | `verified_starter`. Compensation cess is not encoded as a rate. |
| Nil-rated 0% slab, from 1 July 2017 | `zero` | Domestic nil slab, including UHT milk from 22 September 2025. Chargeability is exempt and input tax is not creditable. This is not IGST Act s 16 export or SEZ zero-rating. |
| Exemption category, 1 July 2017 then restated from 22 September 2025 | `exempt` | Category only. Notification lists were not opened. |

A sample of HSN and SAC headings from the 56th Council annexures is in `dictionaries/hsn-sac.sample.json`. Codes are not rates.

Rates are combined GST (CGST+SGST/UTGST, or IGST). CGST notifications state half rates.

## What is not encoded

- Special residual rates of 3%, 0.25% (rough diamonds), and 1.5%. They are mentioned in the 2017 structure and in a search summary of 9/2025-CT(Rate) schedules, but those notification texts were not opened.
- Export / SEZ zero-rated supplies under IGST Act s 16 (not opened).
- The goods and services lists in exemption Notifications 2/2017-CT(Rate) and 10/2025-CT(Rate) (named, not opened).
- Reverse charge under 13/2017-CT(Rate) and later RCM notifications (not opened).
- Compensation cess rates, except the newsletter statement that cess on the named tobacco and pan masala goods becomes nil from 1 February 2026, which is recorded in notes and in the 2026 policy diff — not as a cess treatment.
- Whether any goods remain at 28% after 1 February 2026 (unconfirmed).
- Bidi as its own treatment (the Council annexure describes a move from 28% to 18% on the deferred transition date; that path is noted, not encoded as a separate rate version).
- Income tax, TDS/TCS, customs duty, and state levies other than the SGST/UTGST component already included in the combined GST figures.
- The complete HSN or SAC tariff.

If a field is missing, the pack is silent. Do not infer zero.

## Sources used for the numbers

- [Recommendations of the 56th Meeting of the GST Council (PIB press release, 3 Sep 2025)](https://www.gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf)
- [FAQs-3 on decisions of the 56th GST Council (PIB, 18 Sep 2025)](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2168426&lang=2&reg=3)
- [GST Council Monthly Newsletter, December 2025](https://gstcouncil.gov.in/sites/default/files/2026-01/monthly_newsletter_december_2025_1.pdf)

Notification No. 9/2025-Central Tax (Rate) dated 17 September 2025, Notification No. 10/2025-CT(Rate), Notification No. 19/2025-CT(Rate) dated 31 December 2025, and Notification No. 03/2025-Compensation Cess (Rate) are named in those releases but were not opened.

## History

Diffs in `diffs/` record the 22 September 2025 56th Council rationalisation (12% retired, 5% widened, 28% to 40% for goods that move on that date, 18% restated) and the 1 February 2026 move of named tobacco and pan masala goods into 40%. Old rate versions stay in `regime.json` and point at their successor.
