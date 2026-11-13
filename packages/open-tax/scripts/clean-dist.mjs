import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// tsup runs the library and CLI configs at the same time. A `clean: true`
// on either config deletes `dist` while the other build is writing it.
rmSync(join(dirname(fileURLToPath(import.meta.url)), "../dist"), {
  recursive: true,
  force: true,
});
