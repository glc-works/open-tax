import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDirectRun, main, runCli } from "../src/cli.js";
import type { ValidationResult } from "../src/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const cliSource = join(here, "../src/cli.ts");
const regimePath = join(repoRoot, "packs/id/regime.json");
const packageVersion = (
  JSON.parse(readFileSync(join(here, "../package.json"), "utf8")) as { version: string }
).version;

function capture(run: () => ValidationResult): {
  result: ValidationResult;
  logs: string[];
  errs: string[];
} {
  const logs: string[] = [];
  const errs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...args: unknown[]) => {
    logs.push(args.map((item) => String(item)).join(" "));
  };
  console.error = (...args: unknown[]) => {
    errs.push(args.map((item) => String(item)).join(" "));
  };
  try {
    return { result: run(), logs, errs };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

function summary(logs: string[]): string {
  return logs.at(-1) ?? "";
}

function runProcess(script: string, args: string[], cwd = repoRoot) {
  return spawnSync(process.execPath, ["--import", "tsx", script, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("the test runner is not a direct CLI run", () => {
  assert.equal(isDirectRun(), false);
  assert.equal(isDirectRun(undefined), false);
});

test("isDirectRun follows symlinks to the CLI file", () => {
  const dir = mkdtempSync(join(tmpdir(), "open-tax-cli-"));
  const link = join(dir, "open-tax");
  const relativeLink = join(dir, "linked-cli.ts");
  symlinkSync(cliSource, link);
  symlinkSync(relative(dir, cliSource), relativeLink);
  try {
    const moduleUrl = pathToFileURL(cliSource).href;
    assert.equal(isDirectRun(link, moduleUrl), true);
    assert.equal(isDirectRun(cliSource, moduleUrl), true);
    assert.equal(isDirectRun(relativeLink, moduleUrl), true);
    assert.equal(isDirectRun(link, import.meta.url), false);
    assert.equal(isDirectRun(join(dir, "missing"), moduleUrl), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("help and version flags", () => {
  for (const argv of [["--help"], ["-h"], ["help"], ["validate", "--help"]]) {
    const captured = capture(() => runCli(argv));
    assert.equal(captured.result.valid, true, argv.join(" "));
    assert.match(captured.logs.join("\n"), /open-tax validate \[path\]/);
    assert.match(captured.logs.join("\n"), /--date <date>/);
    assert.match(captured.logs.join("\n"), /not a filing position/);
    assert.equal(captured.errs.length, 0);
  }

  for (const argv of [["--version"], ["-v"], ["validate", "-v"]]) {
    const captured = capture(() => runCli(argv));
    assert.equal(captured.result.valid, true, argv.join(" "));
    assert.deepEqual(captured.logs, [packageVersion]);
    assert.equal(captured.errs.length, 0);
  }
});

test("main() with no arguments validates the repository from the working directory", () => {
  const previous = process.cwd();
  try {
    process.chdir(join(repoRoot, "packs/id"));
    const captured = capture(() => main([]));
    assert.equal(captured.result.valid, true, captured.logs.join("\n"));
    assert.match(summary(captured.logs), /Validated [2-9]\d* pack\(s\), 0 error\(s\)/);
    assert.ok(captured.result.issues);
  } finally {
    process.chdir(previous);
  }
});

test("validate accepts a repository root, a pack folder, and regime.json", () => {
  const targets = [
    repoRoot,
    join(repoRoot, "packs/id"),
    regimePath,
    join(repoRoot, "packs/_template"),
  ];
  for (const target of targets) {
    const captured = capture(() => runCli(["validate", target]));
    assert.equal(captured.result.valid, true, `${target}\n${captured.logs.join("\n")}`);
    assert.match(summary(captured.logs), /0 error\(s\)/);
  }

  const repository = capture(() => runCli(["validate", repoRoot]));
  assert.match(summary(repository.logs), /Validated [2-9]\d* pack\(s\)/);
  const onePack = capture(() => runCli(["validate", join(repoRoot, "packs/id")]));
  assert.match(summary(onePack.logs), /Validated 1 pack\(s\)/);
});

test("validate rejects a missing path, a non-pack file, and extra arguments", () => {
  const missing = capture(() => runCli(["validate", join(repoRoot, "packs/missing")]));
  assert.equal(missing.result.valid, false);
  assert.match(missing.errs.join("\n"), /Path not found:/);

  const readme = capture(() => runCli(["validate", join(repoRoot, "README.md")]));
  assert.equal(readme.result.valid, false);
  assert.match(readme.errs.join("\n"), /regime\.json/);

  const extra = capture(() => runCli(["validate", repoRoot, "packs/id"]));
  assert.equal(extra.result.valid, false);
  assert.match(extra.errs.join("\n"), /at most one path/);

  const unknown = capture(() => runCli(["validate", "--date", "2025-01-01"]));
  assert.equal(unknown.result.valid, false);
  assert.match(unknown.errs.join("\n"), /Unknown option --date/);

  const dir = mkdtempSync(join(tmpdir(), "open-tax-bad-pack-"));
  try {
    writeFileSync(join(dir, "regime.json"), "{}\n");
    const invalid = capture(() => runCli(["validate", join(dir, "regime.json")]));
    assert.equal(invalid.result.valid, false);
    assert.match(summary(invalid.logs), /1 pack\(s\), [1-9]\d* error\(s\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolve prints the treatments in force and does not evaluate formulas", () => {
  const captured = capture(() =>
    runCli([
      "resolve",
      regimePath,
      "--date",
      "2025-06-01",
      "--treatment",
      "ppn-standard",
    ]),
  );
  assert.equal(captured.result.valid, true, captured.errs.join("\n"));
  assert.equal(captured.logs.length, 1);
  const rows = JSON.parse(captured.logs[0] ?? "null") as Array<{
    versionId: string;
    rate: { value?: string; base_formula?: string; statutory_value?: string };
  }>;
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.versionId, "ppn-standard-12-dpp");
  assert.equal(rows[0]?.rate.value, "0.11");
  assert.equal(rows[0]?.rate.statutory_value, "0.12");
  assert.equal(rows[0]?.rate.base_formula, "11/12 * (nilai impor | harga jual | penggantian)");

  const luxury = capture(() =>
    runCli(["resolve", regimePath, "--tax", "ppn", "--date=2025-01-15", "--semantic", "luxury"]),
  );
  assert.equal(luxury.result.valid, true, luxury.errs.join("\n"));
  const luxuryRows = JSON.parse(luxury.logs[0] ?? "null") as Array<{ versionId: string }>;
  assert.deepEqual(
    luxuryRows.map((row) => row.versionId).sort(),
    ["ppn-luxury-12", "ppn-luxury-fc-dpp"],
  );

  const taxed = capture(() =>
    runCli(["resolve", regimePath, "--tax", "ppn", "--date", "2025-06-01"]),
  );
  const taxedRows = JSON.parse(taxed.logs[0] ?? "null") as Array<{ taxId: string }>;
  assert.ok(taxedRows.length > 1);
  assert.ok(taxedRows.every((row) => row.taxId === "ppn"));

  const empty = capture(() =>
    runCli([
      "resolve",
      regimePath,
      "--date",
      "2025-06-01",
      "--treatment",
      "ppn-standard",
      "--semantic",
      "zero",
    ]),
  );
  assert.equal(empty.result.valid, true);
  assert.deepEqual(empty.logs, ["[]"]);
});

test("resolve reports usage errors and an invalid calendar date", () => {
  const missingDate = capture(() => runCli(["resolve", regimePath]));
  assert.equal(missingDate.result.valid, false);
  assert.match(missingDate.errs.join("\n"), /--date YYYY-MM-DD/);

  const badDate = capture(() => runCli(["resolve", regimePath, "--date", "2024-02-31"]));
  assert.equal(badDate.result.valid, false);
  assert.match(badDate.errs.join("\n"), /YYYY-MM-DD/);

  const badCode = capture(() =>
    runCli(["resolve", regimePath, "--date", "2025-06-01", "--semantic", "super_luxury"]),
  );
  assert.equal(badCode.result.valid, false);
  assert.match(badCode.errs.join("\n"), /Unknown semantic code "super_luxury"/);

  const missingValue = capture(() => runCli(["resolve", regimePath, "--date"]));
  assert.equal(missingValue.result.valid, false);
  assert.match(missingValue.errs.join("\n"), /Missing value for --date/);

  const noFile = capture(() => runCli(["resolve", "--date", "2025-06-01"]));
  assert.equal(noFile.result.valid, false);
  assert.match(noFile.errs.join("\n"), /requires the path to regime\.json/);

  const unknown = capture(() => runCli(["nope"]));
  assert.equal(unknown.result.valid, false);
  assert.match(unknown.errs.join("\n"), /Unknown command "nope"/);
  assert.match(unknown.errs.join("\n"), /open-tax validate \[path\]/);
});

test("a direct run and a symlink both execute help, version, validate, and resolve", () => {
  const help = runProcess(cliSource, ["--help"]);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /open-tax validate \[path\]/);
  assert.equal(help.stderr, "");

  const dir = mkdtempSync(join(tmpdir(), "open-tax-bin-"));
  const link = join(dir, "cli.ts");
  symlinkSync(cliSource, link);
  try {
    const version = runProcess(link, ["--version"]);
    assert.equal(version.status, 0, version.stderr);
    assert.equal(version.stdout, `${packageVersion}\n`);

    const validated = runProcess(link, ["validate", repoRoot]);
    assert.equal(validated.status, 0, validated.stderr);
    assert.match(validated.stdout, /Validated [2-9]\d* pack\(s\), 0 error\(s\)/);

    const resolved = runProcess(cliSource, [
      "resolve",
      regimePath,
      "--date",
      "2025-06-01",
      "--treatment",
      "ppn-standard",
    ]);
    assert.equal(resolved.status, 0, resolved.stderr);
    const rows = JSON.parse(resolved.stdout) as Array<{ versionId: string }>;
    assert.equal(rows[0]?.versionId, "ppn-standard-12-dpp");

    const failed = runProcess(link, ["resolve", regimePath, "--date", "2024-02-31"]);
    assert.equal(failed.status, 1);
    assert.equal(failed.stdout, "");
    assert.match(failed.stderr, /YYYY-MM-DD/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
