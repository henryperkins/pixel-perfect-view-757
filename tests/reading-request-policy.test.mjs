import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer } from "vite";
import { BASELINE_RESPONSES } from "../scripts/reading-eval-cases.mjs";
import { compareReports, evaluateReadings } from "../scripts/evaluate-readings.mjs";

const originalFetch = globalThis.fetch;
const originalTimeout = AbortSignal.timeout;
const originalKey = process.env.LOVABLE_API_KEY;
let vite, language, runCase, bundle, combine, responder, calls, budgets, requests;

before(async () => {
  process.env.LOVABLE_API_KEY = "synthetic-policy-test-no-network";
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://ai.gateway.lovable.dev/v1/chat/completions");
    calls += 1;
    requests.push(JSON.parse(init.body));
    return responder(init);
  };
  AbortSignal.timeout = (milliseconds) => {
    budgets.push(milliseconds);
    return originalTimeout.call(AbortSignal, milliseconds);
  };
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  language = await vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  ({ runSyntheticEvaluationCase: runCase } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ combineReadingEvaluationResults: combine } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.shared.ts",
  ));
  ({ DEFAULT_BUNDLE: bundle } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
});
beforeEach(() => {
  calls = 0;
  budgets = [];
  requests = [];
  responder = async () => envelope(BASELINE_RESPONSES["saturn-square-sun"]);
});
after(async () => {
  globalThis.fetch = originalFetch;
  AbortSignal.timeout = originalTimeout;
  if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = originalKey;
  await vite?.close();
});
const envelope = (draft) =>
  Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });

test("timing instructions explicitly require the cycle even when T1 repeats its number", async () => {
  const draft = structuredClone(BASELINE_RESPONSES["jupiter-trine-sun-technical"]);
  draft.paragraphs[2] = {
    text: "The calculated arc position is 30%, with an orb of 0.42°. This is the tightest point of the window.",
    facts: ["P1", "T1"],
  };
  responder = async () => envelope(draft);
  const rejected = await runCase("jupiter-trine-sun-technical", bundle);
  assert.equal(rejected.case.diagnostics.code, "orb");
  assert.equal(rejected.case.diagnostics.paragraph, 3);
  draft.paragraphs[2].facts.unshift("C1");
  const accepted = await runCase("jupiter-trine-sun-technical", bundle);
  assert.equal(accepted.case.diagnostics.outcome, "accepted");
  const prompt = accepted.case.request.messages[1].content;
  assert.match(prompt, /even (?:when|if).*T1/i);
  assert.match(prompt, /\["C1", "P1", "T1"\]/);
  assert.equal(accepted.case.diagnostics.validatorVersion, "daily-reference-1");
});

test("daily uses one 20-second call and exports its budget without changing provider settings", async () => {
  const result = await runCase("saturn-square-sun", bundle);
  assert.deepEqual(budgets, [20_000]);
  assert.equal(calls, 1);
  assert.equal(result.metadata.gatewayTimeoutMs, 20_000);
  assert.equal(result.case.diagnostics.gatewayTimeoutMs, 20_000);
  assert.equal(result.metadata.promptVersion, "daily-astro-body-2");
  assert.deepEqual(Object.keys(requests[0]).sort(), ["messages", "model", "response_format"]);
});

test("a response taking 15 simulated seconds can pass the new daily deadline", async () => {
  const saved = AbortSignal.timeout;
  AbortSignal.timeout = (milliseconds) => {
    budgets.push(milliseconds);
    return originalTimeout.call(AbortSignal, milliseconds / 100);
  };
  try {
    responder = ({ signal }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", abort);
          resolve(envelope(BASELINE_RESPONSES["saturn-square-sun"]));
        }, 150);
        const abort = () => {
          clearTimeout(timer);
          reject(signal.reason);
        };
        signal.addEventListener("abort", abort, { once: true });
      });
    const result = await runCase("saturn-square-sun", bundle);
    assert.equal(result.case.diagnostics.outcome, "accepted");
    assert.equal(calls, 1, "No retry is used to recover a slow response");
  } finally {
    AbortSignal.timeout = saved;
  }
});

for (const boundary of ["fetch", "response body"]) {
  test(`deadline abort during ${boundary} returns a safe fallback without retry`, async () => {
    const saved = AbortSignal.timeout;
    const controller = new AbortController();
    AbortSignal.timeout = (milliseconds) => {
      budgets.push(milliseconds);
      return controller.signal;
    };
    const waitForAbort = (signal) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        queueMicrotask(() =>
          controller.abort(new DOMException("private-fixture-error", "TimeoutError")),
        );
      });
    responder = async ({ signal }) =>
      boundary === "fetch" ? waitForAbort(signal) : { ok: true, json: () => waitForAbort(signal) };
    try {
      const result = await runCase("saturn-square-sun", bundle);
      assert.equal(result.case.diagnostics.code, "timeout");
      assert.equal(result.case.output.body, result.case.template.body);
      assert.equal(result.case.candidate, null);
      assert.equal(calls, 1);
      assert.deepEqual(budgets, [20_000]);
      assert.ok(!JSON.stringify(result).includes("private-fixture-error"));
    } finally {
      AbortSignal.timeout = saved;
    }
  });
}

test("natal narrative keeps its independent 90-second request budget", async () => {
  responder = async () =>
    envelope({
      paragraphs: [{ text: "A supplied natal pattern. A second sentence.", facts: ["F1"] }],
      reflection_question: "Where do you recognise this pattern in your life?",
    });
  await language.generateFeatureNarrative({
    facts: [{ id: "F1", statement: "Synthetic natal pattern." }],
    title: "Synthetic natal chapter",
    tone: "plain",
  });
  assert.deepEqual(budgets, [90_000]);
  assert.equal(calls, 1);
});

test("a mid-run timeout-policy change cannot combine with completed cases", async () => {
  const first = await runCase("saturn-square-sun", bundle);
  responder = async () => envelope(BASELINE_RESPONSES["saturn-square-moon-warm"]);
  const second = await runCase("saturn-square-moon-warm", bundle);
  const mixed = structuredClone(second);
  mixed.metadata.gatewayTimeoutMs = 12_000;
  assert.throws(() => combine([first, mixed], { partial: true }), /configuration changed/i);
});

test("comparison exposes changed or unrecorded budgets instead of inferring prior policy", async () => {
  const current = await evaluateReadings();
  const earlier = structuredClone(current);
  earlier.gatewayTimeoutMs = 12_000;
  const changed = compareReports(earlier, current);
  assert.deepEqual(changed.configurationChanges, [
    { field: "gatewayTimeoutMs", before: 12_000, after: 20_000 },
  ]);
  assert.equal(changed.before.gatewayTimeoutMs, 12_000);
  assert.equal(changed.after.gatewayTimeoutMs, 20_000);
  delete earlier.gatewayTimeoutMs;
  const unrecorded = compareReports(earlier, current);
  assert.equal(unrecorded.before.gatewayTimeoutMs, null);
  assert.deepEqual(unrecorded.configurationChanges, [
    { field: "gatewayTimeoutMs", before: null, after: 20_000 },
  ]);
  assert.throws(
    () => compareReports({ ...current, gatewayTimeoutMs: "20000" }, current),
    /invalid gateway/i,
  );
});
