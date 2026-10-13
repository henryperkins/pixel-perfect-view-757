import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, shared, runs, hashing, base;
before(async () => {
  h = await createRecordsHarness();
  shared = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.shared.ts");
  runs = await h.vite.ssrLoadModule("/src/lib/evaluation-runs.server.ts");
  hashing = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
  base = (await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts")).DEFAULT_BUNDLE;
});
after(async () => {
  await h?.close();
});
beforeEach(async () => {
  await h.reset();
});

const request = () => ({
  mode: "content-comparison",
  source: { kind: "draft", draftId: "draft-fixture" },
  arm: "baseline",
  caseSetId: "draft-pilot-1",
  provider: "lovable",
  expectedPlanHash: "a".repeat(64),
  budget: { dollarCeilingCents: 500, reviewReserveCents: 0 },
});

async function draft() {
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  const baseline = structuredClone(base);
  const candidate = structuredClone(base);
  candidate.version = "pending";
  for (const body of [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ])
    for (const family of ["hard", "soft"])
      candidate.cycles.push({
        key: `${family}:${body}:*`,
        mechanism:
          "A task can leave room to consider another approach. A familiar routine can offer a place to compare the choices.",
        question: "What, if anything, would you like to reconsider?",
        themes: [],
      });
  const { data, error } = await h
    .records()
    .from("content_drafts")
    .insert({
      user_id: h.userA,
      status: "draft",
      base_version: baseline.version,
      base_bundle: baseline,
      base_hash: await hashing.contentChecksum(baseline),
      bundle: candidate,
    })
    .select("id")
    .single();
  assert.equal(error, null);
  return {
    mode: "content-comparison",
    source: { kind: "draft", draftId: data.id },
    arm: "baseline",
    caseSetId: "draft-pilot-1",
    provider: "lovable",
  };
}
test("preview freezes both full snapshots and four cases without dispatch or publication", async () => {
  const settings = await draft();
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  assert.equal(preview.attemptLimit, 8);
  assert.equal(preview.plans.version, "content-comparison-1");
  assert.equal(preview.plans.arms.baseline.cases.length, 4);
  assert.equal(preview.plans.arms.candidate.cases.length, 4);
  assert.equal(preview.plans.bundles.baseline.version, base.version);
  assert.equal(preview.plans.bundles.candidate.version, "pending");
  assert.equal(h.evaluationStarts.length, 0);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 0);
});
test("start rejects a stale preview and inactive member provider before any workflow", async () => {
  const settings = await draft();
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  const row = h.sqlite
    .prepare("SELECT bundle FROM content_drafts WHERE id=?")
    .get(settings.source.draftId);
  const changed = JSON.parse(row.bundle);
  changed.cycles[0].question = "A changed question?";
  await h
    .records()
    .from("content_drafts")
    .update({ bundle: changed })
    .eq("id", settings.source.draftId);
  await assert.rejects(
    runs.startEvaluationRun(
      h.records(),
      h.userA,
      { ...settings, expectedPlanHash: preview.hash, budget: request().budget },
      "https://pattern.example.test",
    ),
    /changed|prepare|stale/i,
  );
  assert.equal(h.evaluationStarts.length, 0);
  await assert.rejects(
    runs.previewEvaluationPlan(h.records(), h.userA, {
      ...settings,
      provider: "gemini-enterprise",
    }),
    /member provider/i,
  );
});
test("content comparison accepts an explicit eight-call pilot but rejects unbounded or injected input", () => {
  assert.equal(shared.readingEvaluationRunInputSchema.safeParse(request()).success, true);
  for (const input of [
    { ...request(), expectedPlanHash: undefined },
    { ...request(), caseSetId: "draft-fallback-1" },
    { ...request(), source: { kind: "draft", draftId: "x", bundle: {} } },
    { ...request(), prompt: "arbitrary input" },
  ])
    assert.equal(shared.readingEvaluationRunInputSchema.safeParse(input).success, false);
});

const ORIGIN = "https://pattern.example.test";
function meteredGateway({
  unknownUsage = false,
  highUsage = false,
  model = "google/gemini-3.8-flash",
} = {}) {
  h.setGateway(() =>
    Response.json({
      model,
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              paragraphs: [
                { text: "A task can leave room to consider another approach.", facts: ["I1"] },
              ],
            }),
          },
        },
      ],
      ...(unknownUsage
        ? {}
        : {
            usage: {
              prompt_tokens: highUsage ? 65536 : 1000,
              completion_tokens: highUsage ? 65536 : 100,
              total_tokens: highUsage ? 131072 : 1100,
              completion_tokens_details: { reasoning_tokens: 0 },
            },
          }),
    }),
  );
}
async function begin(settings) {
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  return runs.startEvaluationRun(
    h.records(),
    h.userA,
    {
      ...settings,
      expectedPlanHash: preview.hash,
      ...(settings.arm === "baseline" ? { budget: request().budget } : {}),
    },
    ORIGIN,
  );
}
async function step(run, position) {
  const row = h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(run.id);
  return runs.evaluationStep(h.records(), {
    runId: run.id,
    position,
    planHash: JSON.parse(row.plan).hash,
  });
}

test("paired pilot freezes content across edits, caps at eight, and never replays provider calls", async () => {
  const settings = await draft();
  meteredGateway();
  const baseline = await begin(settings);
  await assert.rejects(begin(settings), /already running|already started/i);
  await h
    .records()
    .from("content_drafts")
    .update({ status: "discarded" })
    .eq("id", settings.source.draftId);
  await step(baseline, 0);
  // Reloading the generic panel must recover this four-case run's persisted order.
  const recovered = await runs.readEvaluationRun(h.records(), h.userA);
  assert.equal(recovered.run.id, baseline.id);
  assert.deepEqual(recovered.run.caseIds, [
    "fallback-hard-mars-mercury",
    "fallback-hard-uranus-mercury",
    "fallback-soft-saturn-mercury",
    "fallback-soft-neptune-mercury",
  ]);
  assert.equal(recovered.run.completed, 1);
  assert.equal(
    shared.readingEvaluationCurrentCaseLabel(recovered.run),
    "fallback-hard-uranus-mercury",
  );
  for (let position = 1; position < 4; position++) await step(baseline, position);
  const baseState = await runs.readEvaluationRun(h.records(), h.userA, { runId: baseline.id });
  assert.equal(baseState.run.status, "complete", baseState.run.message);
  assert.equal(shared.readingEvaluationCurrentCaseLabel(baseState.run), null);
  assert.match(
    shared.readingEvaluationReportScope(baseState.run),
    /baseline arm contains all 4 pilot cases/,
  );
  assert.doesNotMatch(shared.readingEvaluationReportScope(baseState.run), /all fixed cases/);
  assert.equal(h.gatewayRequests.length, 4);
  assert.equal(shared.combineReadingEvaluationResults(baseState.results).expectedCases, 4);
  await step(baseline, 0);
  assert.equal(h.gatewayRequests.length, 4);
  const candidateSettings = { ...settings, arm: "candidate", campaignId: baseline.id };
  const candidate = await begin(candidateSettings);
  for (let position = 0; position < 4; position++) await step(candidate, position);
  const candidateState = await runs.readEvaluationRun(h.records(), h.userA, {
    runId: candidate.id,
  });
  assert.equal(candidateState.run.status, "complete", candidateState.run.message);
  assert.equal(candidateState.ledger.campaignAttempts, 8);
  assert.equal(h.gatewayRequests.length, 8);
  assert.ok(candidateState.ledger.campaignReservedMicros <= 5_000_000);
  await assert.rejects(begin(candidateSettings), /already started/i);
  assert.equal(h.gatewayRequests.length, 8);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM daily_readings").get().n, 0);
});

test("unknown billing stops after one attempt and retains full reservation", async () => {
  const settings = await draft();
  meteredGateway({ unknownUsage: true });
  const run = await begin(settings);
  await step(run, 0);
  await step(run, 1);
  const state = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(state.run.status, "halted");
  assert.equal(state.ledger.campaignAttempts, 1);
  assert.equal(state.ledger.campaignReservedMicros, 2_800_000);
  assert.equal(h.gatewayRequests.length, 1);
  await assert.rejects(
    begin({ ...settings, arm: "candidate", campaignId: run.id }),
    /complete baseline/,
  );
});

test("budget stops before the next reservation, provider changes and revoked admin stop before traffic", async () => {
  const settings = await draft();
  meteredGateway({ highUsage: true });
  const run = await begin(settings);
  for (let position = 0; position < 4; position++) await step(run, position);
  const state = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(state.run.status, "halted");
  assert.ok(h.gatewayRequests.length < 4);
  assert.ok(state.ledger.campaignReservedMicros <= 5_000_000);
  await h.reset();
  const nextSettings = await draft();
  meteredGateway();
  const next = await begin(nextSettings);
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  await step(next, 0);
  assert.equal(h.gatewayRequests.length, 0);
  delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
  await h.reset();
  const revokedSettings = await draft();
  meteredGateway();
  const revoked = await begin(revokedSettings);
  await h.records().from("user_roles").delete().eq("user_id", h.userA);
  await step(revoked, 0);
  assert.equal(h.gatewayRequests.length, 0);
});

function contentState() {
  return ["content_drafts", "content_releases", "daily_readings"].map((table) =>
    h.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all(),
  );
}
async function finishedBaseline() {
  const settings = await draft();
  meteredGateway();
  const baseline = await begin(settings);
  for (let position = 0; position < 4; position++) await step(baseline, position);
  return { baseline, settings: { ...settings, arm: "candidate", campaignId: baseline.id } };
}
function mutateCapture(runId, edit) {
  const stored = h.sqlite
    .prepare("SELECT id,result FROM evaluation_results WHERE run_id=? AND position=1")
    .get(runId);
  const result = JSON.parse(stored.result);
  edit(result);
  h.sqlite
    .prepare("UPDATE evaluation_results SET result=? WHERE id=?")
    .run(JSON.stringify(result), stored.id);
}

test("candidate preparation requires all four intact baseline captures, identities and reconciled reservations", async () => {
  const mutations = [
    (id) =>
      h.sqlite.prepare("DELETE FROM evaluation_results WHERE run_id=? AND position=1").run(id),
    (id) =>
      mutateCapture(id, (result) => {
        result.kind = "attempt-reservation";
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.metadata.contentComparison.pairHash = "0".repeat(64);
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.metadata.runPlanHash = "0".repeat(64);
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.case.transport.provider = "gemini-enterprise";
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.case.transport.actualModel = "google/gemini-3.8-flash-002";
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.case.id = "different-case";
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.controller.status = "halted";
      }),
    (id) =>
      mutateCapture(id, (result) => {
        result.case.transport.usage.outputTokens = null;
      }),
    (id) =>
      h.sqlite
        .prepare("UPDATE evaluation_results SET reserved_micros=0 WHERE run_id=? AND position=1")
        .run(id),
    (id) => {
      const stored = h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(id);
      const plan = JSON.parse(stored.plan);
      plan.hash = "0".repeat(64);
      h.sqlite
        .prepare("UPDATE evaluation_runs SET plan=? WHERE id=?")
        .run(JSON.stringify(plan), id);
    },
  ];
  for (const mutate of mutations) {
    await h.reset();
    const { baseline, settings } = await finishedBaseline();
    mutate(baseline.id);
    const before = contentState();
    await assert.rejects(() => begin(settings), /baseline|capture|integrity|identity|reservation/i);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 1);
    assert.equal(h.gatewayRequests.length, 4);
    assert.equal(h.evaluationStarts.length, 1);
    assert.deepEqual(contentState(), before);
  }
});

test("candidate insertion atomically rejects a baseline capture deleted after validation", async () => {
  const { baseline, settings } = await finishedBaseline();
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  const db = h.records();
  let raced = false;
  const wrapped = {
    ...db,
    async batch(statements) {
      if (statements.some(({ sql }) => /INSERT INTO evaluation_runs/i.test(sql))) {
        raced = true;
        h.sqlite
          .prepare("DELETE FROM evaluation_results WHERE run_id=? AND position=1")
          .run(baseline.id);
      }
      return db.batch(statements);
    },
  };
  const before = contentState();
  await assert.rejects(() =>
    runs.startEvaluationRun(
      wrapped,
      h.userA,
      { ...settings, expectedPlanHash: preview.hash },
      ORIGIN,
    ),
  );
  assert.equal(raced, true);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 1);
  assert.equal(h.gatewayRequests.length, 4);
  assert.equal(h.evaluationStarts.length, 1);
  assert.deepEqual(contentState(), before);
});

test("candidate stops on its first capture when actual model differs from the completed baseline", async () => {
  const { settings } = await finishedBaseline();
  meteredGateway({ model: "google/gemini-3.8-flash-002" });
  const candidate = await begin(settings);
  await step(candidate, 0);
  await step(candidate, 1);
  const state = await runs.readEvaluationRun(h.records(), h.userA, { runId: candidate.id });
  assert.equal(state.run.status, "halted");
  assert.match(state.run.message, /model|campaign/i);
  assert.equal(state.results.length, 1);
  assert.equal(state.ledger.campaignAttempts, 5);
  assert.equal(h.gatewayRequests.length, 5);
});

test("admin revoked between step preparation and reservation cannot authorize model traffic", async () => {
  const settings = await draft();
  meteredGateway();
  const run = await begin(settings);
  const before = contentState();
  let raced = false;
  h.setFault({
    matches(sql) {
      if (/^INSERT INTO evaluation_results/i.test(sql)) {
        raced = true;
        h.sqlite.prepare("DELETE FROM user_roles WHERE user_id=?").run(h.userA);
      }
      return false;
    },
  });
  await step(run, 0);
  assert.equal(raced, true);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_results").get().n, 0);
  assert.match(
    h.sqlite.prepare("SELECT message FROM evaluation_runs WHERE id=?").get(run.id).message,
    /admin|authority/i,
  );
  assert.deepEqual(contentState(), before);
});

function nonEvaluationSnapshot() {
  return Object.fromEntries(
    h.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('evaluation_runs','evaluation_results') ORDER BY name",
      )
      .all()
      .map(({ name }) => [
        name,
        h.sqlite
          .prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`)
          .all()
          .map((row) =>
            JSON.stringify(
              Object.fromEntries(
                Object.keys(row)
                  .sort()
                  .map((key) => [key, row[key]]),
              ),
            ),
          )
          .sort(),
      ]),
  );
}

function assertTableBoundary(allowed, phase) {
  assert.ok(h.requests.length > 0, `${phase} must exercise the database boundary`);
  for (const { sql } of h.requests) {
    const references = [...sql.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+"?([a-z_]\w*)"?/gi)];
    for (const [, table] of references)
      assert.ok(allowed.includes(table), `${phase} unexpectedly touched ${table}: ${sql}`);
  }
}

test("paired source freezing and execution preserve every non-evaluation table without member reads", async () => {
  const settings = await draft();
  await h.seedChart(h.records(), h.userA);
  h.sqlite
    .prepare("INSERT INTO account_email_state(user_id,confirmed_at) VALUES (?,?), (?,?)")
    .run(h.userA, "2026-10-01", h.userB, "2026-10-02");
  h.sqlite
    .prepare("INSERT INTO billing_locks(user_id,token,expires_at) VALUES (?,?,?)")
    .run(h.userA, "private-lock-sentinel", 9999999999);
  // The prefix deliberately resembles an evaluation table; only the two actual
  // run tables may be excluded. Both rows also tie on the first column.
  h.sqlite.exec(
    "CREATE TABLE evaluation_isolation_fixture (owner TEXT, slot TEXT, payload TEXT, PRIMARY KEY(owner,slot)) WITHOUT ROWID; INSERT INTO evaluation_isolation_fixture VALUES ('same-owner','b','second'), ('same-owner','a','first')",
  );
  const before = nonEvaluationSnapshot();
  assert.equal(before.account_email_state.length, 2);
  assert.equal(before.billing_locks.length, 1);
  assert.equal(before.evaluation_isolation_fixture.length, 2);
  h.sqlite.exec("PRAGMA reverse_unordered_selects=ON");
  assert.deepEqual(nonEvaluationSnapshot(), before, "snapshots must not depend on row order");
  h.sqlite.exec("PRAGMA reverse_unordered_selects=OFF");
  h.sqlite.exec("UPDATE evaluation_isolation_fixture SET payload='changed' WHERE slot='b'");
  assert.notDeepEqual(nonEvaluationSnapshot(), before, "the second tied row must be included");
  h.sqlite.exec("UPDATE evaluation_isolation_fixture SET payload='second' WHERE slot='b'");

  meteredGateway();
  h.requests.length = 0;
  const baseline = await begin(settings);
  assert.ok(h.requests.some(({ sql }) => /\bFROM "?content_drafts\b/i.test(sql)));
  assertTableBoundary(
    ["user_roles", "content_drafts", "content_releases", "evaluation_runs", "evaluation_results"],
    "initial source freeze",
  );
  assert.deepEqual(nonEvaluationSnapshot(), before);

  h.requests.length = 0;
  for (let position = 0; position < 4; position++) await step(baseline, position);
  const candidate = await begin({ ...settings, arm: "candidate", campaignId: baseline.id });
  for (let position = 0; position < 4; position++) await step(candidate, position);
  const state = await runs.readEvaluationRun(h.records(), h.userA, { runId: candidate.id });
  assert.equal(state.run.status, "complete", state.run.message);
  assert.equal(h.gatewayRequests.length, 8);
  assertTableBoundary(["user_roles", "evaluation_runs", "evaluation_results"], "frozen execution");
  assert.deepEqual(nonEvaluationSnapshot(), before);
  assert.equal(h.releasePublications.length, 0);
  assert.doesNotMatch(JSON.stringify(state), /Private birth place|private-lock-sentinel/);
});

test("unavailable candidate generation uses its frozen fallback after draft and active release change", async () => {
  const { baseline, settings } = await finishedBaseline();
  const rootPlan = JSON.parse(
    h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(baseline.id).plan,
  );
  const pair = rootPlan.contentComparison.pair;
  const expected = pair.arms.candidate.cases[0];
  assert.notEqual(expected.template.body, pair.arms.baseline.cases[0].template.body);
  const active = structuredClone(pair.bundles.candidate);
  active.version = "later-active-source";
  for (const cycle of active.cycles) {
    cycle.mechanism = "Unrelated later active copy must never enter this frozen evaluation.";
    cycle.question = "What belongs to the later release?";
  }
  h.sqlite
    .prepare("UPDATE content_drafts SET bundle=? WHERE id=?")
    .run(JSON.stringify(active), settings.source.draftId);
  h.sqlite
    .prepare(
      "INSERT INTO content_releases(id,version,checksum,bundle,is_active) VALUES (?,?,?,?,1)",
    )
    .run(
      "later-active",
      active.version,
      await hashing.contentChecksum(active),
      JSON.stringify(active),
    );
  const before = nonEvaluationSnapshot();

  h.setGateway(() => new Response("unavailable", { status: 503 }));
  h.requests.length = 0;
  const candidate = await begin(settings);
  await step(candidate, 0);
  await step(candidate, 0);
  await step(candidate, 1);
  const state = await runs.readEvaluationRun(h.records(), h.userA, { runId: candidate.id });
  assert.equal(state.run.status, "halted");
  assert.equal(state.results.length, 1);
  assert.equal(state.ledger.campaignAttempts, 5);
  assert.equal(h.gatewayRequests.length, 5, "unavailable calls must never be retried");
  const result = state.results[0];
  assert.equal(result.case.diagnostics.outcome, "unavailable");
  assert.equal(result.case.output.mode, "template");
  assert.deepEqual(
    {
      headline: result.case.output.headline,
      body: result.case.output.body,
      prompt: result.case.output.prompt,
    },
    expected.template,
  );
  assert.deepEqual(result.case.facts, expected.facts);
  assert.deepEqual(result.case.interpretationPlan, expected.interpretationPlan);
  assert.equal(result.metadata.bundleHash, pair.identities.candidate.bundleHash);
  assert.equal(result.metadata.contentComparison.pairHash, pair.hash);
  assert.doesNotMatch(result.case.output.body, /Unrelated later active copy/);
  assertTableBoundary(
    ["user_roles", "evaluation_runs", "evaluation_results"],
    "candidate fallback",
  );
  assert.deepEqual(nonEvaluationSnapshot(), before);
});

test("run labels preserve repeated case order and avoid inferring absent or completed cases", () => {
  const run = {
    status: "running",
    completed: 2,
    total: 4,
    caseIds: [
      "saturn-square-sun",
      "saturn-square-moon-warm",
      "saturn-square-sun",
      "saturn-square-moon-warm",
    ],
    enterpriseThinking: "LOW",
  };
  assert.equal(shared.readingEvaluationCurrentCaseLabel(run), "Saturn Square Sun");
  assert.equal(
    shared.readingEvaluationCurrentCaseLabel({ ...run, completed: 3 }),
    "Saturn Square Moon Warm",
  );
  assert.equal(shared.readingEvaluationCurrentCaseLabel({ ...run, completed: 4 }), null);
  assert.equal(shared.readingEvaluationCurrentCaseLabel({ ...run, status: "complete" }), null);
  assert.equal(shared.readingEvaluationCurrentCaseLabel({ ...run, caseIds: undefined }), null);
  assert.equal(shared.readingEvaluationCurrentCaseLabel(null), null);
  assert.match(shared.readingEvaluationReportScope(run), /every repetition by position/);
  const standard = { ...run, enterpriseThinking: undefined, total: 50, status: "complete" };
  assert.match(shared.readingEvaluationReportScope(standard), /all 50 scheduled cases/);
  assert.match(shared.readingEvaluationReportScope({ ...standard, status: "halted" }), /partial/);
});
