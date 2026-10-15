import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, shared, runs;
before(async () => {
  h = await createRecordsHarness();
  shared = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.shared.ts");
  runs = await h.vite.ssrLoadModule("/src/lib/evaluation-runs.server.ts");
});
after(async () => {
  await h?.close();
});
beforeEach(async () => {
  await h.reset();
});

test("the editorial pilot accepts only its closed mode and reviewed plan identity", () => {
  assert.equal(
    shared.readingEvaluationPreviewInputSchema.safeParse({ mode: "editorial-pilot" }).success,
    true,
  );
  assert.equal(
    shared.readingEvaluationRunInputSchema.safeParse({
      mode: "editorial-pilot",
      expectedPlanHash: "a".repeat(64),
    }).success,
    true,
  );
  for (const extra of [
    { provider: "lovable" },
    { cases: ["quiet-threshold"] },
    { budget: { dollarCeilingCents: 1000 } },
    { source: "active" },
  ]) {
    assert.equal(
      shared.readingEvaluationPreviewInputSchema.safeParse({ mode: "editorial-pilot", ...extra })
        .success,
      false,
    );
  }
  assert.equal(
    shared.readingEvaluationRunInputSchema.safeParse({ mode: "editorial-pilot" }).success,
    false,
  );
});

async function preview() {
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  return runs.previewEvaluationPlan(h.records(), h.userA, { mode: "editorial-pilot" });
}

test("preview fixes the six reviewed scenarios and four quiet dates without dispatch or publication", async () => {
  const prepared = await preview();
  assert.equal(prepared.attemptLimit, 5);
  assert.deepEqual(
    prepared.plans.cases.map((c) => c.id),
    [
      "writing-reply-scene",
      "venus-opposition-venus",
      "synthesis-tension",
      "jupiter-trine-sun-technical",
      "fallback-hard-neptune-mercury",
      "quiet-threshold",
      "editorial-quiet-2026-10-12",
      "editorial-quiet-2026-10-13",
      "editorial-quiet-2026-10-14",
    ],
  );
  const details = prepared.plans.editorialPilot;
  assert.equal(details.provider, "lovable");
  assert.equal(details.dollarCeilingMicros, 5_000_000);
  assert.deepEqual(
    details.caseManifest.cases.slice(5).map((c) => c.config.day),
    ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14"],
  );
  assert.ok(
    details.caseManifest.cases.every(
      (c) => c.config.tone === "warm" && c.config.depth === "standard",
    ),
  );
  assert.equal(details.candidate.schemaVersion, 6);
  assert.equal(
    prepared.plans.cases[4].interpretationPlan.interpretations[0].interpretationKey,
    "square:neptune:mercury",
  );
  assert.equal(new Set(prepared.plans.cases.slice(5).map((c) => c.template.body)).size, 4);
  assert.equal(h.evaluationStarts.length, 0);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.releasePublications.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 0);
});

const ORIGIN = "https://pattern.example.test";
function meteredProvider({
  tokens = { prompt: 100, candidates: 100, thoughts: 50 },
  actualModel = "gemini-3.8-flash-20260902",
  unknownUsage = false,
  fail = false,
} = {}) {
  let count = 0;
  h.setGeminiEnterprise(() => {
    if (fail) throw Error("Controlled uncertain transport");
    return Response.json({
      modelVersion: actualModel,
      responseId: `editorial-test-${++count}`,
      usageMetadata: unknownUsage
        ? {}
        : {
            promptTokenCount: tokens.prompt,
            candidatesTokenCount: tokens.candidates,
            thoughtsTokenCount: tokens.thoughts,
            totalTokenCount: tokens.prompt + tokens.candidates + tokens.thoughts,
          },
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                text: JSON.stringify({
                  paragraphs: [
                    {
                      text: "A possible comparison remains open to interpretation.",
                      facts: ["C1", "I1"],
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    });
  });
}
async function begin() {
  const prepared = await preview();
  return runs.startEvaluationRun(
    h.records(),
    h.userA,
    { mode: "editorial-pilot", expectedPlanHash: prepared.hash },
    ORIGIN,
  );
}
function stored(id) {
  return h.sqlite.prepare("SELECT * FROM evaluation_runs WHERE id=?").get(id);
}
async function step(run, position) {
  return runs.evaluationStep(h.records(), {
    runId: run.id,
    position,
    planHash: JSON.parse(stored(run.id).plan).hash,
  });
}
function unrelatedTables() {
  const tables = h.sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('evaluation_runs','evaluation_results') ORDER BY name",
    )
    .all();
  return Object.fromEntries(
    tables.map(({ name }) => [name, h.sqlite.prepare(`SELECT * FROM "${name}"`).all()]),
  );
}

test("the signed run captures nine outputs with only five model attempts and no release or member mutations", async () => {
  meteredProvider();
  const run = await begin();
  const before = unrelatedTables();
  const firstStepQuery = h.requests.length;
  assert.equal(run.provider, "gemini-enterprise");
  assert.equal(run.total, 9);
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(h.evaluationStarts[0].callback, `${ORIGIN}/api/public/evaluation-step`);
  for (let position = 0; position < 9; position++) {
    const outcome = await step(run, position);
    assert.equal(outcome.next, position < 8, `position ${position}: ${stored(run.id).message}`);
  }
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "complete");
  assert.equal(capture.results.length, 9);
  assert.equal(capture.ledger.campaignAttempts, 5);
  assert.equal(capture.ledger.dollarCeilingMicros, 5_000_000);
  assert.equal(capture.ledger.sourcePlan.metadata.promptVersion, "daily-editorial-body-1");
  assert.equal(capture.ledger.sourcePlan.metadata.validatorVersion, "daily-editorial-reference-1");
  assert.equal(capture.ledger.sourcePlan.metadata.voiceExamplesVersion, "daily-editorial-voice-1");
  for (const result of capture.results) {
    for (const field of [
      "promptVersion",
      "validatorVersion",
      "voiceExamplesVersion",
      "writingPlanVersion",
      "reflectionVersion",
    ])
      assert.equal(result.metadata[field], capture.ledger.sourcePlan.metadata[field], field);
  }
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  assert.equal(h.gatewayRequests.length, 0);
  assert.ok(
    capture.results
      .slice(5)
      .every((r) => r.case.request === null && r.case.diagnostics.attempted === false),
  );
  for (const result of capture.results.slice(5)) {
    assert.match(result.metadata.network, /No provider request/);
    assert.match(result.metadata.warning, /Authored quiet-day copy/);
    assert.doesNotMatch(result.metadata.warning, /Actual model outputs/);
  }
  for (const result of capture.results.slice(0, 5)) {
    assert.match(result.metadata.network, /request attempted/);
    assert.match(result.metadata.warning, /fallback copy/);
  }
  assert.equal(new Set(capture.results.slice(5).map((r) => r.case.output.body)).size, 4);
  const combined = shared.combineReadingEvaluationResults(capture.results);
  assert.equal(combined.summary.cases, 9);
  assert.match(combined.network, /5 provider requests attempted/);
  assert.match(combined.network, /4 authored quiet outputs/);
  assert.doesNotMatch(combined.warning, /Actual model outputs/);
  assert.deepEqual(unrelatedTables(), before);
  for (const { sql } of h.requests.slice(firstStepQuery)) {
    for (const match of sql.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+"?([a-z_]+)/gi))
      assert.ok(["evaluation_runs", "evaluation_results", "user_roles"].includes(match[1]), sql);
  }
  assert.equal(h.releasePublications.length, 0);
  assert.equal(h.swissRequests.length + h.episodeRequests.length + h.calculationRequests.length, 0);
  await step(run, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  await assert.rejects(
    () =>
      runs.startEvaluationRun(
        h.records(),
        h.userA,
        { mode: "editorial-pilot", expectedPlanHash: JSON.parse(stored(run.id).plan).hash },
        ORIGIN,
      ),
    /already/,
  );
});

test("wrong prepared identity and non-admin callers cannot dispatch the pilot", async () => {
  await assert.rejects(
    () => runs.previewEvaluationPlan(h.records(), h.userA, { mode: "editorial-pilot" }),
    /admin/i,
  );
  await preview();
  await assert.rejects(
    () =>
      runs.startEvaluationRun(
        h.records(),
        h.userA,
        { mode: "editorial-pilot", expectedPlanHash: "0".repeat(64) },
        ORIGIN,
      ),
    /changed/,
  );
  assert.equal(h.evaluationStarts.length, 0);
});

test("changed provider stops before any provider traffic", async () => {
  meteredProvider();
  const run = await begin();
  h.setGeminiEnterprise(null);
  await step(run, 0);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length + h.gatewayRequests.length, 0);
});

test("candidate tampering cannot reserve a request", async () => {
  meteredProvider();
  const run = await begin();
  const plan = JSON.parse(stored(run.id).plan);
  plan.editorialPilot.candidate.version = "tampered";
  h.sqlite
    .prepare("UPDATE evaluation_runs SET plan=? WHERE id=?")
    .run(JSON.stringify(plan), run.id);
  await step(run, 0);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("revoked admin authority cannot claim the next model attempt", async () => {
  meteredProvider();
  const run = await begin();
  h.sqlite.prepare("DELETE FROM user_roles WHERE user_id=?").run(h.userA);
  await step(run, 0);
  assert.equal(stored(run.id).status, "error");
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_results").get().n, 0);
});

test("the new five-dollar cap halts before a second conservative reservation can exceed it", async () => {
  meteredProvider({ tokens: { prompt: 65536, candidates: 65536, thoughts: 65536 } });
  const run = await begin();
  assert.equal((await step(run, 0)).next, true);
  assert.equal((await step(run, 1)).next, false);
  assert.equal(stored(run.id).status, "halted");
  assert.match(stored(run.id).message, /ceiling/);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

test("uncertain transport retains its spent attempt without retry", async () => {
  meteredProvider({ fail: true });
  const run = await begin();
  await step(run, 0);
  await step(run, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(stored(run.id).status, "halted");
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.ledger.campaignAttempts, 1);
  assert.equal(capture.ledger.campaignReservedMicros, 2_800_000);
});

test("unknown billing usage halts with the full reservation retained", async () => {
  meteredProvider({ unknownUsage: true });
  const run = await begin();
  assert.equal((await step(run, 0)).next, false);
  assert.equal(stored(run.id).status, "halted");
  assert.match(stored(run.id).message, /usage/);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.ledger.campaignReservedMicros, 2_800_000);
  await step(run, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

test("a failed Workflow dispatch cannot be retried as a new campaign", async () => {
  h.setEvaluationPlane(() => new Response("unavailable", { status: 503 }));
  const prepared = await preview();
  const settings = { mode: "editorial-pilot", expectedPlanHash: prepared.hash };
  await assert.rejects(
    () => runs.startEvaluationRun(h.records(), h.userA, settings, ORIGIN),
    /dispatch/,
  );
  await assert.rejects(
    () => runs.startEvaluationRun(h.records(), h.userA, settings, ORIGIN),
    /already/,
  );
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(h.sqlite.prepare("SELECT status FROM evaluation_runs").get().status, "error");
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});

test("an explicit member Lovable selection uses only that provider even when Enterprise is configured", async () => {
  meteredProvider();
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  h.setGateway(() =>
    Response.json({
      model: "google/gemini-3.8-flash",
      id: "editorial-lovable-test",
      usage: {
        prompt_tokens: 100,
        completion_tokens: 150,
        total_tokens: 250,
        completion_tokens_details: { reasoning_tokens: 50 },
      },
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              paragraphs: [
                {
                  text: "A possible comparison remains open to interpretation.",
                  facts: ["C1", "I1"],
                },
              ],
            }),
          },
        },
      ],
    }),
  );
  const run = await begin();
  assert.equal(run.provider, "lovable");
  assert.equal((await step(run, 0)).next, true);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.results[0].case.transport.provider, "lovable");
  assert.equal(capture.results[0].case.transport.actualModel, "google/gemini-3.8-flash");
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("an unexpected reported model is retained and halts remaining generation", async () => {
  meteredProvider({ actualModel: "gemini-3.8-pro-20260902" });
  const run = await begin();
  assert.equal((await step(run, 0)).next, false);
  await step(run, 1);
  assert.equal(stored(run.id).status, "halted");
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.results.length, 1);
  assert.equal(capture.ledger.campaignAttempts, 1);
  assert.equal(capture.ledger.campaignReservedMicros, 2_800_000);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});
