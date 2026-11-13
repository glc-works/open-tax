// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import type { Dictionary, PolicyDiff, Regime, ValidationIssue, ValidationResult } from "./types.js";
import {
  checkDictionaryAgainstPack,
  checkPolicyDiffAgainstPack,
  validateDictionary,
  validatePack,
  validatePolicyDiff,
} from "./validate.js";

export interface RepositoryReport {
  valid: boolean;
  issues: ValidationIssue[];
  packs: number;
}

function findRepoRoot(start: string): string | undefined {
  let dir = start;
  for (let depth = 0; depth < 10; depth += 1) {
    if (
      existsSync(join(dir, "schemas", "regime.schema.json")) &&
      existsSync(join(dir, "packs"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function prefix(file: string, issues: ValidationIssue[]): ValidationIssue[] {
  return issues.map((item) => ({ ...item, path: `${file}${item.path === "/" ? "" : item.path}` }));
}

export function validateRepository(root: string): RepositoryReport {
  const issues: ValidationIssue[] = [];
  const packsDir = join(root, "packs");
  const folders = readdirSync(packsDir).filter((name) => statSync(join(packsDir, name)).isDirectory());
  let packs = 0;

  for (const folder of folders) {
    const dir = join(packsDir, folder);
    const regimePath = join(dir, "regime.json");
    if (!existsSync(regimePath)) {
      issues.push({
        level: "error",
        path: regimePath,
        message: "Pack folder has no regime.json.",
      });
      continue;
    }
    packs += 1;
    const expectedPackId = folder === "_template" ? "xx" : folder;
    let regime: Regime;
    try {
      const parsed = readJson(regimePath);
      const validated = validatePack(parsed, { expectedPackId });
      issues.push(...prefix(regimePath, validated.issues));
      if (!validated.valid) continue;
      regime = parsed as Regime;
    } catch (error) {
      issues.push({
        level: "error",
        path: regimePath,
        message: error instanceof Error ? error.message : "Could not read regime.json.",
      });
      continue;
    }

    const diffsDir = join(dir, "diffs");
    if (existsSync(diffsDir)) {
      for (const file of readdirSync(diffsDir).filter((name) => name.endsWith(".json"))) {
        const path = join(diffsDir, file);
        try {
          const parsed = readJson(path);
          const validated = validatePolicyDiff(parsed);
          issues.push(...prefix(path, validated.issues));
          if (validated.valid) {
            issues.push(...prefix(path, checkPolicyDiffAgainstPack(parsed as PolicyDiff, regime)));
          }
        } catch (error) {
          issues.push({
            level: "error",
            path,
            message: error instanceof Error ? error.message : "Could not read diff.",
          });
        }
      }
    }

    const dictionariesDir = join(dir, "dictionaries");
    if (!existsSync(dictionariesDir) && folder !== "_template") {
      issues.push({
        level: "warning",
        path: dictionariesDir,
        message: "Pack has no dictionaries/ directory yet.",
      });
    }
    if (existsSync(dictionariesDir)) {
      for (const file of readdirSync(dictionariesDir).filter((name) => name.endsWith(".json"))) {
        const path = join(dictionariesDir, file);
        try {
          const parsed = readJson(path);
          const validated = validateDictionary(parsed);
          issues.push(...prefix(path, validated.issues));
          if (validated.valid) {
            issues.push(...prefix(path, checkDictionaryAgainstPack(parsed as Dictionary, regime)));
          }
        } catch (error) {
          issues.push({
            level: "error",
            path,
            message: error instanceof Error ? error.message : "Could not read dictionary.",
          });
        }
      }
    }
  }

  return {
    valid: issues.every((item) => item.level !== "error"),
    issues,
    packs,
  };
}

function printReport(report: RepositoryReport): void {
  const errors = report.issues.filter((item) => item.level === "error");
  const warnings = report.issues.filter((item) => item.level === "warning");
  for (const item of report.issues) {
    console.log(`${item.level}\t${item.path}\t${item.message}`);
  }
  console.log(
    `Validated ${report.packs} pack(s), ${errors.length} error(s), ${warnings.length} warning(s).`,
  );
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

export function main(): ValidationResult {
  const start = process.cwd();
  const root =
    findRepoRoot(start) ?? findRepoRoot(dirname(fileURLToPath(import.meta.url)));
  if (!root) {
    console.error("Could not find an open-tax checkout (schemas/ and packs/).");
    return { valid: false, issues: [] };
  }
  const report = validateRepository(root);
  printReport(report);
  return { valid: report.valid, issues: report.issues };
}

if (isDirectRun()) {
  const report = main();
  if (!report.valid) process.exitCode = 1;
}
