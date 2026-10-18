/** The completed paid Flash campaign is verified from its archive and cannot be rerun. */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { verifyEditorialReleaseArchive } from "./editorial-release-archive.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const [mode] = process.argv.slice(2);
assert.ok(
  ["--verify-archive", "--run"].includes(mode) && process.argv.length === 3,
  "Usage: node scripts/validate-editorial-release.mjs --verify-archive",
);
if (mode === "--run")
  throw Error(
    "The five-attempt Flash campaign is closed. Use --verify-archive for historical evidence.",
  );

console.log(JSON.stringify(await verifyEditorialReleaseArchive(root)));
