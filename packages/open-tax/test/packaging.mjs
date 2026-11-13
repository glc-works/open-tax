import { createRequire } from "node:module";
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
console.log("packaging ok");
