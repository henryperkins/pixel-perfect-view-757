/** Current delivery is authored; the completed paid Flash campaign has a separate archive check. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareEditorialMemberDelivery } from "./editorial-member-delivery.mjs";
import {
  EDITORIAL_RELEASE_DIRECTORY,
  verifyEditorialReleaseArchive,
} from "./editorial-release-archive.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const [mode, flag, directory] = process.argv.slice(2);
assert.ok(
  ["--prepare", "--verify", "--verify-archive", "--run"].includes(mode) &&
    (process.argv.length === 3 ||
      (["--prepare", "--verify"].includes(mode) &&
        flag === "--output-dir" &&
        directory &&
        process.argv.length === 5)),
  "Usage: node scripts/validate-editorial-release.mjs --prepare|--verify [--output-dir DIRECTORY] | --verify-archive",
);
if (mode === "--run")
  throw Error(
    "The five-attempt Flash campaign is closed. Current release delivery is authored and needs zero provider requests. Use --prepare/--verify for current delivery or --verify-archive for historical evidence.",
  );

if (mode === "--verify-archive") {
  console.log(JSON.stringify(await verifyEditorialReleaseArchive(root)));
} else {
  const output = resolve(
    root,
    directory ?? `${EDITORIAL_RELEASE_DIRECTORY}/member-delivery-validation`,
  );
  const plan = await prepareEditorialMemberDelivery(root);
  if (mode === "--prepare") {
    // Exclusive creation preserves both completed campaigns and previous offline freezes.
    await mkdir(output, { recursive: false });
    await writeFile(resolve(output, "plan.json"), JSON.stringify(plan, null, 2) + "\n", {
      flag: "wx",
    });
  } else {
    assert.deepEqual(
      JSON.parse(await readFile(resolve(output, "plan.json"), "utf8")),
      plan,
      "Current member policy, runtime or delivery changed; prepare a new offline output directory. The historical Flash campaign is checked with --verify-archive.",
    );
  }
  console.log(
    JSON.stringify({
      status: mode === "--prepare" ? "prepared-current-delivery" : "verified-current-delivery",
      planHash: plan.hash,
      cases: plan.cases.length,
      providerAttempts: plan.providerAttempts,
      output,
    }),
  );
}
