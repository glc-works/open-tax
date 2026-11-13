// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { parseIsoDate } from "./dates.js";
import { readSchemaDocument, type SchemaName } from "./schema-path.js";
import type {
  Dictionary,
  PolicyDiff,
  Regime,
  Treatment,
  ValidationIssue,
  ValidationResult,
  ValidateOptions,
  Verification,
} from "./types.js";

const validators = new Map<SchemaName, ValidateFunction>();

function compile(name: SchemaName): ValidateFunction {
  const cached = validators.get(name);
  if (cached) return cached;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addFormat("date", {
    type: "string",
    validate: (value: string) => parseIsoDate(value) !== undefined,
  });
  ajv.addFormat("uri", {
    type: "string",
    validate: (value: string) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
  });
  const validate = ajv.compile(readSchemaDocument(name));
  validators.set(name, validate);
  return validate;
}

function issue(level: ValidationIssue["level"], path: string, message: string): ValidationIssue {
  return { level, path, message };
}

function formatAjvPath(error: ErrorObject): string {
  const base = error.instancePath || "";
  const missing =
    error.keyword === "required" &&
    error.params &&
    typeof error.params === "object" &&
    "missingProperty" in error.params
      ? String(error.params.missingProperty)
      : "";
  const joined = missing ? `${base}/${missing}` : base;
  return joined.length > 0 ? joined : "/";
}

function schemaIssues(name: SchemaName, data: unknown): ValidationIssue[] {
  const validate = compile(name);
  if (validate(data)) return [];
  return (validate.errors ?? []).map((error) =>
    issue("error", formatAjvPath(error), error.message ?? "schema validation failed"),
  );
}

function result(issues: ValidationIssue[]): ValidationResult {
  return { valid: issues.every((item) => item.level !== "error"), issues };
}

function verificationOf(versionStatus: Verification | undefined, treatment?: Treatment): Verification | undefined {
  return versionStatus ?? treatment?.verification;
}

function requireVerifiedCitation(
  issues: ValidationIssue[],
  path: string,
  verification: Verification | undefined,
  citations: Array<{ url?: string; instrument?: string }> | undefined,
): void {
  if (verification?.status !== "verified" && verification?.status !== "verified_starter") return;
  if (!citations || citations.length === 0) {
    issues.push(issue("error", path, "Verified entries need at least one legal citation."));
    return;
  }
  const cited = citations.some((citation) => Boolean(citation.url) && Boolean(citation.instrument));
  if (!cited) {
    issues.push(
      issue(
        "error",
        path,
        "Verified entries need a citation that has both an instrument and a URL.",
      ),
    );
  }
}

export function checkPackIntegrity(regime: Regime, options: ValidateOptions = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (options.expectedPackId && regime.pack_id !== options.expectedPackId) {
    issues.push(
      issue(
        "error",
        "/pack_id",
        `pack_id is ${regime.pack_id} but the folder expects ${options.expectedPackId}.`,
      ),
    );
  }

  const taxIds = new Set<string>();
  const treatmentById = new Map<string, { taxId: string; treatment: Treatment; path: string }>();
  const versionIds = new Set<string>();

  regime.taxes.forEach((tax, taxIndex) => {
    const taxPath = `/taxes/${taxIndex}`;
    if (taxIds.has(tax.id)) {
      issues.push(issue("error", `${taxPath}/id`, `Duplicate tax id ${tax.id}.`));
    }
    taxIds.add(tax.id);

    tax.treatments.forEach((treatment, treatmentIndex) => {
      const treatmentPath = `${taxPath}/treatments/${treatmentIndex}`;
      if (treatmentById.has(treatment.id)) {
        issues.push(issue("error", `${treatmentPath}/id`, `Duplicate treatment id ${treatment.id}.`));
      }
      treatmentById.set(treatment.id, { taxId: tax.id, treatment, path: treatmentPath });

      const versionsById = new Map(treatment.rates.map((version) => [version.id, version]));
      const openEnded = treatment.rates.filter((version) => version.effective_to === undefined);
      if (openEnded.length > 1) {
        issues.push(
          issue(
            "error",
            `${treatmentPath}/rates`,
            `Treatment ${treatment.id} has more than one open-ended rate version.`,
          ),
        );
      }

      const ranges: Array<{ id: string; from: number; to: number; path: string }> = [];
      treatment.rates.forEach((version, versionIndex) => {
        const versionPath = `${treatmentPath}/rates/${versionIndex}`;
        if (versionIds.has(version.id)) {
          issues.push(issue("error", `${versionPath}/id`, `Duplicate rate version id ${version.id}.`));
        }
        versionIds.add(version.id);

        const from = parseIsoDate(version.effective_from);
        const to = version.effective_to ? parseIsoDate(version.effective_to) : undefined;
        if (from === undefined) {
          issues.push(issue("error", `${versionPath}/effective_from`, "Invalid effective_from."));
        } else if (version.effective_to && to === undefined) {
          issues.push(issue("error", `${versionPath}/effective_to`, "Invalid effective_to."));
        } else if (from !== undefined && to !== undefined && to < from) {
          issues.push(
            issue("error", versionPath, "effective_to is earlier than effective_from."),
          );
        } else if (from !== undefined) {
          ranges.push({
            id: version.id,
            from,
            to: to ?? Number.POSITIVE_INFINITY,
            path: versionPath,
          });
        }

        if (version.effective_from_bound === "in_force_by") {
          issues.push(
            issue(
              "warning",
              `${versionPath}/effective_from_bound`,
              "effective_from is an in-force bound. The legal commencement may be earlier than this date.",
            ),
          );
        }

        if (version.successor_of) {
          const previous = versionsById.get(version.successor_of);
          if (!previous) {
            issues.push(
              issue(
                "error",
                `${versionPath}/successor_of`,
                `successor_of ${version.successor_of} is not a version of treatment ${treatment.id}.`,
              ),
            );
          } else if (previous.superseded_by !== version.id) {
            issues.push(
              issue(
                "error",
                `${versionPath}/successor_of`,
                `${version.id} names ${previous.id} as predecessor, but ${previous.id} does not name ${version.id} as superseded_by.`,
              ),
            );
          }
        }
        if (version.superseded_by) {
          const next = versionsById.get(version.superseded_by);
          if (!next) {
            issues.push(
              issue(
                "error",
                `${versionPath}/superseded_by`,
                `superseded_by ${version.superseded_by} is not a version of treatment ${treatment.id}.`,
              ),
            );
          } else if (next.successor_of !== version.id) {
            issues.push(
              issue(
                "error",
                `${versionPath}/superseded_by`,
                `${version.id} names ${next.id} as successor, but ${next.id} does not name ${version.id} as successor_of.`,
              ),
            );
          }
        }

        const status = verificationOf(version.verification, treatment);
        requireVerifiedCitation(issues, `${versionPath}/legal_citations`, status, version.legal_citations);

        if (
          version.rate.kind === "schedule" &&
          (!version.rate.brackets || version.rate.brackets.length === 0) &&
          (!version.rate.notes || version.rate.notes.trim().length < 20)
        ) {
          issues.push(
            issue(
              "error",
              `${versionPath}/rate`,
              "A schedule with no brackets must explain, in notes, why the table is not transcribed.",
            ),
          );
        }
        if (version.rate.kind === "ad_valorem" && version.rate.value === undefined) {
          issues.push(issue("error", `${versionPath}/rate/value`, "An ad valorem rate needs value."));
        }
        if (version.rate.kind === "formula" && !version.rate.base_formula) {
          issues.push(
            issue("error", `${versionPath}/rate/base_formula`, "A formula rate needs base_formula."),
          );
        }
        if (
          version.rate.kind === "specific" &&
          (version.rate.value === undefined || version.rate.currency === undefined)
        ) {
          issues.push(
            issue("error", `${versionPath}/rate`, "A specific rate needs value and currency."),
          );
        }
        if (version.rate.kind === "none" && version.rate.value !== undefined && version.rate.value !== "0") {
          issues.push(
            issue("error", `${versionPath}/rate/value`, "A none rate cannot carry a positive value."),
          );
        }
      });

      ranges.sort((left, right) => left.from - right.from);
      for (let index = 1; index < ranges.length; index += 1) {
        const previous = ranges[index - 1];
        const current = ranges[index];
        if (!previous || !current) continue;
        if (current.from <= previous.to) {
          issues.push(
            issue(
              "error",
              current.path,
              `Rate version ${current.id} overlaps ${previous.id} in treatment ${treatment.id}.`,
            ),
          );
        }
      }
    });
  });

  const mapped = new Set<string>();
  regime.semantic_mappings.forEach((mapping, index) => {
    const path = `/semantic_mappings/${index}`;
    if (mapped.has(mapping.treatment_id)) {
      issues.push(
        issue("error", path, `Treatment ${mapping.treatment_id} is mapped more than once.`),
      );
    }
    mapped.add(mapping.treatment_id);
    const found = treatmentById.get(mapping.treatment_id);
    if (!found) {
      issues.push(
        issue("error", `${path}/treatment_id`, `Unknown treatment ${mapping.treatment_id}.`),
      );
      return;
    }
    if (found.treatment.semantic_code !== mapping.semantic_code) {
      issues.push(
        issue(
          "error",
          `${path}/semantic_code`,
          `Mapping says ${mapping.semantic_code} but treatment ${mapping.treatment_id} is ${found.treatment.semantic_code}.`,
        ),
      );
    }
  });

  for (const [treatmentId, found] of treatmentById) {
    if (!mapped.has(treatmentId)) {
      issues.push(
        issue(
          "error",
          `${found.path}/id`,
          `Treatment ${treatmentId} has no semantic_mappings rule.`,
        ),
      );
    }
  }

  return issues;
}

export function validatePack(data: unknown, options: ValidateOptions = {}): ValidationResult {
  const schema = schemaIssues("regime", data);
  if (schema.some((item) => item.level === "error") || options.integrity === false) {
    return result(schema);
  }
  const integrity = checkPackIntegrity(data as Regime, options);
  return result([...schema, ...integrity]);
}

export function validatePolicyDiff(data: unknown): ValidationResult {
  return result(schemaIssues("policyDiff", data));
}

export function validateDictionary(data: unknown): ValidationResult {
  const issues = schemaIssues("dictionaryEntry", data);
  if (issues.some((item) => item.level === "error")) return result(issues);
  const dictionary = data as Dictionary;
  if (
    (dictionary.verification?.status === "verified" ||
      dictionary.verification?.status === "verified_starter") &&
    dictionary.entries.length === 0
  ) {
    issues.push(issue("error", "/entries", "A verified dictionary needs at least one entry."));
  }
  dictionary.entries.forEach((entry, index) => {
    const status = entry.verification ?? dictionary.verification;
    requireVerifiedCitation(issues, `/entries/${index}/legal_citations`, status, entry.legal_citations);
    if (entry.effective_from && entry.effective_to) {
      const from = parseIsoDate(entry.effective_from);
      const to = parseIsoDate(entry.effective_to);
      if (from !== undefined && to !== undefined && to < from) {
        issues.push(issue("error", `/entries/${index}`, "effective_to is earlier than effective_from."));
      }
    }
  });
  return result(issues);
}

export function checkPolicyDiffAgainstPack(diff: PolicyDiff, regime: Regime): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (diff.jurisdiction !== regime.jurisdiction.code) {
    issues.push(
      issue(
        "error",
        "/jurisdiction",
        `Diff jurisdiction ${diff.jurisdiction} does not match pack ${regime.jurisdiction.code}.`,
      ),
    );
  }
  if (diff.pack_id && diff.pack_id !== regime.pack_id) {
    issues.push(
      issue("error", "/pack_id", `Diff pack_id ${diff.pack_id} does not match ${regime.pack_id}.`),
    );
  }
  const taxIds = new Set(regime.taxes.map((tax) => tax.id));
  const treatmentIds = new Set(
    regime.taxes.flatMap((tax) => tax.treatments.map((treatment) => treatment.id)),
  );
  diff.changes.forEach((change, index) => {
    for (const taxId of change.affected.tax_ids ?? []) {
      if (!taxIds.has(taxId)) {
        issues.push(
          issue("error", `/changes/${index}/affected/tax_ids`, `Unknown tax ${taxId}.`),
        );
      }
    }
    for (const treatmentId of change.affected.treatment_ids ?? []) {
      if (!treatmentIds.has(treatmentId)) {
        issues.push(
          issue(
            "error",
            `/changes/${index}/affected/treatment_ids`,
            `Unknown treatment ${treatmentId}.`,
          ),
        );
      }
    }
  });
  return issues;
}

export function checkDictionaryAgainstPack(dictionary: Dictionary, regime: Regime): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (dictionary.jurisdiction !== regime.jurisdiction.code) {
    issues.push(
      issue(
        "error",
        "/jurisdiction",
        `Dictionary jurisdiction ${dictionary.jurisdiction} does not match pack ${regime.jurisdiction.code}.`,
      ),
    );
  }
  if (dictionary.pack_id && dictionary.pack_id !== regime.pack_id) {
    issues.push(
      issue(
        "error",
        "/pack_id",
        `Dictionary pack_id ${dictionary.pack_id} does not match ${regime.pack_id}.`,
      ),
    );
  }
  const treatments = new Map(
    regime.taxes.flatMap((tax) =>
      tax.treatments.map((treatment) => [treatment.id, { taxId: tax.id, treatment }] as const),
    ),
  );
  const taxIds = new Set(regime.taxes.map((tax) => tax.id));
  dictionary.entries.forEach((entry, index) => {
    const target = entry.maps_to;
    if (!target) return;
    if (target.tax_id && !taxIds.has(target.tax_id)) {
      issues.push(
        issue("error", `/entries/${index}/maps_to/tax_id`, `Unknown tax ${target.tax_id}.`),
      );
    }
    if (!target.treatment_id) return;
    const found = treatments.get(target.treatment_id);
    if (!found) {
      issues.push(
        issue(
          "error",
          `/entries/${index}/maps_to/treatment_id`,
          `Unknown treatment ${target.treatment_id}.`,
        ),
      );
      return;
    }
    if (target.tax_id && found.taxId !== target.tax_id) {
      issues.push(
        issue(
          "error",
          `/entries/${index}/maps_to/treatment_id`,
          `Treatment ${target.treatment_id} belongs to tax ${found.taxId}, not ${target.tax_id}.`,
        ),
      );
    }
    if (target.semantic_code && found.treatment.semantic_code !== target.semantic_code) {
      issues.push(
        issue(
          "error",
          `/entries/${index}/maps_to/semantic_code`,
          `Treatment ${target.treatment_id} is ${found.treatment.semantic_code}, not ${target.semantic_code}.`,
        ),
      );
    }
  });
  return issues;
}
