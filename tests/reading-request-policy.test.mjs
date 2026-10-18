import { readFile } from "node:fs/promises";
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
  assert.equal(accepted.case.diagnostics.validatorVersion, "daily-reference-10");
});

test("daily uses one 60-second call and exports its budget without changing provider settings", async () => {
  const result = await runCase("saturn-square-sun", bundle);
  assert.deepEqual(budgets, [60_000]);
  assert.equal(calls, 1);
  assert.equal(result.metadata.gatewayTimeoutMs, 60_000);
  assert.equal(result.case.diagnostics.gatewayTimeoutMs, 60_000);
  assert.equal(result.metadata.promptVersion, "daily-astro-body-16");
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
      boundary === "fetch"
        ? waitForAbort(signal)
        : new Response(
            new ReadableStream({
              start(stream) {
                signal.addEventListener("abort", () => stream.error(signal.reason), { once: true });
                queueMicrotask(() =>
                  controller.abort(new DOMException("private-fixture-error", "TimeoutError")),
                );
              },
            }),
            { headers: { "content-type": "application/json" } },
          );
    try {
      const result = await runCase("saturn-square-sun", bundle);
      assert.equal(result.case.diagnostics.code, "timeout");
      assert.equal(result.case.output.body, result.case.template.body);
      assert.equal(result.case.candidate, null);
      assert.equal(calls, 1);
      assert.deepEqual(budgets, [60_000]);
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

test("historical version-5 comparison records changed or unrecorded gateway budgets", async () => {
  const current = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-natal-lens/2026-10-11-blinded-review/baseline-report.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const earlier = structuredClone(current);
  earlier.gatewayTimeoutMs = 12_000;
  const changed = compareReports(earlier, current);
  assert.deepEqual(changed.configurationChanges, [
    { field: "gatewayTimeoutMs", before: 12_000, after: 60_000 },
  ]);
  assert.equal(changed.before.gatewayTimeoutMs, 12_000);
  assert.equal(changed.after.gatewayTimeoutMs, 60_000);
  delete earlier.gatewayTimeoutMs;
  const unrecorded = compareReports(earlier, current);
  assert.equal(unrecorded.before.gatewayTimeoutMs, null);
  assert.deepEqual(unrecorded.configurationChanges, [
    { field: "gatewayTimeoutMs", before: null, after: 60_000 },
  ]);
  assert.throws(
    () => compareReports({ ...current, gatewayTimeoutMs: "20000" }, current),
    /invalid gateway/i,
  );
});

test("current transit comparison refuses changed or unrecorded gateway budgets", async () => {
  const current = await evaluateReadings();
  const changed = structuredClone(current);
  changed.gatewayTimeoutMs = 12_000;
  assert.throws(() => compareReports(changed, current), /frozen|policy/i);
  delete changed.gatewayTimeoutMs;
  assert.throws(() => compareReports(changed, current), /frozen|policy/i);
});

test("claim-strength guidance is sent with unchanged source statements, parents, suppression and body-only schema", async () => {
  // This proves what is dispatched, not that the model follows it: semantic
  // results come only from fresh review of actual model prose.
  for (const caseId of ["synthesis-reinforcement", "synthesis-independent", "unknown-birth-time"]) {
    responder = async () => envelope(BASELINE_RESPONSES[caseId]);
    const result = await runCase(caseId, bundle);
    const request = requests.at(-1);
    const [system, user] = request.messages;
    assert.match(system.content, /a possibility stays a possibility/i);
    assert.match(user.content, /Preserve the modality of each supplied statement/);
    assert.match(user.content, /often, usually, always, must, needs to or relies on/);
    assert.match(user.content, /do not rule out an alternative that no fact mentions/);
    assert.match(user.content, /do not turn them into the reader's history/);
    for (const fact of result.case.facts)
      assert.ok(user.content.includes(`${fact.id}: ${fact.statement}`), `${caseId} ${fact.id}`);
    const schema = request.response_format.json_schema.schema;
    assert.deepEqual(Object.keys(schema.properties), ["paragraphs"]);
    assert.deepEqual(schema.required, ["paragraphs"]);
    assert.equal(schema.additionalProperties, false);
    assert.equal(result.case.diagnostics.outcome, "accepted", caseId);
  }
  const [reinforcement, independent, suppressed] = requests.map((r) => r.messages[1].content);
  assert.ok(reinforcement.includes('"facts": ["S1", "C1", "I1", "C2", "I2"]'));
  assert.match(reinforcement, /"can increase" stays "can increase"/);
  const relationship = reinforcement
    .split("\n")
    .find((line) => line.startsWith("Develop the supplied published relationship"));
  assert.match(
    relationship,
    /For a reinforcement relationship, give the two joined meanings distinct paragraph functions, as S1 relates them, instead of restating one idea in both paragraphs/,
  );
  // Any published reinforcement rule may arrive here, so the instruction names no rule's themes.
  assert.doesNotMatch(relationship, /sustained|commitment|targeted|persistence|progress/i);
  for (const prompt of [independent, suppressed]) {
    assert.match(prompt, /No S1 is supplied: do not invent a joint relationship or premise/);
    assert.doesNotMatch(prompt, /For a reinforcement relationship/);
  }
  assert.match(suppressed, /Angle claims are suppressed/);
  assert.match(suppressed, /House claims are suppressed: do not mention houses or cusps\./);
  assert.equal(calls, 3, "One dispatch per eligible case, no retries");
});
test("arc guidance does not require absent sources and retains actual synthesis and lens requirements", async () => {
  const { TRANSIT_CANDIDATE_BUNDLE } = await vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  for (const caseId of ["arc-opening-three", "arc-synthesis-natal-integration"]) {
    const result = await runCase(caseId, TRANSIT_CANDIDATE_BUNDLE);
    const prompt = result.case.request.messages[1].content;
    const arc = prompt.split("\n").find((line) => line.startsWith("Copy A1's chronology"));
    assert.ok(arc);
    assert.doesNotMatch(arc, /S1|N1/);
    assert.match(arc, /unchanged exactly once in paragraph 1 or 2/);
    assert.match(arc, /P2.*I1.*paragraph 1 or 2/);
    assert.match(arc, /four-sentence paragraph limit/);
    if (caseId === "arc-opening-three") {
      assert.ok(!result.case.facts.some((f) => ["S1", "N1"].includes(f.id)));
      assert.doesNotMatch(
        prompt,
        /Apply the supplied N1|Develop the supplied published relationship/,
      );
    } else {
      assert.match(prompt, /Apply the supplied N1 possibility/);
      assert.match(prompt, /Develop the supplied published relationship/);
    }
  }
});

test("historical strengthening needs review while combined window/exact timing is rejected", async () => {
  // Paragraphs from the hosted pre-correction report (docs/reviews/daily-reading-writing/2026-10-11).
  // Each adds an exclusion, a reader event, a frequency or a firmer joint claim
  // that the facts do not supply. The bounded timing guard now catches one
  // combined sentence; other semantic defects still require independent review.
  const observed = {
    "natal-moon-fallback": [
      {
        text: "Expectations can outpace available capacity when an established role begins to demand more deliberate effort than usual. Rather than indicating a sudden change in purpose, Saturn's square to the Sun highlights where daily obligations have expanded, showing where an ongoing routine or responsibility needs clearer boundaries.",
        facts: ["C1", "I1"],
      },
      {
        text: "A title rarely describes everything that holds your attention across a normal week. An interest you seldom mention, or an unwritten responsibility that occupies more time than your position suggests, can make that division concrete.",
        facts: ["D1"],
      },
    ],
    "natal-freedom-reflex": [
      {
        text: "An unclaimed hour can remain crowded if an obligation follows you into what was meant to be rest. Saturn's square to the Moon frames this friction between what you feel responsible for and the amount of uninterrupted space you prefer. A small duty often takes up more room than its calendar footprint suggests.",
        facts: ["C1", "D1", "I1"],
      },
      {
        text: "This contact is in its approaching phase within the calculated window. The current orb is 0.42 degrees. The calculated exact date is 2026-10-14, falling in 3 days during the middle part of the window.",
        facts: ["C1", "P1", "T1"],
      },
    ],
    "natal-synthesis-integration": [
      {
        text: "Expectations can easily outpace available capacity when an established role requires more deliberate effort than usual. Saturn's square to the Sun marks moments where an everyday routine or responsibility asks for firmer boundaries.",
        facts: ["C1", "I1"],
      },
      {
        text: "At the same time, practical initiative and enthusiasm reinforce each other when an aim is well chosen, making it natural to pursue an emerging opening. Jupiter's trine to Mars frames this low-friction effort, though giving a plan more scope also increases the structure needed to support it. A task whose ambitions extend beyond its initial boundaries shows how that expansion interacts with existing limits.",
        facts: ["S1", "C1", "I1", "C2", "I2"],
      },
    ],
  };
  for (const [caseId, paragraphs] of Object.entries(observed)) {
    responder = async () => envelope({ paragraphs });
    const result = await runCase(caseId, bundle);
    const timingRejected = caseId === "natal-freedom-reflex";
    assert.equal(result.case.diagnostics.outcome, timingRejected ? "rejected" : "accepted", caseId);
    assert.equal(result.case.output.mode, timingRejected ? "template" : "model", caseId);
    if (timingRejected) assert.equal(result.case.diagnostics.code, "timing");
  }
});

test("daily has a distinct editorial system brief while natal keeps the original brief", async () => {
  const { DAILY_SYSTEM_VOICE } = await vite.ssrLoadModule("/src/lib/ai/daily-voice.ts");
  await runCase("saturn-square-sun", bundle);
  assert.equal(requests[0].messages[0].content, DAILY_SYSTEM_VOICE);
  assert.match(requests[0].messages[0].content, /Published interpretations/);
  responder = async () =>
    envelope({
      paragraphs: [{ text: "A supplied pattern.", facts: ["F1"] }],
      reflection_question: "What do you notice?",
    });
  await language.generateFeatureNarrative({
    facts: [{ id: "F1", statement: "Supplied pattern." }],
    title: "Synthetic",
    tone: "plain",
  });
  assert.match(requests[1].messages[0].content, /already-calculated facts/);
  assert.notEqual(requests[1].messages[0].content, DAILY_SYSTEM_VOICE);
  assert.deepEqual(budgets, [60_000, 90_000]);
});
