// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveTaxAtDate } from "./resolve.js";
import {
  SEMANTIC_CODES,
  type Dictionary,
  type PolicyDiff,
  type Regime,
  type SemanticCode,
  type ValidationIssue,
  type ValidationResult,
} from "./types.js";
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

const HELP = `open-tax: validate packs and resolve a treatment on a date

Usage:
  open-tax [--help] [--version]
  open-tax validate [path]
  open-tax resolve <regime.json> --date YYYY-MM-DD [--semantic <code>] [--tax <id>] [--treatment <id>]

With no command, open-tax validate runs and searches upward from the current directory.

Commands:
  validate [path]    Check a repository that contains schemas/ and packs/, a pack folder, or a regime.json file.
  resolve <file>     Print JSON for the treatments in force on --date. Does not evaluate base_formula.

Options:
  -h, --help         Show this help
  -v, --version      Print the open-tax package version
  --date <date>      Inclusive calendar day, YYYY-MM-DD (required for resolve)
  --semantic <code>  Semantic code, for example standard or withholding
  --tax <id>         Tax id
  --treatment <id>   Treatment id

Pack data is a coded reference, not a filing position.
`;

const VALUE_OPTIONS = new Set(["date", "semantic", "tax", "treatment"]);

interface ParsedArgs {
  positionals: string[];
  options: Record<string, string | boolean>;
}

function findRepoRoot(start: string): string | undefined {
  let dir = start;
  for (let depth = 0; depth < 10; depth += 1) {
    if (isRepoRoot(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

function isRepoRoot(dir: string): boolean {
  return (
    existsSync(join(dir, "schemas", "regime.schema.json")) && existsSync(join(dir, "packs"))
  );
}

/** Folder name is the pack id only under packs/<id>/. The template folder maps to pack id xx. */
function folderPackId(dir: string): string | undefined {
  if (basename(dirname(dir)) !== "packs") return undefined;
  const folder = basename(dir);
  return folder === "_template" ? "xx" : folder;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function prefix(file: string, issues: ValidationIssue[]): ValidationIssue[] {
  return issues.map((item) => ({ ...item, path: `${file}${item.path === "/" ? "" : item.path}` }));
}

function inspectPack(dir: string): { issues: ValidationIssue[]; counted: boolean } {
  const issues: ValidationIssue[] = [];
  const regimePath = join(dir, "regime.json");
  if (!existsSync(regimePath)) {
    issues.push({
      level: "error",
      path: regimePath,
      message: "Pack folder has no regime.json.",
    });
    return { issues, counted: false };
  }

  const folder = basename(dir);
  const expectedPackId = folderPackId(dir);
  let regime: Regime | undefined;
  try {
    const parsed = readJson(regimePath);
    const validated = validatePack(
      parsed,
      expectedPackId === undefined ? {} : { expectedPackId },
    );
    issues.push(...prefix(regimePath, validated.issues));
    if (validated.valid) regime = parsed as Regime;
  } catch (error) {
    issues.push({
      level: "error",
      path: regimePath,
      message: error instanceof Error ? error.message : "Could not read regime.json.",
    });
  }

  if (!regime) return { issues, counted: true };

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

  return { issues, counted: true };
}

export function validateRepository(root: string): RepositoryReport {
  const issues: ValidationIssue[] = [];
  const packsDir = join(root, "packs");
  const folders = readdirSync(packsDir).filter((name) => statSync(join(packsDir, name)).isDirectory());
  let packs = 0;

  for (const folder of folders) {
    const result = inspectPack(join(packsDir, folder));
    issues.push(...result.issues);
    if (result.counted) packs += 1;
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

function finishValidate(report: RepositoryReport): ValidationResult {
  printReport(report);
  return { valid: report.valid, issues: report.issues };
}

/**
 * True when this module is the process entry point.
 * npx, pnpm dlx, global npm and pnpm bins, and Homebrew all invoke the CLI
 * through a symlink, so both paths are canonicalized before they are compared.
 */
export function isDirectRun(
  entry: string | undefined = process.argv[1],
  moduleUrl: string = import.meta.url,
): boolean {
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

function readOwnPackageVersion(moduleUrl: string = import.meta.url): string {
  const start = dirname(fileURLToPath(moduleUrl));
  const candidates = [join(start, "..", "package.json"), join(start, "..", "..", "package.json")];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    let parsed: { name?: string; version?: string };
    try {
      parsed = JSON.parse(readFileSync(candidate, "utf8")) as { name?: string; version?: string };
    } catch {
      continue;
    }
    if (parsed.name === "open-tax" && typeof parsed.version === "string" && parsed.version.length > 0) {
      return parsed.version;
    }
  }
  throw new Error("Could not read the open-tax version from package.json.");
}

function formatFlag(name: string): string {
  return name.length === 1 ? `-${name}` : `--${name}`;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) continue;
    if (token === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (token.startsWith("--")) {
      const body = token.slice(2);
      const equals = body.indexOf("=");
      const name = equals === -1 ? body : body.slice(0, equals);
      if (!name) throw new Error(`Unknown option ${token}.`);
      if (equals !== -1) {
        const value = body.slice(equals + 1);
        if (value.length === 0) throw new Error(`Missing value for --${name}.`);
        options[name] = value;
        continue;
      }
      if (VALUE_OPTIONS.has(name)) {
        const value = argv[index + 1];
        if (value === undefined || value.startsWith("-")) {
          throw new Error(`Missing value for --${name}.`);
        }
        options[name] = value;
        index += 1;
        continue;
      }
      options[name] = true;
      continue;
    }
    if (token.startsWith("-") && token !== "-") {
      if (token.length !== 2) throw new Error(`Unknown option ${token}.`);
      options[token.slice(1)] = true;
      continue;
    }
    positionals.push(token);
  }
  return { positionals, options };
}

function ok(): ValidationResult {
  return { valid: true, issues: [] };
}

function fail(message: string): ValidationResult {
  console.error(message);
  return { valid: false, issues: [{ level: "error", path: "/", message }] };
}

function unknownOption(
  options: Record<string, string | boolean>,
  allowed: readonly string[],
): ValidationResult | undefined {
  const allow = new Set<string>(allowed);
  for (const name of Object.keys(options)) {
    if (!allow.has(name)) return fail(`Unknown option ${formatFlag(name)}.`);
  }
  return undefined;
}

function isSemanticCode(value: string): value is SemanticCode {
  for (const code of SEMANTIC_CODES) {
    if (code === value) return true;
  }
  return false;
}

function isRegime(value: unknown): value is Regime {
  return typeof value === "object" && value !== null && Array.isArray((value as { taxes?: unknown }).taxes);
}

function runValidate(pathArg: string | undefined): ValidationResult {
  if (pathArg === undefined) {
    const root =
      findRepoRoot(process.cwd()) ?? findRepoRoot(dirname(fileURLToPath(import.meta.url)));
    if (!root) {
      console.error("Could not find an open-tax checkout (schemas/ and packs/).");
      return { valid: false, issues: [] };
    }
    return finishValidate(validateRepository(root));
  }

  const target = resolve(pathArg);
  if (!existsSync(target)) return fail(`Path not found: ${target}`);
  const info = statSync(target);
  if (info.isDirectory()) {
    if (isRepoRoot(target)) return finishValidate(validateRepository(target));
    if (existsSync(join(target, "regime.json"))) return finishValidate(reportFromPack(target));
    return fail(`Expected a repository root (schemas/ and packs/) or a pack folder: ${target}`);
  }
  if (info.isFile() && basename(target) === "regime.json") {
    return finishValidate(reportFromPack(dirname(target)));
  }
  return fail(`Expected a repository root, a pack folder, or regime.json: ${target}`);
}

function reportFromPack(dir: string): RepositoryReport {
  const result = inspectPack(dir);
  return {
    valid: result.issues.every((item) => item.level !== "error"),
    issues: result.issues,
    packs: result.counted ? 1 : 0,
  };
}

function runResolve(
  fileArg: string,
  options: Record<string, string | boolean>,
): ValidationResult {
  const date = options.date;
  if (typeof date !== "string") return fail("resolve requires --date YYYY-MM-DD.");
  const semantic = options.semantic;
  const tax = options.tax;
  const treatment = options.treatment;
  if (semantic !== undefined && typeof semantic !== "string") {
    return fail("Missing value for --semantic.");
  }
  if (typeof semantic === "string" && !isSemanticCode(semantic)) {
    return fail(
      `Unknown semantic code "${semantic}". Expected one of: ${SEMANTIC_CODES.join(", ")}.`,
    );
  }
  if (tax !== undefined && typeof tax !== "string") return fail("Missing value for --tax.");
  if (treatment !== undefined && typeof treatment !== "string") {
    return fail("Missing value for --treatment.");
  }

  const file = resolve(fileArg);
  if (!existsSync(file) || !statSync(file).isFile()) return fail(`Regime file not found: ${file}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not read regime.json.");
  }
  if (!isRegime(parsed)) return fail("Expected a regime object with a taxes array.");

  try {
    const rows = resolveTaxAtDate(parsed, {
      date,
      ...(typeof tax === "string" ? { taxId: tax } : {}),
      ...(typeof treatment === "string" ? { treatmentId: treatment } : {}),
      ...(typeof semantic === "string" ? { semanticCode: semantic } : {}),
    });
    console.log(JSON.stringify(rows, null, 2));
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not resolve treatments.");
  }
}

export function runCli(argv: readonly string[]): ValidationResult {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not parse arguments.");
  }

  if (
    parsed.options.help !== undefined ||
    parsed.options.h !== undefined ||
    parsed.positionals[0] === "help"
  ) {
    console.log(HELP);
    return ok();
  }
  if (parsed.options.version !== undefined || parsed.options.v !== undefined) {
    try {
      console.log(readOwnPackageVersion());
      return ok();
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Could not read version.");
    }
  }

  const command = parsed.positionals[0];
  const rest = parsed.positionals.slice(1);
  if (command === undefined || command === "validate") {
    const unknown = unknownOption(parsed.options, []);
    if (unknown) return unknown;
    if (rest.length > 1) return fail("validate accepts at most one path.");
    return runValidate(rest[0]);
  }
  if (command === "resolve") {
    const unknown = unknownOption(parsed.options, ["date", "semantic", "tax", "treatment"]);
    if (unknown) return unknown;
    const file = rest[0];
    if (rest.length !== 1 || file === undefined) {
      return fail("resolve requires the path to regime.json.");
    }
    return runResolve(file, parsed.options);
  }
  console.error(`Unknown command "${command}".\n\n${HELP}`);
  return {
    valid: false,
    issues: [{ level: "error", path: "/", message: `Unknown command "${command}".` }],
  };
}

export function main(argv: readonly string[] = process.argv.slice(2)): ValidationResult {
  return runCli(argv);
}

if (isDirectRun()) {
  const report = main();
  if (!report.valid) process.exitCode = 1;
}
