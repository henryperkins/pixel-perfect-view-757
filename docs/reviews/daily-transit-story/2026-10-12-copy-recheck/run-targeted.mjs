/** Six replacement transit-writing captures for the requested joint release. No automatic retries, resume or activation. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import {
  createRuntimeDeadlinePlugin,
  runtimeDeadlineTransform,
} from "../../daily-natal-lens/2026-10-12-synthesis-recovery/deadline.mjs";

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SCRIPT), "../../../..");
const HELPER = resolve(
  dirname(SCRIPT),
  "../../daily-natal-lens/2026-10-12-synthesis-recovery/deadline.mjs",
);
const SOURCE_PATHS = [
  "src",
  "scripts",
  "package.json",
  "bun.lock",
  "pnpm-lock.yaml",
  "package-lock.json",
  "tsconfig.json",
];
const CASES = [
  "arc-single-pass",
  "arc-opening-three",
  "arc-return-three",
  "arc-closing-three",
  "arc-between-passes",
  "arc-truncated-scan",
];
const SCHEDULE = CASES.map((caseId) => ({ caseId, repetition: 1 }));
const INTER_CALL_PAUSE_MS = 30_000;
const ENDPOINT =
  "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent";
const HALT_CODES = new Set(["auth", "credit", "rate_limit", "not_configured", "network", "http"]);
const USAGE_FIELDS = [
  "promptTokenCount",
  "candidatesTokenCount",
  "totalTokenCount",
  "thoughtsTokenCount",
  "cachedContentTokenCount",
  "toolUsePromptTokenCount",
];
const now = () => new Date().toISOString();
const json = (v) => `${JSON.stringify(v, null, 2)}\n`;
const hash = (v) => createHash("sha256").update(v).digest("hex");
const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const fail = (code) => {
  throw Object.assign(new Error(code), { runnerCode: code });
};
const writeNew = (path, value) => writeFile(path, json(value), { flag: "wx", mode: 0o600 });

async function snapshot(expectedRevision) {
  const revision = git("rev-parse", "HEAD").trim();
  if (revision !== expectedRevision) fail("unexpected_source_revision");
  try {
    git("diff", "--quiet", "HEAD", "--", ...SOURCE_PATHS);
  } catch {
    fail("source_is_dirty");
  }
  if (git("ls-files", "--others", "--exclude-standard", "--", ...SOURCE_PATHS).trim())
    fail("untracked_source");
  const files = [];
  for (const path of git("ls-files", "-z", "--", ...SOURCE_PATHS)
    .split("\0")
    .filter(Boolean)
    .sort()) {
    files.push({ path, sha256: hash(await readFile(join(ROOT, path))) });
  }
  return {
    sourceRevision: revision,
    files,
    trackedSourceSha256: hash(json(files)),
    runnerSha256: hash(await readFile(SCRIPT)),
    deadlineHelperSha256: hash(await readFile(HELPER)),
    runtimePolicyOverride: runtimeDeadlineTransform(
      await readFile(join(ROOT, "src/lib/ai/diagnostics.ts"), "utf8"),
    ).record,
  };
}

async function main() {
  const [mode, revision, outputArg, ...extra] = process.argv.slice(2);
  if (
    !["--dry-plan", "--run"].includes(mode) ||
    !/^[a-f0-9]{40}$/.test(revision ?? "") ||
    extra.length ||
    (mode === "--run" && !outputArg)
  )
    fail("usage_run_or_dry_plan_revision_new_output_directory");
  const output = outputArg ? resolve(outputArg) : null;
  if (output) {
    try {
      await readFile(join(output, "run-plan.json"));
      fail("output_already_exists_no_resume");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const configured = Boolean(process.env.GEMINI_ENTERPRISE_API_KEY);
  if (mode === "--run" && !configured) fail("gemini_enterprise_key_not_configured");
  const initial = await snapshot(revision);
  const unchanged = async () => {
    if (json(await snapshot(revision)) !== json(initial)) fail("source_changed");
  };
  const originalFetch = globalThis.fetch;
  let vite,
    active = null,
    attempts = 0,
    created = false,
    haltReason = null,
    stopRequested = false,
    sourceVerifiedAtFinish = false;
  const stop = () => {
    stopRequested = true;
  };
  const samples = [];
  let plan;
  globalThis.fetch = async (url, init) => {
    if (!active || String(url) !== ENDPOINT || init?.method !== "POST")
      fail("unexpected_transport_blocked");
    await unchanged();
    if (active.transports.length || attempts >= 6) {
      active.policyViolation = true;
      fail("attempt_limit_or_retry_blocked");
    }
    attempts += 1;
    const transport = {
      startedAt: now(),
      httpStatus: null,
      modelVersion: null,
      usageMetadata: null,
      observation: "pending",
    };
    active.transports.push(transport);
    await writeNew(join(output, `${active.sampleId}-transport-start.json`), {
      sampleId: active.sampleId,
      attempt: attempts,
      startedAt: transport.startedAt,
    });
    try {
      const response = await originalFetch(url, init);
      transport.httpStatus = response.status;
      if (response.ok) {
        active.observations.push(
          response
            .clone()
            .json()
            .then((payload) => {
              const usage = Object.fromEntries(
                USAGE_FIELDS.filter(
                  (field) =>
                    Number.isSafeInteger(payload?.usageMetadata?.[field]) &&
                    payload.usageMetadata[field] >= 0,
                ).map((field) => [field, payload.usageMetadata[field]]),
              );
              transport.usageMetadata = Object.keys(usage).length ? usage : null;
              transport.modelVersion =
                typeof payload?.modelVersion === "string" &&
                /^[a-zA-Z0-9._:/-]{1,120}$/.test(payload.modelVersion)
                  ? payload.modelVersion
                  : null;
              transport.observation = "observed";
            })
            .catch(() => {
              transport.observation = "metadata_unavailable";
            }),
        );
      } else {
        transport.observation = "http_failure_metadata_only";
        transport.retryAfter = response.headers.get("retry-after");
        active.observations.push(
          response
            .clone()
            .json()
            .then((payload) => {
              const error = payload?.error;
              transport.errorStatus =
                typeof error?.status === "string" && /^[A-Z_]+$/.test(error.status)
                  ? error.status
                  : null;
              const details = Array.isArray(error?.details) ? error.details : [];
              transport.errorReasons = details
                .map((d) => d.reason)
                .filter((v) => typeof v === "string" && /^[A-Z_]+$/.test(v));
              transport.retryDelays = details
                .filter((d) => String(d["@type"]).endsWith("RetryInfo"))
                .map((d) => d.retryDelay)
                .filter((v) => typeof v === "string" && /^\d+(?:\.\d+)?s$/.test(v));
            })
            .catch(() => {
              transport.observation = "http_failure_metadata_unavailable";
            }),
        );
      }
      return response;
    } catch (error) {
      transport.observation = "fetch_failed_usage_unknown";
      throw error;
    }
  };
  try {
    const deadline = createRuntimeDeadlinePlugin(initial.runtimePolicyOverride);
    vite = await createServer({
      root: ROOT,
      plugins: [deadline.plugin],
      configFile: false,
      envFile: false,
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const { runSyntheticEvaluationCase } = await vite.ssrLoadModule(
      "/src/lib/ai/reading-evaluation.server.ts",
    );
    const { TRANSIT_CANDIDATE_BUNDLE } = await vite.ssrLoadModule(
      "/src/lib/content/transit-candidate-bundle.ts",
    );
    const diagnostics = await vite.ssrLoadModule("/src/lib/ai/diagnostics.ts");
    const fixtures = await vite.ssrLoadModule("/src/lib/ai/reading-evaluation.fixtures.mjs");
    deadline.assertApplied();
    if (
      diagnostics.DAILY_PROMPT_VERSION !== "daily-astro-body-12" ||
      diagnostics.DAILY_VALIDATOR_VERSION !== "daily-reference-9" ||
      diagnostics.DAILY_GATEWAY_TIMEOUT_MS !== 180_000 ||
      diagnostics.GEMINI_ENTERPRISE_MODEL !== "gemini-3.8-flash"
    )
      fail("unexpected_policy_or_model");
    if (
      fixtures.READING_EVAL_FIXTURE_VERSION !== "synthetic-daily-6" ||
      CASES.some((id) => !fixtures.READING_EVAL_CASES.some((c) => c.id === id))
    )
      fail("unexpected_fixtures");
    plan = {
      kind: "targeted-transit-writing-capture",
      interCallPauseMs: INTER_CALL_PAUSE_MS,
      sourceRevision: revision,
      trackedSourceSha256: initial.trackedSourceSha256,
      runnerSha256: initial.runnerSha256,
      configured,
      provider: "gemini-enterprise",
      model: diagnostics.languageModel("gemini-enterprise"),
      bundleSource: "transit-candidate",
      bundleVersion: TRANSIT_CANDIDATE_BUNDLE.version,
      promptVersion: diagnostics.DAILY_PROMPT_VERSION,
      validatorVersion: diagnostics.DAILY_VALIDATOR_VERSION,
      schedule: SCHEDULE.map((s, i) => ({ sampleId: `sample-${i + 1}`, ...s })),
      maximumModelAttempts: 6,
      retries: 0,
      concurrency: 1,
      resumeSupported: false,
      servingDeadlineMs: 60_000,
      runtimeDeadlineMs: 180_000,
      runtimePolicyOverride: initial.runtimePolicyOverride,
      fullBenchmarkClaim: false,
      executionContext: {
        kind: "local-production-module-synthetic-capture",
        nodeVersion: process.version,
        moduleLoader: "Vite ssrLoadModule",
        configFile: false,
        envFile: false,
        hostedWorkflowExecuted: false,
        adminAuthenticationVerified: false,
        memberProviderVerified: false,
        servingAvailabilityEstablished: false,
        databaseOrReadingCacheAccessed: false,
        candidatesActivated: false,
      },
    };
    await unchanged();
    if (mode === "--dry-plan") {
      console.log(json({ ...plan, providerCallsMade: 0 }));
      return;
    }
    await mkdir(output, { recursive: false, mode: 0o700 });
    created = true;
    await writeNew(join(output, "source-manifest.json"), initial);
    await writeNew(join(output, "run-plan.json"), { ...plan, startedAt: now() });
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    for (const scheduled of plan.schedule) {
      if (samples.length && !stopRequested)
        await new Promise((done) => setTimeout(done, INTER_CALL_PAUSE_MS));
      if (stopRequested) {
        haltReason = "operator_stop_after_current_case";
        break;
      }
      await unchanged();
      active = { ...scheduled, transports: [], observations: [], policyViolation: false };
      await writeNew(join(output, `${active.sampleId}-start.json`), {
        ...scheduled,
        startedAt: now(),
        sourceRevision: revision,
      });
      const result = await runSyntheticEvaluationCase(
        active.caseId,
        TRANSIT_CANDIDATE_BUNDLE,
        "gemini-enterprise",
      );
      await Promise.allSettled(active.observations);
      result.metadata.bundleSource = "transit-candidate";
      const sample = { ...scheduled, result, transports: active.transports, settledAt: now() };
      await writeNew(join(output, `${active.sampleId}-result.json`), sample);
      samples.push(sample);
      if (
        active.policyViolation ||
        active.transports.length !== 1 ||
        !result.case.diagnostics.attempted ||
        result.case.diagnostics.gatewayTimeoutMs !== 180_000
      )
        fail("unexpected_transport_or_deadline");
      active = null;
      await unchanged();
      console.log(
        json({
          sampleId: scheduled.sampleId,
          caseId: scheduled.caseId,
          repetition: scheduled.repetition,
          outcome: result.case.diagnostics.outcome,
          code: result.case.diagnostics.code,
          attempts,
        }),
      );
      if (HALT_CODES.has(result.case.diagnostics.code)) {
        haltReason = result.case.diagnostics.code;
        break;
      }
    }
    await unchanged();
    sourceVerifiedAtFinish = true;
  } catch (error) {
    haltReason = error?.runnerCode ?? "runner_error";
    if (!created) throw error;
  } finally {
    if (active) await Promise.allSettled(active.observations);
    globalThis.fetch = originalFetch;
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    await vite?.close();
    if (created) {
      const complete = !haltReason && samples.length === 6;
      const capture = {
        kind: "targeted-transit-writing-capture-capture",
        complete,
        fullBenchmarkClaim: false,
        sourceRevision: revision,
        samples,
      };
      await writeNew(join(output, "capture.json"), capture);
      await writeNew(join(output, "run-finished.json"), {
        status: complete ? "complete" : "halted",
        haltReason,
        finishedAt: now(),
        sourceRevision: revision,
        trackedSourceSha256: initial.trackedSourceSha256,
        sourceUnchangedThroughout: sourceVerifiedAtFinish,
        modelAttempts: attempts,
        settledSamples: samples.length,
        losslessRawDrafts: samples.filter((s) => s.result.case.candidate?.captureLossless).length,
        unsettledSample: active
          ? { sampleId: active.sampleId, transports: active.transports }
          : null,
        captureSha256: hash(json(capture)),
        retries: 0,
        cost: "unknown",
        candidatesActivated: false,
      });
      console.log(
        json({
          status: complete ? "complete" : "halted",
          haltReason,
          attempts,
          settledSamples: samples.length,
        }),
      );
      if (!complete) process.exitCode = 1;
    }
  }
}
main().catch((error) => {
  console.error(`Targeted run refused: ${error?.runnerCode ?? "runner_error"}`);
  process.exitCode = 1;
});
