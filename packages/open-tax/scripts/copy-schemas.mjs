import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "../../../schemas");
const destination = join(here, "../schemas");

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
