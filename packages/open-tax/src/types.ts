// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

export const SEMANTIC_CODES = [
  "standard",
  "reduced",
  "super_reduced",
  "zero",
  "exempt",
  "out_of_scope",
  "reverse_charge",
  "withholding",
  "luxury",
  "not_collected",
  "final",
] as const;

export type SemanticCode = (typeof SEMANTIC_CODES)[number];

export type VerificationStatus =
  | "verified_starter"
  | "verified"
  | "structure_only"
  | "unverified";

export interface Citation {
  title: string;
  instrument: string;
  url?: string;
  pinpoint?: string;
  publisher?: string;
}

export interface Verification {
  status: VerificationStatus;
  reviewed_on?: string;
  notes?: string;
}

export interface SemanticMapping {
  semantic_code: SemanticCode;
  treatment_id: string;
  local_code?: string;
  local_name?: string;
  rule: string;
}

export interface Bracket {
  label?: string;
  over?: string;
  up_to?: string;
  rate: string;
  notes?: string;
}

export type RateKind = "ad_valorem" | "specific" | "formula" | "none" | "schedule";

export interface Rate {
  kind: RateKind;
  /** Stated rate or stated effective equivalent. The library does not compute this from base_formula. */
  value?: string;
  statutory_value?: string;
  /** Human-readable base. Never evaluated. */
  base_formula?: string;
  unit?: string;
  currency?: string;
  brackets?: Bracket[];
  notes?: string;
}

export interface RateVersion {
  id: string;
  effective_from: string;
  effective_to?: string;
  effective_from_bound?: "exact" | "in_force_by";
  rate: Rate;
  legal_citations: Citation[];
  successor_of?: string;
  superseded_by?: string;
  verification?: Verification;
  notes?: string;
}

export interface TreatmentParameter {
  id: string;
  name: string;
  value?: string;
  unit?: string;
  notes?: string;
}

export interface Treatment {
  id: string;
  name: string;
  local_name?: string;
  local_code?: string;
  semantic_code: SemanticCode;
  authority_codes?: string[];
  chargeability?:
    | "charged"
    | "zero_rated"
    | "exempt"
    | "out_of_scope"
    | "not_collected"
    | "withheld"
    | "final_withheld"
    | "reverse_charged";
  input_credit?: "creditable" | "not_creditable" | "not_applicable" | "see_citation";
  collection?: {
    method?:
      | "invoice"
      | "withholding"
      | "import"
      | "self_assessment"
      | "not_collected"
      | "none";
    interim?: boolean;
    reconciled_annually?: boolean;
  };
  parameters?: TreatmentParameter[];
  rates: RateVersion[];
  verification?: Verification;
  notes?: string;
}

export interface Tax {
  id: string;
  name: string;
  local_name?: string;
  kind: "vat" | "sales" | "excise" | "income" | "withholding" | "customs" | "other";
  treatments: Treatment[];
  notes?: string;
}

export interface Regime {
  $schema?: string;
  schema_version: "1.0.0";
  pack_id: string;
  jurisdiction: {
    code: string;
    name: string;
    official_name?: string;
    subdivision?: string;
  };
  currency: string;
  authority: {
    id: string;
    name: string;
    short_name?: string;
    website?: string;
  };
  maintainer: {
    name: string;
    github?: string;
    url?: string;
  };
  semantic_mappings: SemanticMapping[];
  taxes: Tax[];
  notes?: string;
}

export type ChangeType =
  | "rate_change"
  | "base_change"
  | "treatment_added"
  | "treatment_removed"
  | "scope_change"
  | "collection_change"
  | "schedule_change"
  | "clarification";

export interface RateSnapshot {
  statutory_rate?: string;
  effective_rate?: string;
  base_formula?: string;
  description?: string;
}

export interface PolicyChange {
  id: string;
  effective_from: string;
  effective_to?: string;
  change_type: ChangeType;
  summary: string;
  affected: {
    semantic_codes?: SemanticCode[];
    authority_codes?: string[];
    treatment_ids?: string[];
    tax_ids?: string[];
  };
  computation?: {
    base_formula?: string;
    statutory_rate?: string;
    effective_rate?: string;
    notes?: string;
  };
  migration_impact: {
    severity: "low" | "medium" | "high";
    summary: string;
    systems?: Array<
      "invoicing" | "payroll" | "filing" | "reporting" | "ecommerce" | "customs" | "other"
    >;
  };
  before?: RateSnapshot;
  after?: RateSnapshot;
}

export interface PolicyDiff {
  $schema?: string;
  schema_version: "1.0.0";
  id: string;
  jurisdiction: string;
  pack_id?: string;
  title: string;
  summary?: string;
  legal_basis: Citation[];
  changes: PolicyChange[];
  verification?: Verification;
  notes?: string;
}

export interface DictionaryCorrelation {
  system: string;
  code?: string;
  notes?: string;
}

export interface DictionaryEntry {
  code: string;
  name: string;
  description?: string;
  status?: "active" | "deprecated" | "sample";
  maps_to?: {
    tax_id?: string;
    treatment_id?: string;
    semantic_code?: SemanticCode;
    notes?: string;
  };
  correlates_to?: DictionaryCorrelation[];
  legal_citations?: Citation[];
  verification?: Verification;
  effective_from?: string;
  effective_to?: string;
}

export interface Dictionary {
  $schema?: string;
  schema_version: "1.0.0";
  dictionary_id: string;
  jurisdiction: string;
  pack_id?: string;
  kind: "authority_filing" | "commodity" | "sector" | "correlation" | "other";
  name: string;
  authority?: string;
  verification?: Verification;
  notes?: string;
  entries: DictionaryEntry[];
}

export interface ValidationIssue {
  level: "error" | "warning";
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidateOptions {
  /** Run cross-field checks after the schema. Defaults to true. */
  integrity?: boolean;
  /** When set, regime.pack_id must equal this value. */
  expectedPackId?: string;
}

export interface ResolveQuery {
  /** Inclusive calendar date, YYYY-MM-DD. */
  date: string;
  taxId?: string;
  treatmentId?: string;
  semanticCode?: SemanticCode;
}

export interface ResolvedRate {
  taxId: string;
  taxName: string;
  treatmentId: string;
  treatmentName: string;
  localName?: string;
  localCode?: string;
  semanticCode: SemanticCode;
  versionId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  effectiveFromBound: "exact" | "in_force_by";
  rate: Rate;
  legalCitations: Citation[];
  chargeability?: Treatment["chargeability"];
  inputCredit?: Treatment["input_credit"];
  notes?: string;
}

export interface PolicyDiffFilter {
  /** Inclusive overlap start, YYYY-MM-DD. */
  from?: string;
  /** Inclusive overlap end, YYYY-MM-DD. */
  to?: string;
  semanticCodes?: readonly SemanticCode[];
  authorityCodes?: readonly string[];
  taxIds?: readonly string[];
}

export interface RegimeChange {
  taxId: string;
  treatmentId: string;
  semanticCode: SemanticCode;
  versionId?: string;
  changeType: "added" | "removed" | "modified";
  path: string;
}

export interface SchemaBundle {
  regime: object;
  policyDiff: object;
  dictionaryEntry: object;
}
