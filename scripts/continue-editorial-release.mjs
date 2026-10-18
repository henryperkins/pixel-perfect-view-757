/** The original continuation completed all remaining attempts. It is now read-only evidence. */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { verifyEditorialReleaseArchive } from "./editorial-release-archive.mjs";

assert.ok(process.argv.length === 3, "Usage: node scripts/continue-editorial-release.mjs --verify");
if (process.argv[2] !== "--verify")
  throw Error(
    "The remaining-cases campaign is completed_with_fallbacks and cannot be reopened. Use --verify to check its pinned historical evidence. Current delivery is checked with validate-editorial-release.mjs --prepare/--verify.",
  );
console.log(
  JSON.stringify(
    await verifyEditorialReleaseArchive(fileURLToPath(new URL("../", import.meta.url))),
  ),
);
