import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist", "site");
// Only this generated output directory may be cleared; source assets stay intact.
if (dirname(output) !== resolve(root, "dist")) {
  throw new Error("Unexpected site build output directory");
}
await readFile(resolve(root, "dist/qzone-demo/index.html"));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "public"), output, { recursive: true });
await cp(resolve(root, "public/index.html"), resolve(output, "visits.html"));
await cp(resolve(root, "dist/qzone-demo"), output, { recursive: true });
console.log(
  "Built dist/site: Qzone homepage, legacy visits page, and presence assets.",
);
