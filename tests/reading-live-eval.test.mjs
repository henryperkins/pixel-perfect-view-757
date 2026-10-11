import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { BASELINE_RESPONSES, READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";
import { evaluateReadings, compareReports } from "../scripts/evaluate-readings.mjs";

const originalFetch = globalThis.fetch;
const originalKey = process.env.LOVABLE_API_KEY;
let vite,
  runSyntheticEvaluationCase,
  generateReadingProse,
  combineReadingEvaluationResults,
  DEFAULT_BUNDLE,
  NATAL_CANDIDATE_BUNDLE;
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
  ({ NATAL_CANDIDATE_BUNDLE } = await vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
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

test("lossless capture is proven before truncation or sanitization", async () => {
  const accepted = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(accepted.case.diagnostics.outcome, "accepted");
  assert.equal(accepted.case.candidate.captureLossless, true);
  // The exact trap: a non-numeric fact ID filter would otherwise look like a clean capture.
  draft = structuredClone(BASELINE_RESPONSES["saturn-square-sun"]);
  draft.paragraphs[0].facts = ["C1", "I1", 42];
  const sanitized = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(sanitized.case.diagnostics.outcome, "rejected");
  assert.deepEqual(sanitized.case.candidate.paragraphs[0].facts, ["C1", "I1"]);
  assert.equal(sanitized.case.candidate.truncated, false);
  assert.equal(sanitized.case.candidate.captureLossless, false);
  for (const paragraphs of [
    [{ text: 7, facts: ["C1"] }, BASELINE_RESPONSES["saturn-square-sun"].paragraphs[1]],
    [{ text: "No facts field." }, BASELINE_RESPONSES["saturn-square-sun"].paragraphs[1]],
    ["not an object", BASELINE_RESPONSES["saturn-square-sun"].paragraphs[1]],
  ]) {
    draft = { paragraphs };
    const result = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
    assert.equal(result.case.candidate.captureLossless, false, JSON.stringify(paragraphs[0]));
  }
  draft = {
    paragraphs: Array.from({ length: 12 }, () => ({ text: "x".repeat(6000), facts: ["C1"] })),
  };
  const truncated = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(truncated.case.candidate.truncated, true);
  assert.equal(truncated.case.candidate.captureLossless, false);
});

test("evaluation input accepts only a fixed case ID and a closed bundle selector", async () => {
  const { readingEvaluationInputSchema } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.shared.ts",
  );
  assert.deepEqual(readingEvaluationInputSchema.parse({ caseId: "saturn-square-sun" }), {
    caseId: "saturn-square-sun",
  });
  for (const bundleSource of ["active", "builtin", "natal-candidate"])
    assert.equal(
      readingEvaluationInputSchema.parse({ caseId: "saturn-square-sun", bundleSource })
        .bundleSource,
      bundleSource,
    );
  for (const extra of [
    { bundleSource: "custom" },
    { bundleSource: { version: "builtin-0.6.0" } },
    { bundle: DEFAULT_BUNDLE },
    { chart: {} },
    { prompt: "Write freely." },
    { model: "another-model" },
    { context: { userId: "someone" } },
  ])
    assert.throws(() =>
      readingEvaluationInputSchema.parse({ caseId: "saturn-square-sun", ...extra }),
    );
});

test("a bundle selector change cannot combine with completed cases; absent history stays absent", async () => {
  const first = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  draft = structuredClone(BASELINE_RESPONSES["saturn-square-moon-warm"]);
  const second = await runSyntheticEvaluationCase("saturn-square-moon-warm", DEFAULT_BUNDLE);
  const historical = combineReadingEvaluationResults([first, second], { partial: true });
  assert.ok(!Object.hasOwn(historical, "bundleSource"));
  const tagged = (result, bundleSource) => ({
    ...result,
    metadata: { ...result.metadata, bundleSource },
  });
  const report = combineReadingEvaluationResults(
    [tagged(first, "builtin"), tagged(second, "builtin")],
    { partial: true },
  );
  assert.equal(report.bundleSource, "builtin");
  assert.throws(
    () =>
      combineReadingEvaluationResults([tagged(first, "builtin"), tagged(second, "active")], {
        partial: true,
      }),
    /configuration changed/i,
  );
});

test("the admin panel offers a labeled, closed evaluation-copy selector defaulting to active copy", async () => {
  const stubs = fileURLToPath(
    new URL("./helpers/reading-evaluation-ui-stubs.mjs", import.meta.url),
  );
  const ui = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    resolve: {
      alias: [
        { find: /^@tanstack\/react-start$/, replacement: stubs },
        { find: /^@\/lib\/pattern\.functions$/, replacement: stubs },
        { find: /^@\//, replacement: fileURLToPath(new URL("../src/", import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  try {
    const { ReadingEvaluation } = await ui.ssrLoadModule(
      "/src/components/pattern/ReadingEvaluation.tsx",
    );
    const markup = renderToStaticMarkup(createElement(ReadingEvaluation));
    assert.match(
      markup,
      /<label[^>]*for="synthetic-evaluation-copy"[^>]*>Evaluation copy<\/label>/,
    );
    const select = markup.match(/<select[^>]*id="synthetic-evaluation-copy"[^>]*>(.*?)<\/select>/);
    assert.ok(select, "A native select carries the choice");
    const options = [
      ...select[1].matchAll(/<option value="([^"]+)"( selected="")?>([^<]+)<\/option>/g),
    ];
    assert.deepEqual(
      options.map(([, value, selected, label]) => [value, Boolean(selected), label]),
      [
        ["active", true, "Current active copy"],
        ["builtin", false, "Natal-free built-in baseline"],
        ["natal-candidate", false, "Inactive natal candidate"],
      ],
    );
    assert.match(markup, /aria-describedby="synthetic-evaluation-copy-note"/);
    assert.match(markup, /id="synthetic-evaluation-copy-note"[^>]*>[^<]*published release/);
  } finally {
    await ui.close();
  }
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
  // The natal suite qualifies the candidate release, as an isolated environment would.
  const results = [];
  for (const fixed of READING_EVAL_CASES) {
    draft = structuredClone(BASELINE_RESPONSES[fixed.id]);
    results.push(await runSyntheticEvaluationCase(fixed.id, NATAL_CANDIDATE_BUNDLE));
  }
  const report = combineReadingEvaluationResults(results);
  assert.equal(report.partial, false);
  assert.equal(report.summary.modelAttempts, READING_EVAL_CASES.length - 1);
  assert.equal(report.summary.syntheticModelAcceptanceRate, 1);
  assert.equal(report.summary.liveAcceptanceRate, null);
  const offline = await evaluateReadings();
  assert.equal(report.transitCopyHash, offline.transitCopyHash);
  assert.equal(compareReports(offline, report).acceptedDelta, 0);
  // A natal-free baseline run on the deployed fallback shares the same transit copy.
  draft = structuredClone(BASELINE_RESPONSES["saturn-square-sun"]);
  const fallback = await runSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  assert.equal(fallback.metadata.transitCopyHash, report.transitCopyHash);
  assert.notEqual(fallback.metadata.bundleHash, report.bundleHash);
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
