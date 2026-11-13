import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { diffPolicyChanges, getSchemas, resolveTaxAtDate, validatePack } from "../dist/index.js";

const require = createRequire(import.meta.url);
const cjs = require("../dist/index.cjs");

for (const name of ["validatePack", "resolveTaxAtDate", "diffPolicyChanges", "getSchemas"]) {
  if (typeof cjs[name] !== "function") {
    throw new Error(`CJS build is missing ${name}.`);
  }
}

const schemas = getSchemas();
for (const name of ["regime", "policyDiff", "dictionaryEntry"]) {
  if (!schemas[name] || typeof schemas[name] !== "object") {
    throw new Error(`Schema bundle is missing ${name}.`);
  }
}

if (validatePack === cjs.validatePack) {
  throw new Error("ESM and CJS exports should be separate module instances.");
}

void resolveTaxAtDate;
void diffPolicyChanges;

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const repoRoot = join(here, "../../..");
const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
if (packageJson.bin?.["open-tax"] !== "dist/cli.js") {
  throw new Error(`bin.open-tax should be dist/cli.js, got ${packageJson.bin?.["open-tax"]}.`);
}

const cli = join(packageRoot, "dist/cli.js");
function firstLine(name) {
  return readFileSync(join(packageRoot, "dist", name), "utf8").split("\n", 1)[0];
}
if (firstLine("cli.js") !== "#!/usr/bin/env node") {
  throw new Error(`dist/cli.js is missing the node shebang (got ${JSON.stringify(firstLine("cli.js"))}).`);
}
for (const name of ["index.js", "index.cjs", "index.d.ts", "index.d.cts"]) {
  if (firstLine(name).startsWith("#!")) {
    throw new Error(`dist/${name} should not start with a shebang.`);
  }
}
if ((statSync(cli).mode & 0o111) === 0) {
  throw new Error("dist/cli.js is not executable.");
}

const help = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
if (help.status !== 0 || !help.stdout.includes("open-tax validate [path]")) {
  throw new Error(`node dist/cli.js --help failed.\n${help.stdout}\n${help.stderr}`);
}

const validated = spawnSync(process.execPath, [cli, "validate", "."], {
  encoding: "utf8",
  cwd: repoRoot,
});
if (validated.status !== 0 || !validated.stdout.includes("0 error(s)")) {
  throw new Error(`node dist/cli.js validate . failed.\n${validated.stdout}\n${validated.stderr}`);
}

const linkDir = mkdtempSync(join(tmpdir(), "open-tax-dist-"));
const link = join(linkDir, "open-tax");
symlinkSync(cli, link);
try {
  const direct = spawnSync(link, ["--version"], { encoding: "utf8" });
  if (direct.status !== 0 || direct.stdout.trim() !== packageJson.version) {
    throw new Error(
      `symlink open-tax --version failed.\nstatus ${direct.status}\n${direct.stdout}\n${direct.stderr}`,
    );
  }
  const viaNode = spawnSync(process.execPath, [link, "--version"], { encoding: "utf8" });
  if (viaNode.status !== 0 || viaNode.stdout.trim() !== packageJson.version) {
    throw new Error(
      `node <symlink> --version failed.\nstatus ${viaNode.status}\n${viaNode.stdout}\n${viaNode.stderr}`,
    );
  }
} finally {
  rmSync(linkDir, { recursive: true, force: true });
}

console.log("packaging ok");
