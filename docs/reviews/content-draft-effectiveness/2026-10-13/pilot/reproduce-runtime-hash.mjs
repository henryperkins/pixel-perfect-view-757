/** Read-only diagnosis against the exact pilot commit; no model, network, or application writes. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workerd = process.argv[2];
if (!workerd) throw Error("Usage: node reproduce-runtime-hash.mjs /absolute/path/to/workerd");
const here = dirname(fileURLToPath(import.meta.url));
const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: here,
  encoding: "utf8",
}).trim();
const pair = JSON.parse(await readFile(join(here, "frozen-pair.json"), "utf8"));
const sourceSha = pair.sourceSha;
if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw Error("Invalid archived source SHA");
const source = (path) =>
  execFileSync("git", ["show", `${sourceSha}:${path}`], { cwd: repo, encoding: "utf8" });
const analytic = source("src/lib/ai/reading-evaluation.transit.fixtures.mjs").replace(
  "export function",
  "function",
);
const fixtures = source("src/lib/ai/reading-evaluation.fixtures.mjs")
  .replace(/^import .*;\n/gm, "")
  .replace(/export const /g, "const ");
const joined = `${analytic}\n${fixtures}\n`;
const moduleURL = `data:text/javascript;base64,${Buffer.from(`${joined}export { READING_EVAL_CASES };`).toString("base64")}`;
const { READING_EVAL_CASES } = await import(moduleURL);
const projected = READING_EVAL_CASES.filter((f) => f.transitEpisodeScan);
const local = projected.map((f) => ({ scan: f.transitEpisodeScan, anchor: f.transitAnchor }));
const directory = await mkdtemp(join(tmpdir(), "pattern-fixture-runtime-"));
await writeFile(
  join(directory, "main.js"),
  `${joined}
export default { async test() {
  const scans = READING_EVAL_CASES.filter(f => f.transitEpisodeScan)
    .map(f => ({ scan: f.transitEpisodeScan, anchor: f.transitAnchor }));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(scans)));
  console.log(JSON.stringify({ hash: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join(""), scans }));
} };
`,
);
await writeFile(
  join(directory, "config.capnp"),
  `using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [(name = "main", worker = (
    modules = [(name = "main.js", esModule = embed "main.js")],
    compatibilityDate = "2026-10-06"
  ))]
);
`,
);
const output = execFileSync(workerd, ["test", join(directory, "config.capnp")], {
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
const line = output.split("\n").find((item) => item.startsWith('{"hash"'));
if (!line) throw Error("workerd did not return the fixture projection");
const worker = JSON.parse(line);
const differences = [];
function compare(a, b, path = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") {
    differences.push({ path, node: a, workerd: b });
    return;
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
    compare(a[key], b[key], `${path}.${key}`);
}
compare(local, worker.scans);
console.log(
  JSON.stringify(
    {
      sourceSha,
      nodeVersion: process.version,
      v8Version: process.versions.v8,
      workerdVersion: execFileSync(workerd, ["--version"], { encoding: "utf8" }).trim(),
      nodeHash: createHash("sha256").update(JSON.stringify(local)).digest("hex"),
      workerdHash: worker.hash,
      liveTransitFixtureHash: pair.arms.baseline.metadata.transitFixtureHash,
      workerdMatchesLive: worker.hash === pair.arms.baseline.metadata.transitFixtureHash,
      projectionCaseIds: projected.map((fixed) => fixed.id),
      differences,
      replayPassed: false,
      providerCalls: 0,
      note: "Fixture-hash diagnosis only. This does not replay captured responses or qualify the pilot.",
    },
    null,
    2,
  ),
);
