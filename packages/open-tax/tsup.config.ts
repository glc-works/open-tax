import { defineConfig } from "tsup";

// `clean` stays false. scripts/clean-dist.mjs removes `dist` once before
// tsup starts, because these two configs run at the same time.
export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    outDir: "dist",
    external: ["ajv"],
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    outDir: "dist",
    external: ["ajv"],
    banner: {
      js: "#!/usr/bin/env node\n",
    },
  },
]);
