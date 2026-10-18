/** Replay frozen captures against an unmodified Git archive in an offline workerd. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { extractContentResponses, validateContentReport } from "./reading-content-comparison.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(new URL("../package.json", import.meta.url));

export async function replayContentReportInWorkerd(report, { plan, arm, workerd }) {
  validateContentReport(report, { plan, arm });
  const responses = extractContentResponses(report, { plan, arm });
  if (!workerd || !/^[a-f0-9]{40}$/.test(plan.sourceSha))
    throw Error("Workerd replay needs a local workerd executable and exact archived source SHA");
  const binary = resolve(workerd);
  const workerdVersion = execFileSync(binary, ["--version"], { encoding: "utf8" }).trim();
  const directory = await mkdtemp(join(tmpdir(), "pattern-exact-workerd-"));
  try {
    const archived = join(directory, "source");
    await mkdir(archived);
    const archivedPaths = ["src", "package.json", "bun.lock", "tsconfig.json"];
    const archive = execFileSync(
      "git",
      ["archive", "--format=tar", plan.sourceSha, ...archivedPaths],
      {
        cwd: root,
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    execFileSync("tar", ["-x", "-C", archived], { input: archive });
    const lock = await readFile(join(archived, "bun.lock"));
    if (digest(lock) !== digest(await readFile(join(root, "bun.lock"))))
      throw Error("The archived dependency lock differs; install its dependencies before replay");
    const source = `
import assert from "node:assert/strict";
import process from "node:process";
import { revalidateContentComparisonPlan } from "./src/lib/ai/content-comparison-plan.server.ts";
import { runSyntheticEvaluationCase } from "./src/lib/ai/reading-evaluation.server.ts";
const plan = ${JSON.stringify(plan)};
const report = ${JSON.stringify(report)};
const responses = ${JSON.stringify(responses)};
const arm = ${JSON.stringify(arm)};
export default { async test() {
  process.env.GEMINI_ENTERPRISE_API_KEY = "offline-captured-response";
  process.env.LOVABLE_API_KEY = "offline-captured-response";
  revalidateContentComparisonPlan(plan, plan.sourceSha, plan.provider);
  let current, replayed = 0;
  globalThis.fetch = async (url, init = {}) => {
    const enterprise = plan.provider === "gemini-enterprise";
    const expected = enterprise
      ? "https://aiplatform.googleapis.com/v1/projects/river-bruin-511100-g8/locations/global/publishers/google/models/gemini-3.8-flash:generateContent"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    assert.equal(String(url), expected, "Unrecorded network destination");
    assert.equal(init.method, "POST");
    assert.ok(current && replayed < 4, "Unexpected extra request");
    replayed++;
    return enterprise
      ? Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(current) }] }, finishReason: "STOP" }], modelVersion: "gemini-3.8-flash" })
      : Response.json({ choices: [{ message: { content: JSON.stringify(current) }, finish_reason: "stop" }], model: "google/gemini-3.8-flash" });
  };
  const rows = [];
  for (const original of report.cases) {
    current = responses[original.id];
    const result = await runSyntheticEvaluationCase(original.id, plan.bundles[arm], plan.provider, undefined, { boundedQualification: true }, plan.caseSetId);
    const row = result.case;
    assert.deepEqual(row.request, original.request, original.id + " request changed");
    assert.deepEqual(row.facts, original.facts, original.id + " source facts changed");
    assert.deepEqual(row.candidate, original.candidate, original.id + " capture changed");
    assert.deepEqual(row.template, original.template, original.id + " template changed");
    assert.deepEqual(row.output, original.output, original.id + " displayed output changed");
    assert.equal(row.diagnostics.outcome, original.diagnostics.outcome);
    assert.equal(row.diagnostics.code, original.diagnostics.code);
    rows.push(row);
  }
  assert.equal(replayed, 4);
  console.log("PATTERN_WORKERD_REPLAY_RESULT:" + JSON.stringify({
    version: "content-workerd-replay-1",
    source: "source-report-replay",
    sourceReportIdentity: { pairHash: plan.hash, arm, sourceSha: plan.sourceSha, runPlanHash: report.runPlanHash },
    cases: rows,
    summary: { modelAttempts: 0, capturedResponsesReplayed: replayed },
    sourceComparison: { cases: rows.length, matchingRequests: rows.length, matchingOutputs: rows.length, matchingOutcomes: rows.length, differences: [] },
    qualified: false,
    warning: "Offline reproduction of historical captures; no new writing qualification or human approval. The original failed Node replay remains historical evidence."
  }));
} };
`;
    const entry = join(archived, "replay-entry.mjs");
    await writeFile(entry, source);
    const { build, version: esbuildVersion } = require("esbuild");
    const built = await build({
      absWorkingDir: archived,
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: "esm",
      platform: "node",
      target: "es2022",
      nodePaths: [join(root, "node_modules")],
      external: ["node:*"],
      logLevel: "silent",
    });
    const module = built.outputFiles[0].text;
    await writeFile(join(directory, "main.js"), module);
    // No sockets or external services: even an un-intercepted fetch or node socket
    // cannot escape the worker. Only the in-memory response handler supplies text.
    await writeFile(
      join(directory, "config.capnp"),
      `using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
  (name = "main", worker = (
    modules = [(name = "main.js", esModule = embed "main.js")],
    compatibilityDate = "2026-10-06", compatibilityFlags = ["nodejs_compat"],
    globalOutbound = "deny"
  )),
  (name = "deny", network = (allow = []))
]);
`,
    );
    const output = execFileSync(binary, ["test", join(directory, "config.capnp")], {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 60_000,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });
    const prefix = "PATTERN_WORKERD_REPLAY_RESULT:";
    const line = output.split("\n").find((value) => value.startsWith(prefix));
    if (!line) throw Error("Workerd produced no verified replay result");
    return {
      ...JSON.parse(line.slice(prefix.length)),
      replayRuntime: {
        kind: "archived-git-workerd",
        sourceSha: plan.sourceSha,
        archivedPaths,
        sourceArchiveSha256: digest(archive),
        dependencyLockSha256: digest(lock),
        harnessSha256: digest(source),
        bundledModuleSha256: digest(module),
        workerdVersion,
        esbuildVersion,
        compatibilityDate: "2026-10-06",
        network: "denied by workerd configuration; fetch intercepted in memory",
      },
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
