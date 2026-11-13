import { chmodSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "../dist");

function firstLine(name) {
  return readFileSync(join(dist, name), "utf8").split("\n", 1)[0];
}

const cliLine = firstLine("cli.js");
if (cliLine !== "#!/usr/bin/env node") {
  throw new Error(
    `dist/cli.js must start with "#!/usr/bin/env node" (got ${JSON.stringify(cliLine)}).`,
  );
}

for (const name of ["index.js", "index.cjs", "index.d.ts", "index.d.cts"]) {
  const line = firstLine(name);
  if (line.startsWith("#!")) {
    throw new Error(`dist/${name} must not start with a shebang.`);
  }
}

chmodSync(join(dist, "cli.js"), 0o755);
