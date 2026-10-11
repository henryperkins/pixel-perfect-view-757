import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { createServer } from "vite";
import { BASELINE_RESPONSES, READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";
import { evaluateReadings, compareReports } from "../scripts/evaluate-readings.mjs";

const originalFetch = globalThis.fetch;
const originalKey = process.env.LOVABLE_API_KEY;
let vite,
  runSyntheticEvaluationCase,
  generateReadingProse,
  combineReadingEvaluationResults,
  DEFAULT_BUNDLE;
let draft, requests;
before(async () => {
  process.env.LOVABLE_API_KEY = "synthetic-live-eval-test-no-network";
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://ai.gateway.lovable.dev/v1/chat/completions");
    requests.push(JSON.parse(init.body));
    return Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
  };
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ runSyntheticEvaluationCase } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ generateReadingProse } = await vite.ssrLoadModule("/src/lib/ai/language.server.ts"));
  ({ combineReadingEvaluationResults } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.shared.ts",
  ));
  ({ DEFAULT_BUNDLE } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
});
beforeEach(() => {
  requests = [];
  draft = structuredClone(BASELINE_RESPONSES["saturn-square-sun"]);
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = originalKey;
  await vite?.close();
});

test("one synthetic case captures actual production prompt and accepted draft without account data", async () => {
  const result = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(requests.length, 1);
  assert.equal(result.case.diagnostics.outcome, "accepted");
  assert.equal(result.case.output.mode, "model");
  assert.deepEqual(result.case.candidate.paragraphs, draft.paragraphs);
  assert.equal(result.case.candidate.truncated, false);
  assert.deepEqual(result.case.request.messages, requests[0].messages);
  assert.deepEqual(result.case.request.response_format, requests[0].response_format);
  assert.equal(result.metadata.source, "live-synthetic");
  assert.equal(
    result.metadata.caseSetHash,
    createHash("sha256").update(JSON.stringify(READING_EVAL_CASES)).digest("hex"),
  );
  assert.ok(!JSON.stringify(result).includes("synthetic-live-eval-test-no-network"));
  assert.ok(!JSON.stringify(result).includes("Authorization"));
  assert.ok(!result.case.facts.some((fact) => /^F/.test(fact.id)));
  assert.ok(Object.values(result.case.manualReview).every((value) => value === null));
});

test("rejected synthetic draft remains inspectable while displayed text uses the template", async () => {
  draft.paragraphs[0].facts.push("UNSUPPLIED");
  draft.providerExtras = { privateMarker: "SHOULD_NOT_EXPORT" };
  draft.paragraphs[0].extra = "SHOULD_NOT_EXPORT";
  const result = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(result.case.diagnostics.code, "id");
  assert.equal(result.case.output.mode, "template");
  assert.equal(result.case.output.body, result.case.template.body);
  assert.ok(result.case.candidate.paragraphs[0].facts.includes("UNSUPPLIED"));
  assert.ok(!JSON.stringify(result).includes("SHOULD_NOT_EXPORT"));
});

test("candidate capture is bounded and reports truncation without changing validator decisions", async () => {
  draft = {
    paragraphs: Array.from({ length: 12 }, () => ({
      text: "x".repeat(6000),
      facts: Array.from({ length: 25 }, () => "z".repeat(100)),
    })),
  };
  const result = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(result.case.diagnostics.code, "count");
  assert.equal(result.case.candidate.paragraphCount, 12);
  assert.equal(result.case.candidate.paragraphs.length, 10);
  assert.equal(result.case.candidate.paragraphs[0].text.length, 4000);
  assert.equal(result.case.candidate.paragraphs[0].facts.length, 20);
  assert.equal(result.case.candidate.paragraphs[0].facts[0].length, 80);
  assert.equal(result.case.candidate.truncated, true);
});

test("quiet and unknown cases never call the gateway", async () => {
  const quiet = await runSyntheticEvaluationCase("quiet-threshold", DEFAULT_BUNDLE);
  assert.equal(quiet.case.diagnostics.code, "no_cycle");
  assert.equal(quiet.case.request, null);
  assert.equal(quiet.case.candidate, null);
  await assert.rejects(
    runSyntheticEvaluationCase("arbitrary-personal-chart", DEFAULT_BUNDLE),
    /fixed.*case|unknown/i,
  );
  assert.equal(requests.length, 0);
});

test("production reading output keeps synthetic observation out of normal metadata", async () => {
  const synthetic = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  const production = await generateReadingProse({
    facts: synthetic.case.facts,
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: {
      headline: synthetic.case.output.headline,
      body: synthetic.case.template.body,
      prompt: synthetic.case.output.prompt,
    },
  });
  assert.equal(production.body, synthetic.case.output.body);
  assert.deepEqual(Object.keys(production).sort(), [
    "body",
    "headline",
    "meta",
    "paragraphs",
    "prompt",
  ]);
  assert.ok(!("candidate" in production.meta));
  assert.ok(!("request" in production.meta));
  assert.equal(production.meta.diagnostics.outcome, "accepted");
  assert.deepEqual(
    requests[0],
    requests[1],
    "Synthetic and production gateway settings stay identical",
  );
});

test("complete model run retains the offline fixture hashes and comparison compatibility", async () => {
  const results = [];
  for (const fixed of READING_EVAL_CASES) {
    draft = structuredClone(BASELINE_RESPONSES[fixed.id]);
    results.push(await runSyntheticEvaluationCase(fixed.id, DEFAULT_BUNDLE));
  }
  const report = combineReadingEvaluationResults(results);
  assert.equal(report.partial, false);
  assert.equal(report.summary.modelAttempts, READING_EVAL_CASES.length - 1);
  assert.equal(report.summary.syntheticModelAcceptanceRate, 1);
  assert.equal(report.summary.liveAcceptanceRate, null);
  const offline = await evaluateReadings();
  assert.equal(compareReports(offline, report).acceptedDelta, 0);
  assert.equal(report.caseSetHash, offline.caseSetHash);
  assert.deepEqual(
    report.cases.map((row) => row.configHash),
    offline.cases.map((row) => row.configHash),
  );
});

test("mixed copy or model configurations cannot combine; partial runs stay explicit", async () => {
  const first = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  draft = structuredClone(BASELINE_RESPONSES["saturn-square-moon-warm"]);
  const second = await runSyntheticEvaluationCase("saturn-square-moon-warm", {
    ...DEFAULT_BUNDLE,
    version: "different-copy",
  });
  assert.throws(
    () => combineReadingEvaluationResults([first, second], { partial: true }),
    /configuration changed/i,
  );
  assert.throws(() => combineReadingEvaluationResults([first]), /all fixed cases/i);
  const partial = combineReadingEvaluationResults([first], { partial: true });
  assert.equal(partial.partial, true);
  assert.equal(partial.expectedCases, READING_EVAL_CASES.length);
  assert.equal(partial.cases.length, 1);
  assert.throws(() => compareReports(partial, partial), /partial/i);
  const incorrectlyMarkedComplete = { ...partial, partial: false };
  assert.throws(
    () => compareReports(incorrectlyMarkedComplete, incorrectlyMarkedComplete),
    /fixed case/i,
  );
});

test("synthesis report retains bounded plan identity and graph metadata", async () => {
  draft = structuredClone(BASELINE_RESPONSES["synthesis-tension"]);
  const result = await runSyntheticEvaluationCase("synthesis-tension", DEFAULT_BUNDLE);
  assert.equal(result.metadata.planVersion, "daily-synthesis-1");
  assert.equal(result.case.interpretationPlan.pairStatus, "selected");
  assert.equal(result.case.interpretationPlan.synthesis.relationship, "tension");
  assert.deepEqual(result.case.facts.find((f) => f.id === "S1").dependsOn, [
    "C1",
    "I1",
    "C2",
    "I2",
  ]);
  assert.equal(result.case.diagnostics.outcome, "accepted");
});

test("mid-run plan policy changes are rejected while deliberate cross-policy comparisons remain usable", async () => {
  const first = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  draft = structuredClone(BASELINE_RESPONSES["saturn-square-moon-warm"]);
  const second = await runSyntheticEvaluationCase("saturn-square-moon-warm", DEFAULT_BUNDLE);
  second.metadata.planVersion = "daily-synthesis-next";
  assert.throws(
    () => combineReadingEvaluationResults([first, second], { partial: true }),
    /configuration changed/,
  );
  const before = await evaluateReadings();
  const after = structuredClone(before);
  after.planVersion = "daily-synthesis-next";
  const compared = compareReports(before, after);
  assert.ok(compared.configurationChanges.some((c) => c.field === "planVersion"));
  delete before.planVersion;
  assert.equal(compareReports(before, after).before.planVersion, null);
});
