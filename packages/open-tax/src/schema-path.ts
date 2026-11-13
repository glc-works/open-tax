// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA_FILES = {
  regime: "regime.schema.json",
  policyDiff: "policy-diff.schema.json",
  dictionaryEntry: "dictionary-entry.schema.json",
} as const;

export type SchemaName = keyof typeof SCHEMA_FILES;

export function resolveSchemaRoot(moduleUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(moduleUrl));
  const candidates = [
    join(here, "../schemas"),
    join(here, "../../schemas"),
    join(here, "../../../schemas"),
    join(here, "../../../../schemas"),
  ];
  const found = candidates.filter((candidate) =>
    existsSync(join(candidate, SCHEMA_FILES.regime)),
  );
  if (found.length === 0) {
    throw new Error(
      "Open-Tax JSON Schemas were not found. Build the package or run from the repository.",
    );
  }
  const fromSource = here.endsWith(`${sep}src`);
  if (fromSource) {
    const farthest = found[found.length - 1];
    if (!farthest) throw new Error("Open-Tax JSON Schemas were not found.");
    return farthest;
  }
  const nearest = found[0];
  if (!nearest) throw new Error("Open-Tax JSON Schemas were not found.");
  return nearest;
}

export function readSchemaDocument(name: SchemaName, moduleUrl?: string): object {
  const root = resolveSchemaRoot(moduleUrl);
  const text = readFileSync(join(root, SCHEMA_FILES[name]), "utf8");
  return JSON.parse(text) as object;
}
