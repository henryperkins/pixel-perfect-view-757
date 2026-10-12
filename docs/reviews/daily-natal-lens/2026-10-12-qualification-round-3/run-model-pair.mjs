/**
 * Extended local synthetic capture lane; never a hosted/admin-auth or serving-availability check.
 * A recorded Vite-only diagnostics constant transform raises this runner's deadline
 * from 60 seconds to 120 seconds. Native provider functions/payloads stay unchanged.
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
const EXPECTED_REVISION = "948aa00ed8935a6026904461831844a47e98356c";
const PROVIDER = "gemini-enterprise";
const SOURCES = ["builtin", "natal-candidate"];
const MAX_ATTEMPTS = 74;
const SERVING_DEADLINE_MS = 60_000;
const RUNTIME_DEADLINE_MS = 120_000;
const DIAGNOSTICS_MODULE = "src/lib/ai/diagnostics.ts";
const DEADLINE_TRANSFORM_SPEC = Object.freeze({
  kind: "exact-source-substitution",
  module: DIAGNOSTICS_MODULE,
  from: "export const DAILY_GATEWAY_TIMEOUT_MS = 60_000;",
  to: "export const DAILY_GATEWAY_TIMEOUT_MS = 120_000;",
  expectedMatches: 1,
  scope: "this runner's Vite SSR module loader only",
  servingDeadlineMs: SERVING_DEADLINE_MS,
  runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
});
const HALT_CODES = new Set(["auth", "credit", "rate_limit", "not_configured", "network", "http"]);
const SOURCE_PATHS = [
  "src",
  "scripts",
  "package.json",
  "bun.lock",
  "pnpm-lock.yaml",
  "package-lock.json",
  "tsconfig.json",
];
const USAGE_FIELDS = [
  "promptTokenCount",
  "candidatesTokenCount",
  "totalTokenCount",
  "thoughtsTokenCount",
  "cachedContentTokenCount",
  "toolUsePromptTokenCount",
];
const now = () => new Date().toISOString();
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const git = (...args) =>
  execFileSync("git", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
const fail = (code) => {
  throw Object.assign(new Error(code), { runnerCode: code });
};
const boundedError = (error) => error?.runnerCode ?? "runner_error";
const writeNew = (path, value) => writeFile(path, json(value), { flag: "wx", mode: 0o600 });

export function runtimeDeadlineTransform(originalCode) {
  const { from, to, expectedMatches } = DEADLINE_TRANSFORM_SPEC;
  if (originalCode.split(from).length - 1 !== expectedMatches)
    fail("unexpected_serving_deadline_source");
  const code = originalCode.replace(from, to);
  const record = {
    kind: "extended-synthetic-runtime-deadline",
    servingDeadlineMs: SERVING_DEADLINE_MS,
    runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
    servingAvailabilityEstablished: false,
    transformedModule: DIAGNOSTICS_MODULE,
    originalModuleSha256: digest(originalCode),
    transformedModuleSha256: digest(code),
    transformSpecification: DEADLINE_TRANSFORM_SPEC,
    transformSpecificationSha256: digest(json(DEADLINE_TRANSFORM_SPEC)),
    nativeProviderFunctionOrPayloadTransformed: false,
  };
  return { code, record };
}

export function createRuntimeDeadlinePlugin(override) {
  const target = join(PROJECT_ROOT, DIAGNOSTICS_MODULE);
  let applications = 0;
  return {
    plugin: {
      name: "natal-round-3-runtime-deadline",
      enforce: "pre",
      transform(code, id) {
        if (id.split("?")[0] !== target) return null;
        if (digest(code) !== override.originalModuleSha256)
          fail("unexpected_diagnostics_transform_input");
        const transformed = runtimeDeadlineTransform(code);
        if (JSON.stringify(transformed.record) !== JSON.stringify(override))
          fail("runtime_override_identity_changed");
        applications += 1;
        return { code: transformed.code, map: null };
      },
    },
    assertApplied() {
      if (applications !== 1) fail("runtime_deadline_transform_not_applied_exactly_once");
    },
  };
}

export function pairedSchedule(cases) {
  return cases.flatMap((fixed, fixtureIndex) => {
    const sources = fixtureIndex % 2 === 0 ? SOURCES : [...SOURCES].reverse();
    return sources.map((bundleSource, sourceIndex) => ({
      sequence: fixtureIndex * 2 + sourceIndex + 1,
      fixtureIndex,
      bundleSource,
      caseId: fixed.id,
    }));
  });
}

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
  try {
    git("diff", "--quiet", "HEAD", "--", ...SOURCE_PATHS);
  } catch {
    fail("tracked_source_differs_from_generating_revision");
  }
  const paths = git("ls-files", "-z", "--", ...SOURCE_PATHS)
    .split("\0")
    .filter(Boolean)
    .sort();
  if (!paths.length) fail("empty_tracked_source_inventory");
  const files = [];
  for (const path of paths)
    files.push({ path, sha256: digest(await readFile(join(PROJECT_ROOT, path))) });
  return {
    sourceRevision: revision,
    trackedSourceFiles: files,
    trackedSourceSha256: digest(json(files)),
    runnerSha256: digest(await readFile(SCRIPT_PATH)),
    servingDeadlineMs: SERVING_DEADLINE_MS,
    runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
    runtimePolicyOverride: runtimeDeadlineTransform(
      await readFile(join(PROJECT_ROOT, DIAGNOSTICS_MODULE), "utf8"),
    ).record,
  };
}

async function unchanged(initial) {
  let current;
  try {
    current = await sourceSnapshot();
  } catch {
    fail("source_changed");
  }
  if (
    current.trackedSourceSha256 !== initial.trackedSourceSha256 ||
    current.runnerSha256 !== initial.runnerSha256 ||
    JSON.stringify(current.runtimePolicyOverride) !== JSON.stringify(initial.runtimePolicyOverride)
  )
    fail("source_changed");
}

async function newDirectory(path) {
  if (!path) return;
  try {
    await access(path);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
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
    modelVersion:
      typeof modelVersion === "string" && /^[a-zA-Z0-9._:/-]{1,120}$/.test(modelVersion)
        ? modelVersion
        : null,
    usageMetadata: Object.keys(usage).length ? usage : null,
  };
}

async function main() {
  const { mode, outputDir } = options();
  await newDirectory(outputDir);
  const configured = Boolean(process.env.GEMINI_ENTERPRISE_API_KEY);
  if (mode !== "--dry-plan" && !configured)
    fail("gemini_enterprise_key_not_configured_no_calls_made");
  const initial = await sourceSnapshot();
  const originalFetch = globalThis.fetch;
  let vite;
  let active = null;
  let transportAttempts = 0;
  let startedModelCases = 0;
  let stopRequested = false;
  let haltReason = null;
  let sequence = 0;
  const stop = () => {
    stopRequested = true;
  };
  const results = Object.fromEntries(SOURCES.map((source) => [source, []]));
  const reports = {};
  const evidence = [];
  let executionContext;
  let outputCreated = false;

  // Imports/preflight have no permitted transport. During a case only the exact
  // production Enterprise POST is allowed, with its original init and signal.
  globalThis.fetch = async (url, init) => {
    if (!active || String(url) !== active.endpoint || init?.method !== "POST")
      fail("unexpected_transport_blocked");
    await unchanged(initial);
    if (active.transports.length || transportAttempts >= MAX_ATTEMPTS) {
      active.policyViolation = true;
      fail("attempt_limit_or_repeated_case_transport_blocked");
    }
    const receipt = {
      startedAt: now(),
      httpStatus: null,
      modelVersion: null,
      usageMetadata: null,
      observation: "pending",
    };
    active.transports.push(receipt);
    transportAttempts += 1;
    try {
      const response = await originalFetch(url, init);
      receipt.httpStatus = response.status;
      if (response.ok) {
        // Return the original response immediately. A clone observes only the
        // successful response's bounded model/usage fields, never headers/errors.
        try {
          const observation = response
            .clone()
            .json()
            .then((payload) => {
              Object.assign(receipt, observedMetadata(payload), { observation: "observed" });
            })
            .catch(() => {
              receipt.observation = "metadata_unavailable";
            });
          active.observations.push(observation);
        } catch {
          receipt.observation = "metadata_unavailable";
        }
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
    const deadlinePlugin = createRuntimeDeadlinePlugin(initial.runtimePolicyOverride);
    vite = await createServer({
      plugins: [deadlinePlugin.plugin],
      root: PROJECT_ROOT,
      configFile: false,
      envFile: false,
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const load = (path) => vite.ssrLoadModule(path);
    const fixtures = await load("/src/lib/ai/reading-evaluation.fixtures.mjs");
    const diagnostics = await load("/src/lib/ai/diagnostics.ts");
    const runner = await load("/src/lib/ai/reading-evaluation.server.ts");
    const shared = await load("/src/lib/ai/reading-evaluation.shared.ts");
    const { DEFAULT_BUNDLE } = await load("/src/lib/content/default-bundle.ts");
    const { NATAL_CANDIDATE_BUNDLE, transitCopyIdentity } = await load(
      "/src/lib/content/natal-candidate-bundle.ts",
    );
    const cases = fixtures.READING_EVAL_CASES;
    if (
      fixtures.READING_EVAL_FIXTURE_VERSION !== "synthetic-daily-6" ||
      cases.length !== 38 ||
      cases.filter((row) => row.id === "quiet-threshold").length !== 1
    )
      fail("unexpected_fixed_case_inventory");
    deadlinePlugin.assertApplied();
    if (
      diagnostics.DAILY_PROMPT_VERSION !== "daily-astro-body-11" ||
      diagnostics.DAILY_VALIDATOR_VERSION !== "daily-reference-7" ||
      diagnostics.DAILY_GATEWAY_TIMEOUT_MS !== RUNTIME_DEADLINE_MS ||
      diagnostics.GEMINI_ENTERPRISE_MODEL !== "gemini-3.8-flash" ||
      !diagnostics.DAILY_DIAGNOSTIC_CODES.includes("editorial_claim")
    )
      fail("unexpected_model_or_policy_identity");
    if (
      typeof runner.runSyntheticEvaluationCase !== "function" ||
      typeof shared.combineReadingEvaluationResults !== "function"
    )
      fail("production_evaluation_exports_missing");
    if (
      digest(JSON.stringify(transitCopyIdentity(DEFAULT_BUNDLE))) !==
      digest(JSON.stringify(transitCopyIdentity(NATAL_CANDIDATE_BUNDLE)))
    )
      fail("unmatched_transit_copy");
    const bundles = { builtin: DEFAULT_BUNDLE, "natal-candidate": NATAL_CANDIDATE_BUNDLE };
    const schedule = pairedSchedule(cases);
    executionContext = {
      kind: "local-extended-deadline-synthetic-capture",
      projectRoot: PROJECT_ROOT,
      runtimePolicyOverride: initial.runtimePolicyOverride,
      servingAvailabilityEstablished: false,
      warning:
        "120-second runtime-only captures do not establish the serving path's 60-second availability.",
      processWorkingDirectory: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      moduleLoader: "Vite ssrLoadModule",
      viteConfigFile: false,
      viteEnvFile: false,
      middlewareMode: true,
      entrypoint: "src/lib/ai/reading-evaluation.server.ts#runSyntheticEvaluationCase",
      provider: PROVIDER,
      declaredModel: diagnostics.languageModel(PROVIDER),
      hostedWorkflowExecuted: false,
      adminAuthenticationVerified: false,
      productionVerified: false,
      appServerStarted: false,
      databaseOrReadingCacheAccessed: false,
      contentActivated: false,
      cost: "unknown; usage observations do not establish monetary cost",
    };
    await unchanged(initial);
    const plan = {
      mode,
      configured,
      sourceRevision: initial.sourceRevision,
      trackedSourceFiles: initial.trackedSourceFiles.length,
      trackedSourceSha256: initial.trackedSourceSha256,
      runnerSha256: initial.runnerSha256,
      provider: PROVIDER,
      model: diagnostics.languageModel(PROVIDER),
      bundleSources: SOURCES,
      fixtureVersion: fixtures.READING_EVAL_FIXTURE_VERSION,
      casesPerBundle: cases.length,
      maximumModelAttempts: MAX_ATTEMPTS,
      retries: 0,
      resumeSupported: false,
      concurrency: 1,
      ordering: "adjacent pairs, first source alternates by zero-based fixture index",
      schedule,
      scheduleSha256: digest(json(schedule)),
      servingDeadlineMs: SERVING_DEADLINE_MS,
      runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
      runtimePolicyOverride: initial.runtimePolicyOverride,
      executionContext,
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
    for (const scheduled of schedule) {
      const { bundleSource, fixtureIndex } = scheduled;
      const fixed = cases[fixtureIndex];
      if (stopRequested) {
        haltReason = "operator_stop_after_current_case";
        break;
      }
      await unchanged(initial);
      sequence += 1;
      if (sequence !== scheduled.sequence || fixed.id !== scheduled.caseId)
        fail("schedule_changed");
      const stem = `${String(sequence).padStart(3, "0")}-${bundleSource}-${fixed.id}`;
      const expectedModel = fixed.id !== "quiet-threshold";
      if (expectedModel && ++startedModelCases > MAX_ATTEMPTS) fail("model_case_limit_exceeded");
      await writeNew(join(outputDir, "journal", `${stem}-start.json`), {
        sequence,
        fixtureIndex,
        bundleSource,
        caseId: fixed.id,
        provider: PROVIDER,
        expectedModel,
        startedAt: now(),
        sourceRevision: initial.sourceRevision,
        sourceSha256: initial.trackedSourceSha256,
        configHash: digest(JSON.stringify(fixed)),
        noRetries: true,
        servingDeadlineMs: SERVING_DEADLINE_MS,
        runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
        runtimeOverrideSha256: digest(json(initial.runtimePolicyOverride)),
      });
      active = {
        endpoint: `https://aiplatform.googleapis.com/v1/publishers/google/models/${diagnostics.GEMINI_ENTERPRISE_MODEL}:generateContent`,
        transports: [],
        observations: [],
        policyViolation: false,
      };
      let result;
      try {
        result = await runner.runSyntheticEvaluationCase(fixed.id, bundles[bundleSource], PROVIDER);
      } finally {
        await Promise.allSettled(active.observations);
      }
      const transport = active;
      active = null;
      if (
        result.metadata.gatewayTimeoutMs !== RUNTIME_DEADLINE_MS ||
        result.case.diagnostics.gatewayTimeoutMs !== RUNTIME_DEADLINE_MS
      )
        fail("case_runtime_deadline_not_recorded");
      if (
        transport.transports.length !== Number(expectedModel) ||
        result.case.diagnostics.attempted !== expectedModel
      )
        fail("unexpected_case_transport_count");
      // The selector is evaluation metadata, never a production pointer change.
      result.metadata.bundleSource = bundleSource;
      results[bundleSource].push(result);
      await writeNew(join(outputDir, "journal", `${stem}-result.json`), result);
      const receipt = {
        sequence,
        fixtureIndex,
        bundleSource,
        caseId: fixed.id,
        settledAt: now(),
        diagnostics: result.case.diagnostics,
        transports: transport.transports,
      };
      evidence.push(receipt);
      await writeNew(join(outputDir, "journal", `${stem}-transport.json`), receipt);
      const checkpoint = shared.combineReadingEvaluationResults(results[bundleSource], {
        partial: true,
      });
      if (
        checkpoint.gatewayTimeoutMs !== RUNTIME_DEADLINE_MS ||
        checkpoint.cases.some((row) => row.diagnostics.gatewayTimeoutMs !== RUNTIME_DEADLINE_MS)
      )
        fail("checkpoint_runtime_deadline_not_recorded");
      await writeNew(
        join(
          outputDir,
          `${bundleSource}-partial-${String(results[bundleSource].length).padStart(2, "0")}.json`,
        ),
        checkpoint,
      );
      await unchanged(initial);
      if (transport.policyViolation || HALT_CODES.has(result.case.diagnostics.code)) {
        haltReason = transport.policyViolation
          ? "transport_policy_violation"
          : result.case.diagnostics.code;
        break;
      }
      console.log(
        json({
          sequence,
          bundleSource,
          caseId: fixed.id,
          outcome: result.case.diagnostics.outcome,
          code: result.case.diagnostics.code,
          transportAttempts,
        }),
      );
      if (results[bundleSource].length === cases.length) {
        const report = shared.combineReadingEvaluationResults(results[bundleSource]);
        if (
          report.gatewayTimeoutMs !== RUNTIME_DEADLINE_MS ||
          report.cases.some((row) => row.diagnostics.gatewayTimeoutMs !== RUNTIME_DEADLINE_MS)
        )
          fail("report_runtime_deadline_not_recorded");
        const name = `${bundleSource}-report.json`;
        await writeNew(join(outputDir, name), report);
        const reportSha256 = digest(await readFile(join(outputDir, name)));
        reports[bundleSource] = { report, reportSha256, name };
        await writeNew(join(outputDir, `${bundleSource}-identity.json`), {
          identityVersion: "reading-evaluation-identity-1",
          report: {
            path: name,
            sha256: reportSha256,
            recordedMetadata: Object.fromEntries(
              Object.entries(report).filter(([key]) => !["cases", "summary"].includes(key)),
            ),
          },
          build: {
            sourceRevision: initial.sourceRevision,
            trackedSourceSha256: initial.trackedSourceSha256,
            runnerSha256: initial.runnerSha256,
            runtimePolicyOverride: initial.runtimePolicyOverride,
            servingDeadlineMs: SERVING_DEADLINE_MS,
            runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
            executionContext,
          },
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
      finishedAt: now(),
      status: haltReason ? "halted" : "complete",
      haltReason,
      sourceRevision: initial.sourceRevision,
      trackedSourceSha256: initial.trackedSourceSha256,
      sourceUnchangedThroughout: haltReason !== "source_changed",
      startedModelCases,
      transportAttempts,
      completedCases: Object.fromEntries(SOURCES.map((source) => [source, results[source].length])),
      completedReports: Object.fromEntries(
        Object.entries(reports).map(([source, value]) => [
          source,
          { path: value.name, sha256: value.reportSha256 },
        ]),
      ),
      unsettledCase: active ? { sequence, transportAttempts: active.transports.length } : null,
      usageObservedCases: evidence.filter((item) =>
        item.transports.some((entry) => entry.usageMetadata),
      ).length,
      cost: "unknown",
      retries: 0,
      resumeSupported: false,
      concurrency: 1,
      servingDeadlineMs: SERVING_DEADLINE_MS,
      runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
      runtimePolicyOverride: initial.runtimePolicyOverride,
      executionContext,
    });
    console.log(
      json({
        status: haltReason ? "halted" : "complete",
        haltReason,
        outputDir,
        transportAttempts,
      }),
    );
    if (haltReason) process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(`Model-pair runner refused or halted: ${boundedError(error)}`);
    process.exitCode = 1;
  });
}
