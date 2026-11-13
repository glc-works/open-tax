# China (`cn`)

Starter pack for the People's Republic of China's value-added tax bands and headline enterprise income tax rates, plus a sample of 税收分类编码 (tax classification codes). It is a software reference. It is not a filing position and not a complete Chinese tax engine.

Reviewed against the cited STA, State Council gazette, gov.cn, and NPC pages on 2026-11-13.

## What is encoded

| Local rule | Semantic key | What the numbers are |
| --- | --- | --- |
| Standard VAT: 17% (in force by 1 Jan 1994–30 Apr 2018), 16% (1 May 2018–31 Mar 2019), 13% (1 Apr 2019–31 Dec 2025), 13% under the VAT Law (from 1 Jan 2026) | `standard` | 17% is `verified_starter` (confirmed as the pre-change rate by 财税〔2018〕32号; 1994 start uses `in_force_by` because the 1993 Provisional Regulations text was not opened). Later steps are cited to Circular 32, Announcement 39, and the VAT Law. |
| Reduced VAT path: 11% (in force by 1 Jan 2018–30 Apr 2018), 10% (1 May 2018–31 Mar 2019), 9% (1 Apr 2019–31 Dec 2025), 9% under the VAT Law (from 1 Jan 2026) | `reduced` (`cn-vat-reduced-9`) | 11% is `verified_starter`. The legal start of the 11% band was not pinned; 1994 is not used as its start. |
| 6% VAT band: 1 May 2016–31 Dec 2025 (财税〔2016〕36号), then 6% under VAT Law Art. 10 (from 1 Jan 2026) | `reduced` (`cn-vat-reduced-6`) | Cited to the State Council gazette text of Circular 36 and the SAT notification page, then the VAT Law. |
| 3% simplified collection rate under VAT Law Art. 11, from 1 Jan 2026 | `reduced` (`cn-vat-simplified-3`) | Collection rate, typically for small-scale taxpayers, not a general-method band. |
| Export and prescribed cross-border zero rate, from 1 Jan 2026 | `zero` | VAT Law Art. 10(4) and (5). |
| VAT exemption, from 1 Jan 2026 | `exempt` | VAT Law Art. 24, category only. |
| Enterprise income tax 25% from 1 Jan 2008 | `standard` | EIT Law Art. 4 and Art. 60. |
| High-and-new-technology enterprises 15% from 1 Jan 2008 | `reduced` | Art. 28 para 2. |
| Small and low-profit enterprises, statutory 20% from 1 Jan 2008 | `reduced` | Art. 28 para 1. Temporary further reliefs are not encoded. |
| Non-resident enterprise statutory 20% from 1 Jan 2008 | `withholding` | Art. 4 para 2. |

A sample of 19-digit 税收分类编码 from STA Announcement [2017] No. 45 is in `dictionaries/tax-classification-codes.sample.json`. Codes are not rates.

## What is not encoded

- The 1993 Provisional VAT Regulations text itself (used only as a conventional `in_force_by` bound for the 17% band).
- The legal start of the 11% reduced band (post-营改增 consolidation). This pack only claims that 11% was in force by 1 January 2018.
- Pre-2026 export zero-rating and exemptions under the Provisional Regulations (not opened as prior versions).
- Pre-2026 simplified collection-rate history, including 财税〔2009〕9号.
- The temporary 1% COVID/SME simplified collection-rate reduction (not verified with dates or citations in the source research).
- VAT refund rates, retention rates, or incentive pilots.
- The 10% reduced rate for non-resident enterprise passive income under the EIT Implementation Regulations (often associated with Art. 91). It is widely cited in secondary sources but was not opened, so it is not encoded. The statutory rate in this pack is 20%.
- Individual income tax, consumption tax, customs duty, and local extra charges.
- The full (and subsequently updated) 税收分类编码 table. The dictionary is a 15-row sample from the 2017 attachment; STA has updated the table since.

If a field is missing, the pack is silent. Do not infer zero.

## Sources used for the numbers

- [财税〔2018〕32号](https://www.chinatax.gov.cn/chinatax/n810341/n810765/n3359382/n3359454/c3545207/content.html) (STA)
- [财政部 税务总局 海关总署公告2019年第39号](https://www.chinatax.gov.cn/chinatax/n810341/n810765/n4182981/201903/c4358850/content.html) (STA)
- [中华人民共和国增值税法](https://www.gov.cn/yaowen/liebiao/202412/content_6994557.htm) (gov.cn)
- [财税〔2016〕36号 — 国务院公报](https://www.gov.cn/gongbao/content/2016/content_5088782.htm) (complete text, including Annex 1 Art. 15(1) at 6%)
- [财税〔2016〕36号 — STA notification page](https://www.chinatax.gov.cn/chinatax/n810341/n810765/n1990035/201603/c2192724/content.html)
- [企业所得税法（2018年修正）](http://www.npc.gov.cn/npc/c2/c30834/201905/t20190521_296654.html) (npc.gov.cn)
- [国家税务总局公告2017年第45号附件 商品和服务税收分类编码表.xls](https://www.chinatax.gov.cn/chinatax/n810341/n810765/n2511651/201712/c3300221/5118186/files/640910ad35e24745a63f4f73ead62dff.xls)

## History

Diffs in `diffs/` record the 1 May 2018 Circular 32 rate cut, the 1 April 2019 Announcement 39 rate cut, and the 1 January 2026 commencement of the VAT Law (same general-method percentages, new instrument). Old rate versions stay in `regime.json` and point at their successor.
