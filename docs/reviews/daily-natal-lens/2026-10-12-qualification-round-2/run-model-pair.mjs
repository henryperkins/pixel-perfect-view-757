/**
 * Direct local production-module synthetic evaluation; never a hosted/admin-auth check.
 * No env files are loaded here. Configure GEMINI_ENTERPRISE_API_KEY in the process.
 * Every --run is a new paid round: no retries, overwrites, or resume facility.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(SCRIPT_PATH), "../../../..");
const EXPECTED_REVISION = "8b73148241adbe38d9e1f2e58e34e241314a92dd";
const PROVIDER = "gemini-enterprise";
const SOURCES = ["builtin", "natal-candidate"];
const MAX_ATTEMPTS = 74;
const HALT_CODES = new Set(["auth", "credit", "rate_limit", "not_configured", "network", "http"]);
const SOURCE_PATHS = ["src", "scripts", "package.json", "bun.lock", "pnpm-lock.yaml", "package-lock.json", "tsconfig.json"];
const USAGE_FIELDS = ["promptTokenCount", "candidatesTokenCount", "totalTokenCount", "thoughtsTokenCount", "cachedContentTokenCount", "toolUsePromptTokenCount"];
const now = () => new Date().toISOString();
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const git = (...args) => execFileSync("git", args, { cwd: PROJECT_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const fail = (code) => { throw Object.assign(new Error(code), { runnerCode: code }); };
const boundedError = (error) => error?.runnerCode ?? "runner_error";
const writeNew = (path, value) => writeFile(path, json(value), { flag: "wx", mode: 0o600 });

function options() {
  const args = process.argv.slice(2);
  const modes = args.filter((arg) => ["--dry-plan", "--preflight", "--run"].includes(arg));
  if (modes.length !== 1) fail("choose_exactly_one_mode_dry_plan_preflight_or_run");
  let outputDir = null;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--output-dir" && args[index + 1] && !args[index + 1].startsWith("--")) {
      if (outputDir) fail("duplicate_output_directory");
      outputDir = resolve(args[++index]);
    } else if (!modes.includes(args[index])) fail("unknown_option");
  }
  if (modes[0] === "--run" && !outputDir) fail("run_requires_new_output_directory");
  return { mode: modes[0], outputDir };
}

async function sourceSnapshot() {
  const revision = git("rev-parse", "HEAD").trim();
  if (revision !== EXPECTED_REVISION) fail("unexpected_generating_revision");
  try { git("diff", "--quiet", "HEAD", "--", ...SOURCE_PATHS); }
  catch { fail("tracked_source_differs_from_generating_revision"); }
  const paths = git("ls-files", "-z", "--", ...SOURCE_PATHS).split("\0").filter(Boolean).sort();
  if (!paths.length) fail("empty_tracked_source_inventory");
  const files = [];
  for (const path of paths) files.push({ path, sha256: digest(await readFile(join(PROJECT_ROOT, path))) });
  return {
    sourceRevision: revision,
    trackedSourceFiles: files,
    trackedSourceSha256: digest(json(files)),
    runnerSha256: digest(await readFile(SCRIPT_PATH)),
  };
}

async function unchanged(initial) {
  let current;
  try { current = await sourceSnapshot(); }
  catch { fail("source_changed"); }
  if (current.trackedSourceSha256 !== initial.trackedSourceSha256 || current.runnerSha256 !== initial.runnerSha256) fail("source_changed");
}

async function newDirectory(path) {
  if (!path) return;
  try { await access(path); }
  catch (error) { if (error.code === "ENOENT") return; throw error; }
  fail("output_directory_already_exists_no_resume_or_overwrite");
}

function observedMetadata(payload) {
  const usage = {};
  for (const field of USAGE_FIELDS) {
    const value = payload?.usageMetadata?.[field];
    if (Number.isSafeInteger(value) && value >= 0) usage[field] = value;
  }
  const modelVersion = payload?.modelVersion;
  return {
    modelVersion: typeof modelVersion === "string" && /^[a-zA-Z0-9._:/-]{1,120}$/.test(modelVersion) ? modelVersion : null,
    usageMetadata: Object.keys(usage).length ? usage : null,
  };
}

async function main() {
  const { mode, outputDir } = options();
  await newDirectory(outputDir);
  const configured = Boolean(process.env.GEMINI_ENTERPRISE_API_KEY);
  if (mode !== "--dry-plan" && !configured) fail("gemini_enterprise_key_not_configured_no_calls_made");
  const initial = await sourceSnapshot();
  const originalFetch = globalThis.fetch;
  let vite;
  let active = null;
  let transportAttempts = 0;
  let startedModelCases = 0;
  let stopRequested = false;
  let haltReason = null;
  let sequence = 0;
  const stop = () => { stopRequested = true; };
  const results = Object.fromEntries(SOURCES.map((source) => [source, []]));
  const reports = {};
  const evidence = [];
  let executionContext;
  let outputCreated = false;

  // Imports/preflight have no permitted transport. During a case only the exact
  // production Enterprise POST is allowed, with its original init and signal.
  globalThis.fetch = async (url, init) => {
    if (!active || String(url) !== active.endpoint || init?.method !== "POST") fail("unexpected_transport_blocked");
    await unchanged(initial);
    if (active.transports.length || transportAttempts >= MAX_ATTEMPTS) {
      active.policyViolation = true;
      fail("attempt_limit_or_repeated_case_transport_blocked");
    }
    const receipt = { startedAt: now(), httpStatus: null, modelVersion: null, usageMetadata: null, observation: "pending" };
    active.transports.push(receipt);
    transportAttempts += 1;
    try {
      const response = await originalFetch(url, init);
      receipt.httpStatus = response.status;
      if (response.ok) {
        // Return the original response immediately. A clone observes only the
        // successful response's bounded model/usage fields, never headers/errors.
        try {
          const observation = response.clone().json().then((payload) => {
            Object.assign(receipt, observedMetadata(payload), { observation: "observed" });
          }).catch(() => { receipt.observation = "metadata_unavailable"; });
          active.observations.push(observation);
        } catch { receipt.observation = "metadata_unavailable"; }
      } else receipt.observation = "http_failure_body_not_observed";
      return response;
    } catch (error) {
      receipt.observation = "fetch_failed_usage_unknown";
      throw error;
    }
  };

  try {
    const projectRequire = createRequire(join(PROJECT_ROOT, "package.json"));
    const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
    vite = await createServer({
      root: PROJECT_ROOT, configFile: false, envFile: false, appType: "custom", logLevel: "error",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const load = (path) => vite.ssrLoadModule(path);
    const fixtures = await load("/src/lib/ai/reading-evaluation.fixtures.mjs");
    const diagnostics = await load("/src/lib/ai/diagnostics.ts");
    const runner = await load("/src/lib/ai/reading-evaluation.server.ts");
    const shared = await load("/src/lib/ai/reading-evaluation.shared.ts");
    const { DEFAULT_BUNDLE } = await load("/src/lib/content/default-bundle.ts");
    const { NATAL_CANDIDATE_BUNDLE, transitCopyIdentity } = await load("/src/lib/content/natal-candidate-bundle.ts");
    const cases = fixtures.READING_EVAL_CASES;
    if (fixtures.READING_EVAL_FIXTURE_VERSION !== "synthetic-daily-6" || cases.length !== 38 || cases.filter((row) => row.id === "quiet-threshold").length !== 1) fail("unexpected_fixed_case_inventory");
    if (diagnostics.DAILY_PROMPT_VERSION !== "daily-astro-body-10" || diagnostics.DAILY_VALIDATOR_VERSION !== "daily-reference-6" || diagnostics.DAILY_GATEWAY_TIMEOUT_MS !== 60_000 || diagnostics.GEMINI_ENTERPRISE_MODEL !== "gemini-3.8-flash") fail("unexpected_model_or_policy_identity");
    if (typeof runner.runSyntheticEvaluationCase !== "function" || typeof shared.combineReadingEvaluationResults !== "function") fail("production_evaluation_exports_missing");
    if (digest(JSON.stringify(transitCopyIdentity(DEFAULT_BUNDLE))) !== digest(JSON.stringify(transitCopyIdentity(NATAL_CANDIDATE_BUNDLE)))) fail("unmatched_transit_copy");
    const bundles = { builtin: DEFAULT_BUNDLE, "natal-candidate": NATAL_CANDIDATE_BUNDLE };
    executionContext = {
      kind: "local-direct-production-module-synthetic-evaluation", projectRoot: PROJECT_ROOT,
      processWorkingDirectory: process.cwd(), nodeVersion: process.version, platform: process.platform, architecture: process.arch,
      moduleLoader: "Vite ssrLoadModule", viteConfigFile: false, viteEnvFile: false, middlewareMode: true,
      entrypoint: "src/lib/ai/reading-evaluation.server.ts#runSyntheticEvaluationCase",
      provider: PROVIDER, declaredModel: diagnostics.languageModel(PROVIDER),
      hostedWorkflowExecuted: false, adminAuthenticationVerified: false, productionVerified: false,
      appServerStarted: false, databaseOrReadingCacheAccessed: false, contentActivated: false,
      cost: "unknown; usage observations do not establish monetary cost",
    };
    await unchanged(initial);
    const plan = {
      mode, configured, sourceRevision: initial.sourceRevision, trackedSourceFiles: initial.trackedSourceFiles.length,
      trackedSourceSha256: initial.trackedSourceSha256, runnerSha256: initial.runnerSha256,
      provider: PROVIDER, model: diagnostics.languageModel(PROVIDER), bundleSources: SOURCES,
      fixtureVersion: fixtures.READING_EVAL_FIXTURE_VERSION, casesPerBundle: cases.length,
      maximumModelAttempts: MAX_ATTEMPTS, retries: 0, resumeSupported: false, executionContext,
    };
    if (mode !== "--run") {
      console.log(json({ ...plan, providerCallsMade: 0, outputDirectoryCreated: false }));
      return;
    }

    await mkdir(outputDir, { recursive: false, mode: 0o700 });
    outputCreated = true;
    await mkdir(join(outputDir, "journal"), { mode: 0o700 });
    await writeNew(join(outputDir, "source-manifest.json"), initial);
    await writeNew(join(outputDir, "run-plan.json"), { ...plan, startedAt: now() });
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    outer: for (const bundleSource of SOURCES) {
      for (const fixed of cases) {
        if (stopRequested) { haltReason = "operator_stop_after_current_case"; break outer; }
        await unchanged(initial);
        sequence += 1;
        const stem = `${String(sequence).padStart(3, "0")}-${bundleSource}-${fixed.id}`;
        const expectedModel = fixed.id !== "quiet-threshold";
        if (expectedModel && ++startedModelCases > MAX_ATTEMPTS) fail("model_case_limit_exceeded");
        await writeNew(join(outputDir, "journal", `${stem}-start.json`), {
          sequence, bundleSource, caseId: fixed.id, provider: PROVIDER, expectedModel, startedAt: now(),
          sourceRevision: initial.sourceRevision, sourceSha256: initial.trackedSourceSha256,
          configHash: digest(JSON.stringify(fixed)), noRetries: true,
        });
        active = {
          endpoint: `https://aiplatform.googleapis.com/v1/publishers/google/models/${diagnostics.GEMINI_ENTERPRISE_MODEL}:generateContent`,
          transports: [], observations: [], policyViolation: false,
        };
        let result;
        try { result = await runner.runSyntheticEvaluationCase(fixed.id, bundles[bundleSource], PROVIDER); }
        finally { await Promise.allSettled(active.observations); }
        const transport = active;
        active = null;
        // The selector is evaluation metadata, never a production pointer change.
        result.metadata.bundleSource = bundleSource;
        results[bundleSource].push(result);
        await writeNew(join(outputDir, "journal", `${stem}-result.json`), result);
        const receipt = { sequence, bundleSource, caseId: fixed.id, settledAt: now(), diagnostics: result.case.diagnostics, transports: transport.transports };
        evidence.push(receipt);
        await writeNew(join(outputDir, "journal", `${stem}-transport.json`), receipt);
        const checkpoint = shared.combineReadingEvaluationResults(results[bundleSource], { partial: true });
        await writeNew(join(outputDir, `${bundleSource}-partial-${String(results[bundleSource].length).padStart(2, "0")}.json`), checkpoint);
        await unchanged(initial);
        if (transport.policyViolation || HALT_CODES.has(result.case.diagnostics.code)) {
          haltReason = transport.policyViolation ? "transport_policy_violation" : result.case.diagnostics.code;
          break outer;
        }
        console.log(json({ sequence, bundleSource, caseId: fixed.id, outcome: result.case.diagnostics.outcome, code: result.case.diagnostics.code, transportAttempts }));
      }
      if (results[bundleSource].length === cases.length) {
        const report = shared.combineReadingEvaluationResults(results[bundleSource]);
        const name = `${bundleSource}-report.json`;
        await writeNew(join(outputDir, name), report);
        const reportSha256 = digest(await readFile(join(outputDir, name)));
        reports[bundleSource] = { report, reportSha256, name };
        await writeNew(join(outputDir, `${bundleSource}-identity.json`), {
          identityVersion: "reading-evaluation-identity-1",
          report: { path: name, sha256: reportSha256, recordedMetadata: Object.fromEntries(Object.entries(report).filter(([key]) => !["cases", "summary"].includes(key))) },
          build: { sourceRevision: initial.sourceRevision, trackedSourceSha256: initial.trackedSourceSha256, runnerSha256: initial.runnerSha256, executionContext },
        });
      }
    }
    await unchanged(initial);
  } catch (error) {
    haltReason = boundedError(error);
    if (!outputCreated) throw error;
  } finally {
    globalThis.fetch = originalFetch;
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    await vite?.close();
  }
  if (outputCreated) {
    await writeNew(join(outputDir, "run-finished.json"), {
      finishedAt: now(), status: haltReason ? "halted" : "complete", haltReason,
      sourceRevision: initial.sourceRevision, trackedSourceSha256: initial.trackedSourceSha256,
      sourceUnchangedThroughout: haltReason !== "source_changed", startedModelCases, transportAttempts,
      completedCases: Object.fromEntries(SOURCES.map((source) => [source, results[source].length])),
      completedReports: Object.fromEntries(Object.entries(reports).map(([source, value]) => [source, { path: value.name, sha256: value.reportSha256 }])),
      unsettledCase: active ? { sequence, transportAttempts: active.transports.length } : null,
      usageObservedCases: evidence.filter((item) => item.transports.some((entry) => entry.usageMetadata)).length,
      cost: "unknown", retries: 0, resumeSupported: false, executionContext,
    });
    console.log(json({ status: haltReason ? "halted" : "complete", haltReason, outputDir, transportAttempts }));
    if (haltReason) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Model-pair runner refused or halted: ${boundedError(error)}`);
  process.exitCode = 1;
});
