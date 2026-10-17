import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { readContextBenchmarks } from "./helpers/context-writing-fixture.mjs";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

const ORIGIN = "https://pattern.example.test";
const IDS = [
  "contact-only",
  "natal-only",
  "transit-only",
  "natal-and-transit",
  "synthesis-natal-and-transit",
];
let h, runs, shared, postStep, benchmarks;
before(async () => {
  h = await createRecordsHarness();
  runs = await h.vite.ssrLoadModule("/src/lib/evaluation-runs.server.ts");
  shared = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.shared.ts");
  postStep = (await h.vite.ssrLoadModule("/src/routes/api/public/evaluation-step.ts")).Route.options
    .server.handlers.POST;
  benchmarks = (await readContextBenchmarks()).cases;
});
beforeEach(async () => h.reset());
after(async () => h?.close());

async function preview() {
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  return runs.previewEvaluationPlan(h.records(), h.userA, { mode: "context-pilot" });
}
async function begin() {
  const prepared = await preview();
  return runs.startEvaluationRun(
    h.records(),
    h.userA,
    { mode: "context-pilot", expectedPlanHash: prepared.hash },
    ORIGIN,
  );
}
const stored = (id) => h.sqlite.prepare("SELECT * FROM evaluation_runs WHERE id=?").get(id);
async function signedStep(run, position, { planHash } = {}) {
  const body = JSON.stringify({
    runId: run.id,
    position,
    planHash: planHash ?? JSON.parse(stored(run.id).plan).hash,
  });
  const response = await postStep({
    request: new Request(`${ORIGIN}/api/public/evaluation-step`, {
      method: "POST",
      headers: {
        "x-pattern-signature": createHmac("sha256", process.env.PATTERN_WORKFLOW_SECRET)
          .update(body)
          .digest("hex"),
      },
      body,
    }),
  });
  assert.equal(response.status, 200);
  return response.json();
}
const capture = (run) => runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
function otherTables() {
  return Object.fromEntries(
    h.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('evaluation_runs','evaluation_results') ORDER BY name",
      )
      .all()
      .map(({ name }) => [name, h.sqlite.prepare(`SELECT * FROM "${name}"`).all()]),
  );
}
function provider({
  rejected = false,
  lossy = false,
  unknownUsage = false,
  fail = false,
  actualModel = "gemini-3.8-flash-20260902",
  finishReason = "STOP",
  tokens = { input: 100, output: 100, thinking: 50 },
  beforeResponse = async () => {},
} = {}) {
  let position = 0;
  h.setGeminiEnterprise(async () => {
    const index = position++;
    await beforeResponse(index);
    if (fail) throw Error("Controlled uncertain provider transport");
    const paragraphs = lossy
      ? [{ text: "x".repeat(4001), facts: ["C1", "I1"], scenes: [] }]
      : rejected
        ? [
            {
              text: `A possible comparison remains open to interpretation ${index + 1}.`,
              facts: ["C1", "I1"],
              scenes: [],
            },
          ]
        : benchmarks[index].paragraphs;
    return Response.json({
      modelVersion: typeof actualModel === "function" ? actualModel(index) : actualModel,
      responseId: `context-test-${index + 1}`,
      usageMetadata: unknownUsage
        ? {}
        : {
            promptTokenCount: tokens.input,
            candidatesTokenCount: tokens.output,
            thoughtsTokenCount: tokens.thinking,
            totalTokenCount: tokens.input + tokens.output + tokens.thinking,
          },
      candidates: [
        { finishReason, content: { parts: [{ text: JSON.stringify({ paragraphs }) }] } },
      ],
    });
  });
}

test("context pilot input fixes its mode, reviewed plan and bounded source", () => {
  assert.equal(
    shared.readingEvaluationPreviewInputSchema.safeParse({ mode: "context-pilot" }).success,
    true,
  );
  assert.equal(
    shared.readingEvaluationRunInputSchema.safeParse({
      mode: "context-pilot",
      expectedPlanHash: "a".repeat(64),
    }).success,
    true,
  );
  for (const extra of [
    { provider: "lovable" },
    { source: "active" },
    { cases: ["contact-only"] },
    { budget: { dollarCeilingCents: 1000 } },
  ])
    assert.equal(
      shared.readingEvaluationPreviewInputSchema.safeParse({ mode: "context-pilot", ...extra })
        .success,
      false,
    );
  assert.equal(
    shared.readingEvaluationRunInputSchema.safeParse({ mode: "context-pilot" }).success,
    false,
  );
});

test("preview freezes five exact context benchmarks and never dispatches or publishes", async () => {
  provider();
  const prepared = await preview();
  assert.deepEqual(
    prepared.plans.cases.map((item) => item.id),
    IDS,
  );
  assert.equal(prepared.attemptLimit, 5);
  assert.equal(prepared.plans.contextPilot.provider, "gemini-enterprise");
  assert.equal(prepared.plans.contextPilot.version, "daily-context-pilot-4");
  assert.equal(prepared.plans.contextPilot.dollarCeilingMicros, 5_000_000);
  assert.equal(prepared.plans.contextPilot.reviewReserveMicros, 0);
  assert.ok(prepared.plans.cases.every((item) => item.expectsModel));
  assert.equal(
    h.evaluationStarts.length + h.geminiEnterpriseRequests.length + h.gatewayRequests.length,
    0,
  );
  assert.equal(h.releasePublications.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 0);
});

test("signed workflow captures five distinct context outputs with no member or release writes", async () => {
  provider();
  const run = await begin();
  const before = otherTables();
  const firstQuery = h.requests.length;
  assert.equal(run.provider, "gemini-enterprise");
  assert.equal(run.total, 5);
  assert.equal(run.contextPilot.version, "daily-context-pilot-4");
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(h.evaluationStarts[0].callback, `${ORIGIN}/api/public/evaluation-step`);
  for (let position = 0; position < 5; position++)
    assert.equal((await signedStep(run, position)).next, position < 4, stored(run.id).message);
  const saved = await capture(run);
  assert.equal(saved.run.status, "complete");
  assert.equal(saved.ledger.campaignAttempts, 5);
  assert.equal(saved.ledger.dollarCeilingMicros, 5_000_000);
  assert.equal(saved.ledger.reviewReserveMicros, 0);
  assert.equal(saved.ledger.campaignReservedMicros, 16_000);
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(new Set(saved.results.map((item) => item.case.output.body)).size, 5);
  for (const [index, result] of saved.results.entries()) {
    assert.equal(result.case.output.mode, "model");
    assert.equal(
      result.case.output.body,
      benchmarks[index].paragraphs.map((p) => p.text).join("\n\n"),
    );
    assert.equal(result.case.candidate.captureLossless, true);
    assert.equal(result.case.candidate.truncated, false);
    assert.equal(result.metadata.experimentVersion, "daily-context-pilot-4");
    assert.equal(result.metadata.runPlanHash, saved.ledger.sourcePlan.hash);
    assert.equal(result.metadata.bundleSource, "context-pilot");
    assert.equal(result.case.diagnostics.promptVersion, "daily-context-body-4");
    assert.equal(result.case.transport.maxOutputTokens, 65536);
    assert.equal(result.case.transport.deadlineMs, 60000);
    assert.equal(h.geminiEnterpriseRequests[index].generationConfig.maxOutputTokens, 65536);
  }
  assert.deepEqual(otherTables(), before);
  for (const { sql } of h.requests.slice(firstQuery))
    for (const match of sql.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+"?([a-z_]+)/gi))
      assert.ok(["evaluation_runs", "evaluation_results", "user_roles"].includes(match[1]), sql);
  assert.equal(
    h.releasePublications.length +
      h.swissRequests.length +
      h.episodeRequests.length +
      h.calculationRequests.length,
    0,
  );
  await signedStep(run, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  await assert.rejects(() => begin(), /already/);
});

test("lossless structural rejection preserves raw model drafts and continues distinct cases", async () => {
  provider({ rejected: true });
  const run = await begin();
  for (let position = 0; position < 5; position++)
    assert.equal((await signedStep(run, position)).next, position < 4, stored(run.id).message);
  const saved = await capture(run);
  assert.equal(saved.run.status, "complete");
  assert.equal(saved.results.length, 5);
  assert.equal(saved.ledger.campaignAttempts, 5);
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  for (const [index, result] of saved.results.entries()) {
    assert.equal(result.case.output.mode, "template");
    assert.equal(result.case.diagnostics.outcome, "rejected");
    assert.equal(result.case.candidate.captureLossless, true);
    assert.match(result.case.candidate.paragraphs[0].text, new RegExp(`${index + 1}\\.$`));
    assert.equal(result.case.output.body, saved.ledger.sourcePlan.cases[index].template.body);
  }
});

test("overlapping signed steps reserve one model attempt and replay its saved disposition", async () => {
  let entered, finish;
  const entering = new Promise((resolve) => {
    entered = resolve;
  });
  const finished = new Promise((resolve) => {
    finish = resolve;
  });
  provider({
    beforeResponse: async () => {
      entered();
      await finished;
    },
  });
  const run = await begin();
  const first = signedStep(run, 0);
  await entering;
  const duplicate = await signedStep(run, 0);
  assert.equal(duplicate.next, false);
  const pending = await capture(run);
  assert.equal(pending.results.length, 0);
  assert.equal(pending.ledger.campaignAttempts, 1);
  assert.equal(pending.ledger.campaignReservedMicros, 2_800_000);
  finish();
  assert.equal((await first).next, true);
  assert.equal((await signedStep(run, 0)).next, true);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

test("non-admin, wrong plan and non-Enterprise provider cannot dispatch", async () => {
  provider();
  await assert.rejects(
    () => runs.previewEvaluationPlan(h.records(), h.userA, { mode: "context-pilot" }),
    /admin/i,
  );
  const prepared = await preview();
  await assert.rejects(
    () =>
      runs.startEvaluationRun(
        h.records(),
        h.userA,
        { mode: "context-pilot", expectedPlanHash: "0".repeat(64) },
        ORIGIN,
      ),
    /changed/,
  );
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  await assert.rejects(
    () => runs.previewEvaluationPlan(h.records(), h.userA, { mode: "context-pilot" }),
    /Enterprise|provider/i,
  );
  await assert.rejects(
    () =>
      runs.startEvaluationRun(
        h.records(),
        h.userA,
        { mode: "context-pilot", expectedPlanHash: prepared.hash },
        ORIGIN,
      ),
    /Enterprise|provider/i,
  );
  assert.equal(
    h.evaluationStarts.length + h.gatewayRequests.length + h.geminiEnterpriseRequests.length,
    0,
  );
});

test("frozen candidate tampering and wrong signed identity stop before reservation", async () => {
  provider();
  const run = await begin();
  const plan = JSON.parse(stored(run.id).plan);
  plan.contextPilot.candidate.version = "tampered";
  h.sqlite
    .prepare("UPDATE evaluation_runs SET plan=? WHERE id=?")
    .run(JSON.stringify(plan), run.id);
  assert.equal((await signedStep(run, 0)).next, false);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_results").get().n, 0);
});

test("wrong signed plan cannot claim a context attempt", async () => {
  provider();
  const run = await begin();
  assert.equal((await signedStep(run, 0, { planHash: "0".repeat(64) })).next, false);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_results").get().n, 0);
});

test("changed member provider stops the next case without gateway fallback", async () => {
  provider();
  const run = await begin();
  assert.equal((await signedStep(run, 0)).next, true);
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  assert.equal((await signedStep(run, 1)).next, false);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("changed reported model retains the second capture and halts later cases", async () => {
  provider({
    actualModel: (index) =>
      index === 0 ? "gemini-3.8-flash-20260902" : "gemini-3.8-flash-20261001",
  });
  const run = await begin();
  assert.equal((await signedStep(run, 0)).next, true);
  assert.equal((await signedStep(run, 1)).next, false);
  assert.equal(stored(run.id).status, "halted");
  await signedStep(run, 2);
  assert.equal(h.geminiEnterpriseRequests.length, 2);
  assert.equal((await capture(run)).results.length, 2);
});

test("revoked operator authority cannot claim a context attempt", async () => {
  provider();
  const run = await begin();
  h.sqlite.prepare("DELETE FROM user_roles WHERE user_id=?").run(h.userA);
  assert.equal((await signedStep(run, 0)).next, false);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

for (const [label, options, match] of [
  ["unknown usage", { unknownUsage: true }, /usage/],
  ["uncertain transport", { fail: true }, /unavailable|gateway|network|provider|failed/i],
  ["unexpected model", { actualModel: "gemini-3.8-pro-20260902" }, /model/],
  ["unusable draft capture", { lossy: true }, /capture/],
  ["incomplete provider finish", { finishReason: "MAX_TOKENS" }, /capture|finish/],
])
  test(`${label} halts with a retained spent attempt and no retry`, async () => {
    provider(options);
    const run = await begin();
    assert.equal((await signedStep(run, 0)).next, false);
    assert.equal(stored(run.id).status, "halted");
    assert.match(stored(run.id).message, match);
    await signedStep(run, 0);
    await signedStep(run, 1);
    assert.equal(h.geminiEnterpriseRequests.length, 1);
    const saved = await capture(run);
    assert.equal(saved.ledger.campaignAttempts, 1);
    if (!options.lossy && !options.finishReason)
      assert.equal(saved.ledger.campaignReservedMicros, 2_800_000);
  });

test("full per-attempt reservation cannot exceed the frozen five dollar ceiling", async () => {
  provider({ tokens: { input: 65536, output: 65536, thinking: 65536 } });
  const run = await begin();
  assert.equal((await signedStep(run, 0)).next, true);
  assert.equal((await signedStep(run, 1)).next, false);
  assert.equal(stored(run.id).status, "halted");
  assert.match(stored(run.id).message, /ceiling/);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal((await capture(run)).ledger.campaignReservedMicros, 2_752_512);
});

test("failed Workflow dispatch retains this version's campaign and blocks another start", async () => {
  provider();
  h.setEvaluationPlane(() => new Response("unavailable", { status: 503 }));
  await assert.rejects(() => begin(), /dispatch/);
  await assert.rejects(() => begin(), /already/);
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(h.sqlite.prepare("SELECT status FROM evaluation_runs").get().status, "error");
  assert.equal(h.geminiEnterpriseRequests.length + h.gatewayRequests.length, 0);
});

// Retained v1, v2 and v3 rows must neither consume v4's allowance nor be rewritten to obtain it.
test("historical context campaigns remain readable while the fourth version gets one separate allowance", async () => {
  provider();
  const historicalRows = [];
  for (const version of [
    "daily-context-pilot-1",
    "daily-context-pilot-2",
    "daily-context-pilot-3",
  ]) {
    const historical = await begin();
    const oldPlan = JSON.parse(stored(historical.id).plan);
    oldPlan.contextPilot.version = version;
    h.sqlite
      .prepare("UPDATE evaluation_runs SET status='complete', plan=? WHERE id=?")
      .run(JSON.stringify(oldPlan), historical.id);
    historicalRows.push({ run: historical, row: stored(historical.id), version });
  }
  const current = await begin();
  assert.equal(current.contextPilot.version, "daily-context-pilot-4");
  for (const historical of historicalRows) {
    assert.notEqual(current.id, historical.run.id);
    assert.deepEqual(stored(historical.run.id), historical.row);
    assert.equal((await capture(historical.run)).run.contextPilot.version, historical.version);
  }
  await assert.rejects(() => begin(), /already/);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 4);
  assert.equal(h.geminiEnterpriseRequests.length + h.gatewayRequests.length, 0);
});

test("failed final persistence retains the reservation without another provider request", async () => {
  provider();
  const run = await begin();
  h.setFault({ matches: (sql) => sql.startsWith('update "evaluation_results"') });
  await signedStep(run, 0).catch(() => null);
  h.setFault(null);
  await signedStep(run, 0);
  const saved = await capture(run);
  assert.equal(saved.run.status, "error");
  assert.equal(saved.results.length, 0);
  assert.equal(saved.ledger.entries[0].capture, "uncertain");
  assert.equal(saved.ledger.campaignAttempts, 1);
  assert.equal(saved.ledger.campaignReservedMicros, 2_800_000);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

test("a failed Workflow recovers a complete capture and never opens a new campaign", async () => {
  provider();
  const run = await begin();
  await signedStep(run, 0);
  h.setEvaluationStatus(() => Response.json({ ok: true, instanceId: run.id, status: "errored" }));
  h.sqlite
    .prepare("UPDATE evaluation_runs SET updated_at=? WHERE id=?")
    .run(new Date(Date.now() - 300000).toISOString(), run.id);
  const saved = await capture(run);
  assert.equal(saved.run.status, "error");
  assert.equal(saved.results.length, 1);
  assert.equal(saved.ledger.campaignAttempts, 1);
  await assert.rejects(() => begin(), /already/);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});
