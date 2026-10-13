import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dgram from "node:dgram";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import {
  BASELINE_RESPONSES,
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "./reading-eval-cases.mjs";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const REPORT_VERSION = 1;
const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const WARNING =
  "Offline synthetic replay does not measure live model acceptance, semantic grounding, or writing quality. Manual rubric fields are intentionally unscored.";
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const caseIds = () => READING_EVAL_CASES.map((item) => item.id);
/** Shipped inactive candidates are explicit offline choices; active copy lives in the hosted app. */
const OFFLINE_BUNDLES = ["builtin", "natal-candidate", "transit-candidate", "writing-candidate"];
const HISTORICAL_NATAL_IDS = READING_EVAL_CASES.filter(
  (item) => !item.id.startsWith("arc-") && !item.id.startsWith("writing-"),
).map((item) => item.id);
// The archived transit snapshot predates two restored main natal cases. Its changed
// input configurations remain in the original reports and cannot be replayed as v6.
const HISTORICAL_TRANSIT_IDS = caseIds().filter(
  (id) => !["natal-own-target", "natal-moon-fallback"].includes(id) && !id.startsWith("writing-"),
);
const HISTORICAL_V6_IDS = caseIds().filter((id) => !id.startsWith("writing-"));
const STORY_POLICY_FIELDS = [
  "storyPlanVersion",
  "anchorVersion",
  "solverVersion",
  "sourceContract",
  "transitFixtureHash",
  "storyUse",
];
const WRITING_POLICY_FIELDS = [
  "writingPlanVersion",
  "writingQualityVersion",
  "reflectionVersion",
  "voiceExamplesVersion",
];
const IDENTITY_VERSION = "reading-evaluation-identity-1";
const SHA256 = /^[0-9a-f]{64}$/;
/** Recorded identity of a source report, copied as recorded and never inferred. */
const SOURCE_IDENTITY_FIELDS = [
  "fixtureVersion",
  "caseSetHash",
  "bundleVersion",
  "bundleHash",
  "transitCopyHash",
  "planVersion",
  "natalPlanVersion",
  "reliabilityVersion",
  ...STORY_POLICY_FIELDS,
  ...WRITING_POLICY_FIELDS,
  "promptVersion",
  "validatorVersion",
  "model",
  "gatewayTimeoutMs",
  "bundleSource",
  "source",
  "partial",
  "expectedCases",
];

function assertOfflineBundle(bundleSource) {
  if (!OFFLINE_BUNDLES.includes(bundleSource))
    throw new Error(
      "Unknown offline evaluation bundle: choose builtin, natal-candidate or transit-candidate",
    );
}

/** Blocks application HTTP(S), TCP, TLS, UDP and DNS; the only fetch response is an in-memory replay. */
export async function withNetworkBlocked(run, replay = null) {
  const patched = [];
  const originalFetch = globalThis.fetch;
  const blocked = () => {
    throw new Error("Evaluation network is blocked");
  };
  const patch = (target, key) => {
    if (typeof target[key] !== "function") return;
    patched.push([target, key, target[key]]);
    target[key] = blocked;
  };
  for (const target of [http, https]) {
    patch(target, "request");
    patch(target, "get");
  }
  for (const key of ["connect", "createConnection"]) patch(net, key);
  patch(net.Socket.prototype, "connect");
  patch(net.Server.prototype, "listen");
  patch(tls, "connect");
  for (const key of ["connect", "send", "bind"]) patch(dgram.Socket.prototype, key);
  for (const target of [dns, dnsPromises, dns.Resolver.prototype, dnsPromises.Resolver.prototype]) {
    for (const key of Object.getOwnPropertyNames(target)) {
      if (/^(lookup|resolve)/.test(key)) patch(target, key);
    }
  }
  syncBuiltinESMExports();
  globalThis.fetch = async (url, init = {}) => {
    if (String(url) !== GATEWAY || !replay || init.method !== "POST") return blocked();
    return replay(JSON.parse(String(init.body)));
  };
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
    for (const [target, key, original] of patched.reverse()) target[key] = original;
    syncBuiltinESMExports();
  }
}

/**
 * Loads production modules with the network blocked, a fake gateway key and no project
 * configuration or `.env` files. The key and network are restored even on failure.
 */
async function withEvaluationModules(run, replay = null) {
  const originalKey = process.env.LOVABLE_API_KEY;
  // The real gateway code is exercised, but this value is never sent over a socket or included in reports.
  process.env.LOVABLE_API_KEY = "synthetic-evaluation-no-network";
  let vite;
  try {
    return await withNetworkBlocked(async () => {
      const projectRequire = createRequire(resolve(PROJECT_ROOT, "package.json"));
      const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
      vite = await createServer({
        root: PROJECT_ROOT,
        configFile: false,
        envFile: false,
        appType: "custom",
        logLevel: "error",
        server: { middlewareMode: true, hmr: false, ws: false },
      });
      return await run((path) => vite.ssrLoadModule(path));
    }, replay);
  } finally {
    await vite?.close();
    if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
    else process.env.LOVABLE_API_KEY = originalKey;
  }
}

/** The shipped bundles with the identities a report records for them. */
async function shippedBundles(load) {
  const { DEFAULT_BUNDLE } = await load("/src/lib/content/default-bundle.ts");
  const { NATAL_CANDIDATE_BUNDLE, transitCopyIdentity } = await load(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  const { TRANSIT_CANDIDATE_BUNDLE } = await load("/src/lib/content/transit-candidate-bundle.ts");
  const { WRITING_CANDIDATE_BUNDLE } = await load("/src/lib/content/writing-candidate-bundle.ts");
  const identity = (bundle) => ({
    bundle,
    version: bundle.version,
    hash: hash(bundle),
    transitCopyHash: hash(transitCopyIdentity(bundle)),
  });
  return {
    builtin: identity(DEFAULT_BUNDLE),
    "natal-candidate": identity(NATAL_CANDIDATE_BUNDLE),
    "transit-candidate": identity(TRANSIT_CANDIDATE_BUNDLE),
    "writing-candidate": identity(WRITING_CANDIDATE_BUNDLE),
  };
}

export function validateResponses(responses) {
  if (!responses || typeof responses !== "object" || Array.isArray(responses))
    throw new Error("Responses must be a JSON object keyed by the fixed case IDs");
  const expected = caseIds().sort();
  const actual = Object.keys(responses).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      "Responses must contain exactly the fixed case IDs; missing or unknown cases cannot be compared",
    );
  if (responses["quiet-threshold"] !== null)
    throw new Error(
      "The quiet-threshold response must be null: that case does not attempt generation",
    );
  return responses;
}

function summarize(cases, gatewayReplays) {
  const outcomes = { accepted: 0, rejected: 0, unavailable: 0, skipped: 0 };
  const reasons = {};
  for (const item of cases) {
    outcomes[item.diagnostics.outcome] += 1;
    reasons[item.diagnostics.code] = (reasons[item.diagnostics.code] ?? 0) + 1;
  }
  const attempted = cases.filter((item) => item.diagnostics.attempted).length;
  return {
    cases: cases.length,
    gatewayReplays,
    outcomes,
    reasons,
    replayAcceptanceRate: attempted ? outcomes.accepted / attempted : null,
    liveAcceptanceRate: null,
  };
}

/**
 * Converts a complete report's captured candidates into the case-keyed response
 * dictionary, after proving that the report matches the fixed inputs, the current
 * model and the selected shipped bundle, and that every capture is lossless.
 */
function responsesFromReport(report, bundleSource, shipped, model, transitMetadata) {
  assertOfflineBundle(bundleSource);
  validateReport(report);
  if (report.fixtureVersion !== READING_EVAL_FIXTURE_VERSION)
    throw new Error(
      "Historical report fixture version does not match the current fixed synthetic cases; replay requires its original frozen source snapshot",
    );
  if (report.caseSetHash !== hash(READING_EVAL_CASES))
    throw new Error("Report case set does not match the fixed synthetic cases");
  const fixed = new Map(READING_EVAL_CASES.map((item) => [item.id, item]));
  for (const row of report.cases)
    if (row.configHash !== hash(fixed.get(row.id)))
      throw new Error(`Report input config for ${row.id} does not match the fixed case`);
  if (report.model !== model)
    throw new Error(`Report model ${report.model} does not match the current model ${model}`);
  if (STORY_POLICY_FIELDS.some((field) => report[field] !== transitMetadata[field]))
    throw new Error("Report transit policy does not match the current fixed synthetic cases");
  const selected = shipped[bundleSource];
  if (report.bundleVersion !== selected.version || report.bundleHash !== selected.hash) {
    const other = Object.entries(shipped).find(
      ([, item]) => item.version === report.bundleVersion && item.hash === report.bundleHash,
    );
    throw new Error(
      other
        ? `Report bundle ${report.bundleVersion} does not match the selected ${bundleSource} bundle (${selected.version}); select --bundle ${other[0]}`
        : `Report used custom copy ${report.bundleVersion} (${String(report.bundleHash).slice(0, 12)}) that matches no shipped bundle; replaying it needs a frozen import of that copy`,
    );
  }
  if (report.transitCopyHash != null && report.transitCopyHash !== selected.transitCopyHash)
    throw new Error("Report transit copy does not match the selected bundle");
  const responses = {};
  for (const row of report.cases) {
    const candidate = row.candidate;
    if (row.diagnostics.outcome === "skipped") {
      if (row.diagnostics.attempted || candidate !== null)
        throw new Error(`Case ${row.id} skipped generation but records an attempt or draft`);
      responses[row.id] = null;
      continue;
    }
    if (!row.diagnostics.attempted || !candidate || typeof candidate !== "object")
      throw new Error(
        `Case ${row.id} has no captured draft (${row.diagnostics.outcome}); only complete captures can be replayed`,
      );
    if (candidate.truncated !== false)
      throw new Error(`Case ${row.id} draft capture was truncated`);
    if (
      !Array.isArray(candidate.paragraphs) ||
      candidate.paragraphCount !== candidate.paragraphs.length
    )
      throw new Error(`Case ${row.id} paragraph count does not match its capture`);
    if (Object.hasOwn(candidate, "captureLossless")) {
      if (candidate.captureLossless !== true)
        throw new Error(`Case ${row.id} capture is not lossless`);
    } else if (row.diagnostics.outcome !== "accepted") {
      // Validation proves an accepted historical draft was fully shaped; nothing proves a rejected one.
      throw new Error(
        `Case ${row.id} is a historical ${row.diagnostics.outcome} draft without proof of lossless capture`,
      );
    }
    if (
      candidate.paragraphs.some(
        (paragraph) =>
          !paragraph ||
          typeof paragraph.text !== "string" ||
          !Array.isArray(paragraph.facts) ||
          paragraph.facts.some((fact) => typeof fact !== "string") ||
          (bundleSource === "writing-candidate" &&
            (!Array.isArray(paragraph.scenes) ||
              paragraph.scenes.some((id) => typeof id !== "string"))),
      )
    )
      throw new Error(`Case ${row.id} has a malformed captured paragraph`);
    responses[row.id] = {
      paragraphs: candidate.paragraphs.map(({ text, facts, scenes }) => ({
        text,
        facts: [...facts],
        ...(scenes ? { scenes: [...scenes] } : {}),
      })),
    };
  }
  return validateResponses(responses);
}

/** Extracts replayable responses from a complete report for an explicitly selected bundle. */
export async function extractResponses(report, { bundleSource } = {}) {
  assertOfflineBundle(bundleSource);
  return withEvaluationModules(async (load) => {
    const shipped = await shippedBundles(load);
    const { LANGUAGE_MODEL } = await load("/src/lib/ai/diagnostics.ts");
    const { TRANSIT_EVALUATION_METADATA } = await load("/src/lib/ai/reading-evaluation.transit.ts");
    return responsesFromReport(
      report,
      bundleSource,
      shipped,
      LANGUAGE_MODEL,
      TRANSIT_EVALUATION_METADATA,
    );
  });
}

/** Runs the production assembly, facts and generation code against fixed synthetic input and replayed JSON. */
export async function evaluateReadings({
  responses = undefined,
  bundleSource = "natal-candidate",
  sourceReport = undefined,
} = {}) {
  assertOfflineBundle(bundleSource);
  if (sourceReport !== undefined) {
    if (responses === undefined) throw new Error("A source report binds a responses replay");
    if (!SHA256.test(String(sourceReport?.sha256)))
      throw new Error("A source report needs the SHA-256 of its original file");
  }
  const source =
    sourceReport !== undefined
      ? "source-report-replay"
      : responses === undefined
        ? "synthetic-baseline"
        : "candidate-replay";
  const replayResponses = validateResponses(responses ?? BASELINE_RESPONSES);
  let currentResponse;
  let currentRequests = [];
  let gatewayReplays = 0;
  return withEvaluationModules(
    async (load) => {
      const { assembleReading } = await load("/src/lib/reading.server.ts");
      const { composeDailyWritingTemplate } = await load(
        "/src/lib/content/daily-writing-template.ts",
      );
      const { DAILY_WRITING_PLAN_VERSION } = await load("/src/lib/content/daily-writing.ts");
      const { DAILY_REFLECTION_VERSION } = await load("/src/lib/content/daily-reflection.ts");
      const { DAILY_WRITING_QUALITY_VERSION } = await load("/src/lib/ai/daily-writing-quality.ts");
      const { DAILY_VOICE_EXAMPLES_VERSION } = await load("/src/lib/ai/daily-voice.ts");
      const { readingFacts } = await load("/src/lib/ai/facts.ts");
      const { dailyPlanIdentity } = await load("/src/lib/content/synthesis.ts");
      const { NATAL_LENS_PLAN_VERSION } = await load("/src/lib/content/natal-lens.ts");
      const { NATAL_RELIABILITY_VERSION } = await load("/src/lib/astro/natal-reliability.ts");
      const { syntheticNatalReliability } = await load("/src/lib/ai/reading-evaluation.natal.ts");
      const { syntheticTransitCalculation, TRANSIT_EVALUATION_METADATA } = await load(
        "/src/lib/ai/reading-evaluation.transit.ts",
      );
      const { generateSyntheticReadingProse, LANGUAGE_MODEL } = await load(
        "/src/lib/ai/language.server.ts",
      );
      const shipped = await shippedBundles(load);
      const { bundle, transitCopyHash } = shipped[bundleSource];
      if (
        sourceReport !== undefined &&
        !isDeepStrictEqual(
          responsesFromReport(
            sourceReport.report,
            bundleSource,
            shipped,
            LANGUAGE_MODEL,
            TRANSIT_EVALUATION_METADATA,
          ),
          replayResponses,
        )
      )
        throw new Error(
          "The supplied responses differ from the source report's captured candidates",
        );
      const { localNoon, daysToLocalDate } = await load("/src/lib/local-day.ts");
      const {
        DAILY_READING_PLAN_VERSION,
        DAILY_PROMPT_VERSION,
        DAILY_VALIDATOR_VERSION,
        DAILY_GATEWAY_TIMEOUT_MS,
      } = await load("/src/lib/ai/diagnostics.ts");
      const cases = [];
      for (const fixed of READING_EVAL_CASES) {
        currentResponse = replayResponses[fixed.id];
        currentRequests = [];
        const effectiveBundle =
          fixed.writingFrameMode === "none" ? { ...bundle, dailyWritingFrames: [] } : bundle;
        const reference = localNoon(fixed.config.day, fixed.config.timeZone);
        const cycles = fixed.cycles.map((cycle) => ({
          ...cycle,
          days_to_exact: cycle.exact_at
            ? daysToLocalDate(cycle.exact_at, fixed.config.day, fixed.config.timeZone)
            : null,
        }));
        const natalReliability = syntheticNatalReliability(fixed);
        let assembled = assembleReading(
          fixed.chart,
          cycles,
          {
            granted: new Set(fixed.config.granted),
            tone: fixed.config.tone,
            depth: fixed.config.depth,
            localBucket: null,
            checkIn: null,
            wellness: null,
          },
          effectiveBundle,
          natalReliability,
        );
        const calculation = syntheticTransitCalculation(fixed, assembled.eligibleCycles[0]);
        if (calculation)
          assembled = assembleReading(
            fixed.chart,
            cycles,
            {
              granted: new Set(fixed.config.granted),
              tone: fixed.config.tone,
              depth: fixed.config.depth,
              localBucket: null,
              checkIn: null,
              wellness: null,
            },
            effectiveBundle,
            natalReliability,
            calculation,
          );
        const facts = readingFacts(fixed.chart, assembled, fixed.config.timeZone);
        const observed = await generateSyntheticReadingProse({
          facts,
          hasEligibleCycles: assembled.eligibleCycles.length > 0,
          tone: fixed.config.tone,
          depth: fixed.config.depth,
          suppression: {
            angles: fixed.chart.uncertainty.angleClaimsSuppressed,
            houses: !fixed.chart.uncertainty.housesReliable,
          },
          fallback: {
            headline: assembled.headline,
            body: assembled.astroBody,
            prompt: assembled.prompt,
          },
          ...(assembled.writingTemplate
            ? {
                writing: {
                  plan: assembled.writingPlan,
                  template: assembled.writingTemplate,
                  minimalTemplate: composeDailyWritingTemplate(
                    assembled.writingPlan,
                    assembled.natalLensPlan,
                    assembled.transitStoryPlan,
                    true,
                  ),
                  recent: fixed.recentWritingBodies ?? [],
                },
              }
            : {}),
        });
        const output = observed.prose;
        if (!output.meta.diagnostics)
          throw new Error("Daily generation diagnostics are required for an evaluation report");
        cases.push({
          id: fixed.id,
          description: fixed.description,
          config: fixed.config,
          configHash: hash(fixed),
          localNoon: reference.toISOString(),
          eligibleCycleKeys: assembled.eligibleCycles.map((cycle) => cycle.cycle_key),
          facts,
          request: currentRequests[0] ?? null,
          candidate: observed.candidate,
          interpretationPlan: dailyPlanIdentity(assembled.interpretationPlan),
          natalLensPlan: assembled.natalLensPlan,
          natalReliability,
          transitStoryPlan: assembled.transitStoryPlan,
          ...(assembled.writingTemplate
            ? {
                writingPlan: assembled.writingPlan,
                reflectionPlan: assembled.reflectionPlan,
                writing: output.meta.writing,
              }
            : {}),
          ...(fixed.writingFrameMode ? { writingFrameMode: fixed.writingFrameMode } : {}),
          diagnostics: output.meta.diagnostics,
          output: {
            mode: output.meta.mode,
            headline: output.headline,
            body: output.body,
            prompt: output.prompt,
            citations: output.meta.citations,
          },
          template: { body: assembled.astroBody },
          manualReview: {
            specificity: null,
            voice: null,
            repetition: null,
            grounding: null,
            lensIntegration: null,
            unsupportedPersonalClaim: null,
            temporalCoherence: null,
            chapterIntegration: null,
            unsupportedHistory: null,
            promisedResolution: null,
            notes: null,
          },
        });
      }
      const report = {
        reportVersion: REPORT_VERSION,
        ...TRANSIT_EVALUATION_METADATA,
        fixtureVersion: READING_EVAL_FIXTURE_VERSION,
        caseSetHash: hash(READING_EVAL_CASES),
        bundleVersion: bundle.version,
        bundleHash: hash(bundle),
        transitCopyHash,
        planVersion: DAILY_READING_PLAN_VERSION,
        natalPlanVersion: NATAL_LENS_PLAN_VERSION,
        reliabilityVersion: NATAL_RELIABILITY_VERSION,
        ...(bundle.schemaVersion === 5
          ? {
              writingPlanVersion: DAILY_WRITING_PLAN_VERSION,
              writingQualityVersion: DAILY_WRITING_QUALITY_VERSION,
              reflectionVersion: DAILY_REFLECTION_VERSION,
              voiceExamplesVersion: DAILY_VOICE_EXAMPLES_VERSION,
            }
          : {}),
        promptVersion: cases[0].diagnostics.promptVersion,
        validatorVersion: cases[0].diagnostics.validatorVersion,
        model: LANGUAGE_MODEL,
        gatewayTimeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
        bundleSource,
        source,
        network: "blocked; gateway replayed in memory",
        warning: WARNING,
        summary: summarize(cases, gatewayReplays),
        cases,
      };
      if (sourceReport === undefined) return report;
      // The source keeps its own recorded identity; replaying its text under today's code
      // gives it neither the current prompt identity nor any deployed revision.
      const original = sourceReport.report;
      const recorded = new Map(original.cases.map((row) => [row.id, row.diagnostics]));
      const differences = cases
        .filter(({ id, diagnostics }) => {
          const before = recorded.get(id);
          return before.outcome !== diagnostics.outcome || before.code !== diagnostics.code;
        })
        .map(({ id, diagnostics }) => ({
          id,
          source: { outcome: recorded.get(id).outcome, code: recorded.get(id).code },
          replay: { outcome: diagnostics.outcome, code: diagnostics.code },
        }));
      return {
        ...report,
        sourceReport: {
          sha256: sourceReport.sha256,
          ...Object.fromEntries(
            SOURCE_IDENTITY_FIELDS.map((field) => [field, original[field] ?? null]),
          ),
          outcomes: original.summary?.outcomes ?? null,
        },
        sourceComparison: {
          cases: cases.length,
          matchingOutcomes: cases.length - differences.length,
          differences,
        },
      };
    },
    (request) => {
      gatewayReplays += 1;
      currentRequests.push({
        model: request.model,
        messages: request.messages,
        response_format: request.response_format,
      });
      return Response.json({
        choices: [{ message: { content: JSON.stringify(currentResponse) } }],
      });
    },
  );
}

function validateReport(report) {
  if (report?.reportVersion !== REPORT_VERSION || !Array.isArray(report.cases))
    throw new Error("Unsupported evaluation report");
  if (report.partial === true) throw new Error("Cannot use a partial evaluation report");
  if (
    report.gatewayTimeoutMs != null &&
    (!Number.isInteger(report.gatewayTimeoutMs) ||
      report.gatewayTimeoutMs < 1 ||
      report.gatewayTimeoutMs > 120_000)
  )
    throw new Error("Report contains an invalid gateway timeout budget");
  const ids = report.cases.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error("Report contains duplicate case IDs");
  const historicalTransit =
    report.fixtureVersion === "synthetic-daily-5" && ids.some((id) => id.startsWith("arc-"));
  const expected =
    report.fixtureVersion === READING_EVAL_FIXTURE_VERSION
      ? caseIds()
      : report.fixtureVersion === "synthetic-daily-6"
        ? HISTORICAL_V6_IDS
        : report.fixtureVersion === "synthetic-daily-5"
          ? historicalTransit
            ? HISTORICAL_TRANSIT_IDS
            : HISTORICAL_NATAL_IDS
          : report.fixtureVersion === "synthetic-daily-4"
            ? HISTORICAL_NATAL_IDS.filter((id) => !id.startsWith("natal-"))
            : null;
  if (!expected) throw new Error("Unsupported evaluation fixture version");
  if (JSON.stringify([...ids].sort()) !== JSON.stringify([...expected].sort()))
    throw new Error("Report must contain exactly the fixed case IDs");
  if (
    (["synthetic-daily-6", "synthetic-daily-7"].includes(report.fixtureVersion) ||
      historicalTransit) &&
    STORY_POLICY_FIELDS.some((field) =>
      field === "storyUse" ? typeof report[field] !== "boolean" : !report[field],
    )
  )
    throw new Error("Transit reports require recorded source and fixture policy identities");
  if (report.cases.some((item) => !item.configHash || !item.diagnostics?.outcome))
    throw new Error("Report contains an incomplete case config or diagnostics");
}

export function compareReports(before, after) {
  return compareReportPair(before, after);
}

/** The natal catalogue exception is private and is granted only by its strict comparison gate. */
function compareReportPair(before, after, { natalBundleDifference = false } = {}) {
  validateReport(before);
  validateReport(after);
  if (before.fixtureVersion !== after.fixtureVersion)
    throw new Error("Cannot compare different fixture versions");
  if (
    before.fixtureVersion === "synthetic-daily-4" &&
    ["bundleVersion", "bundleHash", "model"].some((field) => before[field] !== after[field])
  )
    throw new Error("Version-4 comparison requires identical frozen source bundle and model");
  const historicalTransit =
    before.fixtureVersion === "synthetic-daily-5" &&
    before.cases.some((row) => row.id.startsWith("arc-"));
  // Historical natal v5 comparisons isolate the catalogue while keeping transit copy fixed.
  if (
    before.fixtureVersion === "synthetic-daily-5" &&
    !historicalTransit &&
    (!before.transitCopyHash ||
      before.transitCopyHash !== after.transitCopyHash ||
      before.model !== after.model)
  )
    throw new Error("Version-5 comparison requires identical transit copy and model");
  if (
    (["synthetic-daily-6", "synthetic-daily-7"].includes(before.fixtureVersion) ||
      historicalTransit) &&
    (natalBundleDifference ? ["model"] : ["bundleVersion", "bundleHash", "model"]).some(
      (field) => before[field] !== after[field],
    )
  )
    throw new Error("Transit comparison requires identical frozen source bundle and model");
  const fixedPolicy = [
    "anchorVersion",
    "solverVersion",
    "sourceContract",
    "transitFixtureHash",
    "planVersion",
    "natalPlanVersion",
    "reliabilityVersion",
    "gatewayTimeoutMs",
    ...(["synthetic-daily-6", "synthetic-daily-7"].includes(before.fixtureVersion)
      ? ["storyPlanVersion", "transitCopyHash"]
      : []),
  ];
  if (
    (["synthetic-daily-6", "synthetic-daily-7"].includes(before.fixtureVersion) ||
      historicalTransit) &&
    fixedPolicy.some((field) => before[field] !== after[field])
  )
    throw new Error(
      "Transit comparison requires identical frozen source, fixture and prior policy inputs",
    );
  const oldCases = new Map(before.cases.map((item) => [item.id, item]));
  if (
    before.caseSetHash !== after.caseSetHash ||
    oldCases.size !== after.cases.length ||
    after.cases.some((item) => !oldCases.has(item.id))
  )
    throw new Error("Cannot compare different case sets");
  const cases = after.cases.map((item) => {
    const previous = oldCases.get(item.id);
    if (previous.configHash !== item.configHash)
      throw new Error(`Cannot compare changed input config for ${item.id}`);
    return {
      id: item.id,
      before: { outcome: previous.diagnostics.outcome, code: previous.diagnostics.code },
      after: { outcome: item.diagnostics.outcome, code: item.diagnostics.code },
      textChanged: previous.output.body !== item.output.body,
      manualReviewBefore: previous.manualReview,
      manualReviewAfter: item.manualReview,
    };
  });
  const configurationChanges = [
    "planVersion",
    "natalPlanVersion",
    "reliabilityVersion",
    ...STORY_POLICY_FIELDS,
    ...WRITING_POLICY_FIELDS,
    "promptVersion",
    "validatorVersion",
    "bundleVersion",
    "bundleHash",
    "bundleSource",
    "model",
    "gatewayTimeoutMs",
    "source",
  ]
    .filter((field) => (before[field] ?? null) !== (after[field] ?? null))
    .map((field) => ({ field, before: before[field] ?? null, after: after[field] ?? null }));
  const identity = (report) => ({
    planVersion: report.planVersion ?? null,
    natalPlanVersion: report.natalPlanVersion ?? null,
    reliabilityVersion: report.reliabilityVersion ?? null,
    ...Object.fromEntries(STORY_POLICY_FIELDS.map((field) => [field, report[field] ?? null])),
    ...Object.fromEntries(WRITING_POLICY_FIELDS.map((field) => [field, report[field] ?? null])),
    promptVersion: report.promptVersion,
    validatorVersion: report.validatorVersion,
    bundleVersion: report.bundleVersion ?? null,
    bundleHash: report.bundleHash,
    bundleSource: report.bundleSource ?? null,
    transitCopyHash: report.transitCopyHash ?? null,
    model: report.model,
    gatewayTimeoutMs: report.gatewayTimeoutMs ?? null,
    source: report.source,
  });
  return {
    reportVersion: REPORT_VERSION,
    fixtureVersion: before.fixtureVersion,
    before: identity(before),
    after: identity(after),
    configurationChanges,
    warning: "Replay changes do not establish live acceptance, grounding, or writing quality.",
    acceptedDelta:
      after.cases.filter((item) => item.diagnostics.outcome === "accepted").length -
      before.cases.filter((item) => item.diagnostics.outcome === "accepted").length,
    cases,
  };
}

/** Policy that must be identical when a natal experiment isolates the lens catalogue. */
const NATAL_FIXED_FIELDS = [
  "source",
  "model",
  "transitCopyHash",
  "planVersion",
  "natalPlanVersion",
  "reliabilityVersion",
  "promptVersion",
  "validatorVersion",
  "gatewayTimeoutMs",
];
const NATAL_ALLOWED_CHANGES = new Set(["bundleVersion", "bundleHash", "bundleSource"]);

function checkIdentityRecord(side, identity, sha256) {
  if (identity?.identityVersion !== IDENTITY_VERSION)
    throw new Error(`The ${side} identity record is not ${IDENTITY_VERSION}`);
  if (!SHA256.test(String(sha256)) || identity.report?.sha256 !== sha256)
    throw new Error(`The ${side} identity record does not describe the compared report`);
  const revision = identity.build?.sourceRevision ?? null;
  if (revision !== null && (typeof revision !== "string" || !revision.trim()))
    throw new Error(`The ${side} identity record has an invalid source revision`);
  return revision;
}

/**
 * Strict natal experiment comparison: identical fixtures, inputs, transit copy, model,
 * policies and timeout, with only the bundle and evaluation selector allowed to differ.
 * Equal source revisions must be shown by identity records; missing proof is a named gap.
 */
export function compareNatalReports(
  before,
  after,
  { beforeIdentity, afterIdentity, beforeSha256, afterSha256 } = {},
) {
  const fixedFields = [
    ...NATAL_FIXED_FIELDS,
    ...(["synthetic-daily-6", "synthetic-daily-7"].includes(before.fixtureVersion)
      ? STORY_POLICY_FIELDS
      : []),
  ];
  for (const field of fixedFields)
    if (before[field] == null || before[field] !== after[field])
      throw new Error(`Natal comparison requires an identical recorded ${field}`);
  const natalBundleDifference =
    ["synthetic-daily-6", "synthetic-daily-7"].includes(before.fixtureVersion) &&
    (before.bundleVersion !== after.bundleVersion || before.bundleHash !== after.bundleHash);
  if (natalBundleDifference) {
    const sources = new Set([before.bundleSource, after.bundleSource]);
    if (
      sources.size !== 2 ||
      !sources.has("builtin") ||
      !sources.has("natal-candidate") ||
      [before, after].some(
        (report) => !report.bundleVersion || !SHA256.test(String(report.bundleHash)),
      )
    )
      throw new Error(
        "Current natal comparison permits only the declared builtin and natal candidate catalogue difference",
      );
  }
  const compared = compareReportPair(before, after, { natalBundleDifference });
  const unexpected = compared.configurationChanges.filter(
    (change) => !NATAL_ALLOWED_CHANGES.has(change.field),
  );
  if (unexpected.length)
    throw new Error(
      `Natal comparison permits only bundle and selector changes, not ${unexpected.map((c) => c.field).join(", ")}`,
    );
  const revisions = [
    checkIdentityRecord("before", beforeIdentity, beforeSha256),
    checkIdentityRecord("after", afterIdentity, afterSha256),
  ];
  if (revisions.every(Boolean) && revisions[0] !== revisions[1])
    throw new Error("Natal comparison requires the same source revision for both runs");
  const qualificationGaps = ["before", "after"]
    .filter((_, index) => revisions[index] === null)
    .map((side) => `The ${side} report's source revision is unproven`);
  return {
    ...compared,
    mode: "natal",
    identity: {
      before: { sha256: beforeSha256, sourceRevision: revisions[0] },
      after: { sha256: afterSha256, sourceRevision: revisions[1] },
      sourceRevisionMatch: revisions.every(Boolean) ? true : null,
    },
    qualificationGaps,
  };
}

async function readJsonFile(path) {
  const bytes = await readFile(path);
  if (bytes.length > 2_000_000) throw new Error("Evaluation JSON must be smaller than 2 MB");
  return {
    value: JSON.parse(bytes.toString("utf8")),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
const readJson = async (path) => (await readJsonFile(path)).value;

const HELP = `Offline synthetic reading evaluator (no network; fake gateway key)
  --bundle-source builtin|natal-candidate|transit-candidate|writing-candidate --output report.json
  --bundle-source builtin|natal-candidate|transit-candidate|writing-candidate --responses candidate.json --output report.json
  --bundle-source builtin|natal-candidate|transit-candidate|writing-candidate --responses responses.json --source-report complete-report.json --output replay.json
  --bundle-source builtin|natal-candidate|transit-candidate|writing-candidate --extract-responses complete-report.json --output responses.json
  --bundle remains an alias for --bundle-source
  --write-responses candidate.json
  --compare before.json after.json --output comparison.json
  --compare-natal baseline.json candidate.json --before-identity identity.json --after-identity identity.json --output comparison.json
`;

export async function main(args) {
  const options = {};
  const values = { "--compare": 2, "--compare-natal": 2 };
  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    if (flag === "--help") {
      process.stdout.write(HELP);
      return;
    }
    if (
      ![
        "--output",
        "--responses",
        "--write-responses",
        "--compare",
        "--compare-natal",
        "--bundle",
        "--bundle-source",
        "--extract-responses",
        "--source-report",
        "--before-identity",
        "--after-identity",
      ].includes(flag)
    )
      throw new Error(`Unknown argument: ${flag}`);
    const count = values[flag] ?? 1;
    const value = args.slice(i + 1, i + 1 + count);
    if (value.length !== count || value.some((item) => item === undefined))
      throw new Error("Missing argument value");
    options[flag] = count === 1 ? value[0] : value;
    i += count;
  }
  const mode = [
    "--responses",
    "--write-responses",
    "--compare",
    "--compare-natal",
    "--extract-responses",
  ].filter((flag) => flag in options);
  if (mode.length > 1)
    throw new Error(
      "Choose one mode: baseline, responses, write-responses, extract-responses, compare, or compare-natal",
    );
  const comparing = "--compare" in options || "--compare-natal" in options;
  if ("--bundle" in options && "--bundle-source" in options)
    throw new Error("Choose one bundle selector: --bundle-source or its --bundle alias");
  const bundleSource = options["--bundle-source"] ?? options["--bundle"];
  if (comparing && bundleSource !== undefined)
    throw new Error("--bundle does not apply to comparisons; each report records its own bundle");
  if ("--write-responses" in options && bundleSource !== undefined)
    throw new Error("--bundle does not apply to --write-responses, which exports fixture drafts");
  if (!comparing && !("--write-responses" in options)) {
    if (bundleSource === undefined)
      throw new Error(
        "Choose the evaluation copy explicitly: --bundle-source builtin|natal-candidate|transit-candidate|writing-candidate",
      );
    if (!OFFLINE_BUNDLES.includes(bundleSource))
      throw new Error(
        "--bundle-source must be builtin, natal-candidate, transit-candidate or writing-candidate",
      );
  }
  if ("--source-report" in options && !("--responses" in options))
    throw new Error("--source-report binds a replay: pass the extracted --responses file");
  const identities = ["--before-identity", "--after-identity"].filter((flag) => flag in options);
  if ("--compare-natal" in options && identities.length !== 2)
    throw new Error("--compare-natal requires --before-identity and --after-identity records");
  if (!("--compare-natal" in options) && identities.length)
    throw new Error("Identity records apply only to --compare-natal");
  if ("--extract-responses" in options && !options["--output"])
    throw new Error("--extract-responses writes a new file: pass --output");
  const output = options["--output"];
  if ("--write-responses" in options) {
    if (output) throw new Error("--write-responses writes its own file; do not pass --output");
    await writeFile(
      options["--write-responses"],
      `${JSON.stringify(BASELINE_RESPONSES, null, 2)}\n`,
      { flag: "wx" },
    );
    return;
  }
  let result;
  if ("--compare" in options) {
    const [before, after] = options["--compare"];
    result = compareReports(await readJson(before), await readJson(after));
  } else if ("--compare-natal" in options) {
    const [beforePath, afterPath] = options["--compare-natal"];
    const before = await readJsonFile(beforePath);
    const after = await readJsonFile(afterPath);
    result = compareNatalReports(before.value, after.value, {
      beforeIdentity: await readJson(options["--before-identity"]),
      afterIdentity: await readJson(options["--after-identity"]),
      beforeSha256: before.sha256,
      afterSha256: after.sha256,
    });
  } else if ("--extract-responses" in options) {
    result = await extractResponses(await readJson(options["--extract-responses"]), {
      bundleSource,
    });
  } else {
    const source =
      "--source-report" in options ? await readJsonFile(options["--source-report"]) : undefined;
    result = await evaluateReadings({
      bundleSource,
      responses: "--responses" in options ? await readJson(options["--responses"]) : undefined,
      sourceReport: source && { report: source.value, sha256: source.sha256 },
    });
  }
  const rendered = `${JSON.stringify(result, null, 2)}\n`;
  if (output) await writeFile(output, rendered, { flag: "wx" });
  else process.stdout.write(rendered);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Reading evaluation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
