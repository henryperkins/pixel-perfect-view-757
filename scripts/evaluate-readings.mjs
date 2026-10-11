import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

/** Runs the production assembly, facts and generation code against fixed synthetic input and replayed JSON. */
export async function evaluateReadings({ responses = undefined } = {}) {
  const source = responses === undefined ? "synthetic-baseline" : "candidate-replay";
  const replayResponses = validateResponses(responses ?? BASELINE_RESPONSES);
  const originalKey = process.env.LOVABLE_API_KEY;
  // The real gateway code is exercised, but this value is never sent over a socket or included in reports.
  process.env.LOVABLE_API_KEY = "synthetic-evaluation-no-network";
  let vite;
  let currentResponse;
  let currentRequests = [];
  let gatewayReplays = 0;
  try {
    return await withNetworkBlocked(
      async () => {
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
        const { assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts");
        const { readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts");
        const { generateReadingProse, LANGUAGE_MODEL } = await vite.ssrLoadModule(
          "/src/lib/ai/language.server.ts",
        );
        const { DEFAULT_BUNDLE } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
        const { localNoon, daysToLocalDate } = await vite.ssrLoadModule("/src/lib/local-day.ts");
        const { DAILY_PROMPT_VERSION, DAILY_VALIDATOR_VERSION } = await vite.ssrLoadModule(
          "/src/lib/ai/diagnostics.ts",
        );
        const cases = [];
        for (const fixed of READING_EVAL_CASES) {
          currentResponse = replayResponses[fixed.id];
          currentRequests = [];
          const reference = localNoon(fixed.config.day, fixed.config.timeZone);
          const cycles = fixed.cycles.map((cycle) => ({
            ...cycle,
            days_to_exact: cycle.exact_at
              ? daysToLocalDate(cycle.exact_at, fixed.config.day, fixed.config.timeZone)
              : null,
          }));
          const assembled = assembleReading(
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
            DEFAULT_BUNDLE,
          );
          const facts = readingFacts(fixed.chart, assembled, fixed.config.timeZone);
          const output = await generateReadingProse({
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
          });
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
              notes: null,
            },
          });
        }
        return {
          reportVersion: REPORT_VERSION,
          fixtureVersion: READING_EVAL_FIXTURE_VERSION,
          caseSetHash: hash(READING_EVAL_CASES),
          bundleVersion: DEFAULT_BUNDLE.version,
          bundleHash: hash(DEFAULT_BUNDLE),
          promptVersion: DAILY_PROMPT_VERSION,
          validatorVersion: DAILY_VALIDATOR_VERSION,
          model: LANGUAGE_MODEL,
          source,
          network: "blocked; gateway replayed in memory",
          warning: WARNING,
          summary: summarize(cases, gatewayReplays),
          cases,
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
  } finally {
    await vite?.close();
    if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
    else process.env.LOVABLE_API_KEY = originalKey;
  }
}

function validateReport(report) {
  if (report?.reportVersion !== REPORT_VERSION || !Array.isArray(report.cases))
    throw new Error("Unsupported evaluation report");
  if (report.partial === true) throw new Error("Cannot compare a partial evaluation report");
  const ids = report.cases.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error("Report contains duplicate case IDs");
  if (JSON.stringify([...ids].sort()) !== JSON.stringify(caseIds().sort()))
    throw new Error("Report must contain exactly the fixed case IDs");
  if (report.cases.some((item) => !item.configHash || !item.diagnostics?.outcome))
    throw new Error("Report contains an incomplete case config or diagnostics");
}

export function compareReports(before, after) {
  validateReport(before);
  validateReport(after);
  if (before.fixtureVersion !== after.fixtureVersion)
    throw new Error("Cannot compare different fixture versions");
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
    "promptVersion",
    "validatorVersion",
    "bundleVersion",
    "bundleHash",
    "model",
    "source",
  ]
    .filter((field) => before[field] !== after[field])
    .map((field) => ({ field, before: before[field], after: after[field] }));
  return {
    reportVersion: REPORT_VERSION,
    fixtureVersion: before.fixtureVersion,
    before: {
      promptVersion: before.promptVersion,
      validatorVersion: before.validatorVersion,
      bundleHash: before.bundleHash,
      model: before.model,
      source: before.source,
    },
    after: {
      promptVersion: after.promptVersion,
      validatorVersion: after.validatorVersion,
      bundleHash: after.bundleHash,
      model: after.model,
      source: after.source,
    },
    configurationChanges,
    warning: "Replay changes do not establish live acceptance, grounding, or writing quality.",
    acceptedDelta:
      after.cases.filter((item) => item.diagnostics.outcome === "accepted").length -
      before.cases.filter((item) => item.diagnostics.outcome === "accepted").length,
    cases,
  };
}

async function readJson(path) {
  const text = await readFile(path, "utf8");
  if (text.length > 2_000_000) throw new Error("Evaluation JSON must be smaller than 2 MB");
  return JSON.parse(text);
}

async function main(args) {
  let output;
  let responsesPath;
  let responseExport;
  let comparison;
  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--output":
        output = args[++i];
        break;
      case "--responses":
        responsesPath = args[++i];
        break;
      case "--write-responses":
        responseExport = args[++i];
        break;
      case "--compare":
        comparison = [args[++i], args[++i]];
        break;
      case "--help":
        process.stdout.write(
          "Offline synthetic reading evaluator\n  --output report.json\n  --responses candidate.json --output report.json\n  --write-responses candidate.json\n  --compare before.json after.json --output comparison.json\n",
        );
        return;
      default:
        throw new Error(`Unknown argument: ${args[i]}`);
    }
    if (args[i] === undefined) throw new Error("Missing argument value");
  }
  if (
    [Boolean(responsesPath), Boolean(responseExport), Boolean(comparison)].filter(Boolean).length >
    1
  )
    throw new Error("Choose one mode: baseline, responses, write-responses, or compare");
  if (responseExport) {
    if (output) throw new Error("--write-responses writes its own file; do not pass --output");
    await writeFile(responseExport, `${JSON.stringify(BASELINE_RESPONSES, null, 2)}\n`, {
      flag: "wx",
    });
    return;
  }
  const result = comparison
    ? compareReports(await readJson(comparison[0]), await readJson(comparison[1]))
    : await evaluateReadings({
        responses: responsesPath ? await readJson(responsesPath) : undefined,
      });
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
