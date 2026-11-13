// Copyright GLC Works and Open-Tax contributors.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { assertIsoDate, dateInRange } from "./dates.js";
import type { Regime, ResolveQuery, ResolvedRate } from "./types.js";

/**
 * Return every treatment version in force on `query.date`.
 *
 * `rate.value` and `rate.base_formula` are returned as published in the pack.
 * This function does not evaluate formulas and does not round money.
 */
export function resolveTaxAtDate(regime: Regime, query: ResolveQuery): ResolvedRate[] {
  assertIsoDate(query.date, "query.date");
  const matches: ResolvedRate[] = [];

  for (const tax of regime.taxes) {
    if (query.taxId && tax.id !== query.taxId) continue;
    for (const treatment of tax.treatments) {
      if (query.treatmentId && treatment.id !== query.treatmentId) continue;
      if (query.semanticCode && treatment.semantic_code !== query.semanticCode) continue;
      for (const version of treatment.rates) {
        if (!dateInRange(query.date, version.effective_from, version.effective_to)) continue;
        const notes = [treatment.notes, version.notes].filter(Boolean).join("\n");
        matches.push({
          taxId: tax.id,
          taxName: tax.name,
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          ...(treatment.local_name ? { localName: treatment.local_name } : {}),
          ...(treatment.local_code ? { localCode: treatment.local_code } : {}),
          semanticCode: treatment.semantic_code,
          versionId: version.id,
          effectiveFrom: version.effective_from,
          ...(version.effective_to ? { effectiveTo: version.effective_to } : {}),
          effectiveFromBound: version.effective_from_bound ?? "exact",
          rate: version.rate,
          legalCitations: version.legal_citations,
          ...(treatment.chargeability ? { chargeability: treatment.chargeability } : {}),
          ...(treatment.input_credit ? { inputCredit: treatment.input_credit } : {}),
          ...(notes ? { notes } : {}),
        });
      }
    }
  }

  return matches;
}
