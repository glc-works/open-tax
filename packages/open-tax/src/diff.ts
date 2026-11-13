// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

import { rangesOverlap } from "./dates.js";
import type { PolicyDiff, PolicyDiffFilter, Regime, RegimeChange } from "./types.js";

function isPolicyDiffList(value: readonly PolicyDiff[] | Regime): value is readonly PolicyDiff[] {
  return Array.isArray(value);
}

function intersects(left: readonly string[] | undefined, right: readonly string[] | undefined): boolean {
  if (!right || right.length === 0) return true;
  if (!left || left.length === 0) return false;
  const wanted = new Set(right);
  return left.some((item) => wanted.has(item));
}

function filterDiffs(diffs: readonly PolicyDiff[], filter: PolicyDiffFilter): PolicyDiff[] {
  const selected: PolicyDiff[] = [];
  for (const diff of diffs) {
    const changes = diff.changes.filter((change) => {
      const dated =
        filter.from === undefined && filter.to === undefined
          ? true
          : rangesOverlap(
              change.effective_from,
              change.effective_to,
              filter.from ?? "0001-01-01",
              filter.to,
            );
      if (!dated) return false;
      if (!intersects(change.affected.semantic_codes, filter.semanticCodes)) return false;
      if (!intersects(change.affected.authority_codes, filter.authorityCodes)) return false;
      if (!intersects(change.affected.tax_ids, filter.taxIds)) return false;
      return true;
    });
    if (changes.length === 0) continue;
    selected.push({ ...diff, changes });
  }
  return selected;
}

function canonical(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortValue(item));
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortValue(source[key]);
    }
    return sorted;
  }
  return value;
}

function regimeManifest(regime: Regime): Record<string, unknown> {
  const { taxes: _taxes, semantic_mappings: _mappings, ...rest } = regime;
  return rest;
}

function diffRegimes(before: Regime, after: Regime): RegimeChange[] {
  const changes: RegimeChange[] = [];
  if (canonical(regimeManifest(before)) !== canonical(regimeManifest(after))) {
    changes.push({ changeType: "modified", path: "/" });
  }
  if (canonical(before.semantic_mappings) !== canonical(after.semantic_mappings)) {
    changes.push({ changeType: "modified", path: "/semantic_mappings" });
  }
  const beforeTaxes = new Map(before.taxes.map((tax) => [tax.id, tax]));
  const afterTaxes = new Map(after.taxes.map((tax) => [tax.id, tax]));
  const taxIds = new Set([...beforeTaxes.keys(), ...afterTaxes.keys()]);

  for (const taxId of taxIds) {
    const leftTax = beforeTaxes.get(taxId);
    const rightTax = afterTaxes.get(taxId);
    if (!leftTax || !rightTax) {
      const tax = rightTax ?? leftTax;
      if (!tax) continue;
      for (const treatment of tax.treatments) {
        if (treatment.rates.length === 0) {
          changes.push({
            taxId,
            treatmentId: treatment.id,
            semanticCode: treatment.semantic_code,
            changeType: rightTax ? "added" : "removed",
            path: `/taxes/${taxId}/treatments/${treatment.id}`,
          });
        }
        for (const version of treatment.rates) {
          changes.push({
            taxId,
            treatmentId: treatment.id,
            semanticCode: treatment.semantic_code,
            versionId: version.id,
            changeType: rightTax ? "added" : "removed",
            path: `/taxes/${taxId}/treatments/${treatment.id}/rates/${version.id}`,
          });
        }
      }
      continue;
    }

    const { treatments: leftTreatmentList, ...leftTaxMeta } = leftTax;
    const { treatments: rightTreatmentList, ...rightTaxMeta } = rightTax;
    if (canonical(leftTaxMeta) !== canonical(rightTaxMeta)) {
      changes.push({
        taxId,
        changeType: "modified",
        path: `/taxes/${taxId}`,
      });
    }

    const leftTreatments = new Map(leftTreatmentList.map((treatment) => [treatment.id, treatment]));
    const rightTreatments = new Map(rightTreatmentList.map((treatment) => [treatment.id, treatment]));
    const treatmentIds = new Set([...leftTreatments.keys(), ...rightTreatments.keys()]);
    for (const treatmentId of treatmentIds) {
      const left = leftTreatments.get(treatmentId);
      const right = rightTreatments.get(treatmentId);
      if (!left || !right) {
        const treatment = right ?? left;
        if (!treatment) continue;
        for (const version of treatment.rates) {
          changes.push({
            taxId,
            treatmentId,
            semanticCode: treatment.semantic_code,
            versionId: version.id,
            changeType: right ? "added" : "removed",
            path: `/taxes/${taxId}/treatments/${treatmentId}/rates/${version.id}`,
          });
        }
        continue;
      }

      const { rates: leftRates, ...leftMeta } = left;
      const { rates: rightRates, ...rightMeta } = right;
      if (canonical(leftMeta) !== canonical(rightMeta)) {
        changes.push({
          taxId,
          treatmentId,
          semanticCode: right.semantic_code,
          changeType: "modified",
          path: `/taxes/${taxId}/treatments/${treatmentId}`,
        });
      }

      const leftVersions = new Map(leftRates.map((version) => [version.id, version]));
      const rightVersions = new Map(rightRates.map((version) => [version.id, version]));
      const versionIds = new Set([...leftVersions.keys(), ...rightVersions.keys()]);
      for (const versionId of versionIds) {
        const leftVersion = leftVersions.get(versionId);
        const rightVersion = rightVersions.get(versionId);
        const path = `/taxes/${taxId}/treatments/${treatmentId}/rates/${versionId}`;
        if (!leftVersion || !rightVersion) {
          changes.push({
            taxId,
            treatmentId,
            semanticCode: right.semantic_code,
            versionId,
            changeType: rightVersion ? "added" : "removed",
            path,
          });
          continue;
        }
        if (canonical(leftVersion) !== canonical(rightVersion)) {
          changes.push({
            taxId,
            treatmentId,
            semanticCode: right.semantic_code,
            versionId,
            changeType: "modified",
            path,
          });
        }
      }
    }
  }

  return changes;
}

/**
 * Filter published policy diffs, or compare two regime snapshots.
 *
 * Comparing regimes reports structural edits. It does not invent a legal citation.
 * Pass diffs when you want the maintainer-authored change log.
 */
export function diffPolicyChanges(
  diffs: readonly PolicyDiff[],
  filter?: PolicyDiffFilter,
): PolicyDiff[];
export function diffPolicyChanges(before: Regime, after: Regime): RegimeChange[];
export function diffPolicyChanges(
  diffsOrBefore: readonly PolicyDiff[] | Regime,
  filterOrAfter?: PolicyDiffFilter | Regime,
): PolicyDiff[] | RegimeChange[] {
  if (isPolicyDiffList(diffsOrBefore)) {
    const filter = (filterOrAfter ?? {}) as PolicyDiffFilter;
    return filterDiffs(diffsOrBefore, filter);
  }
  const before = diffsOrBefore;
  if (!filterOrAfter || Array.isArray(filterOrAfter) || !("taxes" in filterOrAfter)) {
    throw new TypeError("diffPolicyChanges(before, after) expects two regime objects.");
  }
  return diffRegimes(before, filterOrAfter);
}
