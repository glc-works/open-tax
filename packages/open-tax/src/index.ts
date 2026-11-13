// Copyright GLC Works and Open-Tax contributors.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { readSchemaDocument } from "./schema-path.js";
import type { SchemaBundle } from "./types.js";

export { diffPolicyChanges } from "./diff.js";
export { resolveTaxAtDate } from "./resolve.js";
export { SEMANTIC_CODES } from "./types.js";
export {
  checkDictionaryAgainstPack,
  checkPackIntegrity,
  checkPolicyDiffAgainstPack,
  validateDictionary,
  validatePack,
  validatePolicyDiff,
} from "./validate.js";

export type {
  ChangeType,
  Citation,
  Dictionary,
  DictionaryEntry,
  PolicyChange,
  PolicyDiff,
  PolicyDiffFilter,
  Rate,
  RateVersion,
  Regime,
  RegimeChange,
  ResolveQuery,
  ResolvedRate,
  SchemaBundle,
  SemanticCode,
  Tax,
  Treatment,
  ValidateOptions,
  ValidationIssue,
  ValidationResult,
  Verification,
} from "./types.js";

let schemaCache: SchemaBundle | undefined;

/** Parsed JSON Schema documents shipped with the repository and the package build. */
export function getSchemas(): SchemaBundle {
  if (!schemaCache) {
    schemaCache = {
      regime: readSchemaDocument("regime"),
      policyDiff: readSchemaDocument("policyDiff"),
      dictionaryEntry: readSchemaDocument("dictionaryEntry"),
    };
  }
  return schemaCache;
}
