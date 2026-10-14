import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, afterEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, shared, runs, hashing, probe, probePlan;
const PINNED = "44c05c8b0336dc778c2efdcbf0c28dc2091d33a96b91c352a2481123b7f7ccae";
const ORIGIN = "https://pattern.example.test";

before(async () => {
  h = await createRecordsHarness();
  shared = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.shared.ts");
  runs = await h.vite.ssrLoadModule("/src/lib/evaluation-runs.server.ts");
  hashing = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
  probe = await h.vite.ssrLoadModule("/src/lib/ai/latency-probe.ts");
  probePlan = await h.vite.ssrLoadModule("/src/lib/ai/latency-probe-plan.server.ts");
});
after(async () => {
  await h?.close();
});
beforeEach(async () => {
  await h.reset();
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
});
afterEach(() => {
  delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
});

const baselineBundle = () =>
  JSON.parse(
    readFileSync(new URL("./fixtures/latency-probe-baseline.json", import.meta.url), "utf8"),
  );

async function draft() {
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  const baseline = baselineBundle();
  const candidate = structuredClone(baseline);
  candidate.version = "pending";
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
  return { mode: "latency-probe", source: { kind: "draft", draftId: data.id } };
}

function meteredEnterprise({
  unknownUsage = false,
  models = ["gemini-3.8-flash-20260902"],
  tokens = { prompt: 100, candidates: 100, thoughts: 50 },
} = {}) {
  let call = 0;
  h.setGeminiEnterprise(() =>
    Response.json({
      modelVersion: models[Math.min(call++, models.length - 1)],
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
                      text: "A task can leave room to consider another approach. A familiar routine can offer a place to compare the choices.",
                      facts: ["C1", "I1"],
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    }),
  );
}

async function begin(settings) {
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  return runs.startEvaluationRun(
    h.records(),
    h.userA,
    { ...settings, expectedPlanHash: preview.hash },
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

const storedRun = (id) =>
  JSON.parse(h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(id).plan);
const storePlan = (id, plan) =>
  h.sqlite.prepare("UPDATE evaluation_runs SET plan=? WHERE id=?").run(JSON.stringify(plan), id);

test("the probe accepts only its closed draft source and reviewed plan hash", () => {
  assert.equal(
    shared.readingEvaluationRunInputSchema.safeParse({
      mode: "latency-probe",
      source: { kind: "draft", draftId: "draft-1" },
      expectedPlanHash: "a".repeat(64),
    }).success,
    true,
  );
  for (const input of [
    { mode: "latency-probe", source: { kind: "draft", draftId: "x" } },
    {
      mode: "latency-probe",
      source: { kind: "draft", draftId: "x" },
      expectedPlanHash: "a".repeat(64),
      budget: { dollarCeilingCents: 500, reviewReserveCents: 0 },
    },
    {
      mode: "latency-probe",
      source: { kind: "draft", draftId: "x" },
      expectedPlanHash: "a".repeat(64),
      provider: "gemini-enterprise",
    },
    {
      mode: "latency-probe",
      source: { kind: "release", releaseId: "a", baselineReleaseId: "b" },
      expectedPlanHash: "a".repeat(64),
    },
    {
      mode: "latency-probe",
      source: { kind: "draft", draftId: "x", cases: ["fallback-soft-neptune-mercury"] },
      expectedPlanHash: "a".repeat(64),
    },
    {
      mode: "latency-probe",
      source: { kind: "draft", draftId: "x" },
      expectedPlanHash: "z".repeat(64),
    },
  ])
    assert.equal(shared.readingEvaluationRunInputSchema.safeParse(input).success, false);
});

test("preview pins the frozen baseline, four ordered observations, rubric and budget-free scope", async () => {
  const settings = await draft();
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  assert.equal(preview.attemptLimit, 4);
  const plan = preview.plans;
  assert.equal(plan.latencyProbe.version, "content-latency-probe-1");
  assert.equal(plan.latencyProbe.provider, "gemini-enterprise");
  assert.equal(plan.latencyProbe.baselineIdentity.canonicalHash, PINNED);
  assert.equal(plan.latencyProbe.baseline.version, "0.7.1");
  assert.equal(plan.latencyProbe.candidate, undefined);
  assert.equal(plan.latencyProbe.deadlineMs, 60_000);
  assert.equal(plan.latencyProbe.reviewRubric.version, "latency-probe-review-1");
  assert.equal(plan.latencyProbe.reviewRubric.humanApproval, false);
  assert.equal(plan.caseSetId, undefined, "case set identity stays inside metadata/probe details");
  assert.equal(plan.metadata.caseSetId, "draft-pilot-2");
  assert.equal(plan.metadata.promptVersion, "daily-astro-body-15");
  assert.equal(plan.metadata.validatorVersion, "daily-reference-10");
  assert.equal(plan.metadata.reflectionVersion, "primary-reflection-1");
  assert.equal(plan.metadata.gatewayTimeoutMs, 60_000);
  assert.equal(plan.metadata.model, "gemini-enterprise/gemini-3.8-flash");
  assert.deepEqual(
    plan.cases.map((planned) => [planned.position, planned.id, planned.thinking]),
    [
      [0, "fallback-soft-neptune-mercury", "LOW"],
      [1, "fallback-soft-saturn-mercury", "MEDIUM"],
      [2, "fallback-soft-saturn-mercury", "LOW"],
      [3, "fallback-soft-neptune-mercury", "MEDIUM"],
    ],
  );
  assert.equal(plan.attemptLimit, 4);
  assert.equal(h.evaluationStarts.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM evaluation_runs").get().n, 0);
});

test("preview and start require the member Enterprise provider and admin authority", async () => {
  const settings = await draft();
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  await assert.rejects(
    runs.previewEvaluationPlan(h.records(), h.userA, settings),
    /member|Enterprise/i,
  );
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  await assert.rejects(runs.previewEvaluationPlan(h.records(), h.userB, settings), /admin/i);
  assert.equal(h.evaluationStarts.length, 0);
});

test("a draft whose baseline differs from the pinned reviewed baseline is refused", async () => {
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  const baseline = baselineBundle();
  baseline.cycles[0].question = "A changed baseline question?";
  const candidate = structuredClone(baseline);
  candidate.version = "pending";
  const { data } = await h
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
  await assert.rejects(
    runs.previewEvaluationPlan(h.records(), h.userA, {
      mode: "latency-probe",
      source: { kind: "draft", draftId: data.id },
    }),
    /frozen latency probe baseline/,
  );
  await assert.rejects(
    runs.previewEvaluationPlan(h.records(), h.userA, {
      mode: "latency-probe",
      source: { kind: "draft", draftId: crypto.randomUUID() },
    }),
    /no longer open|could not be loaded/i,
  );
  assert.equal(h.evaluationStarts.length, 0);
});

test("start freezes the run with server-fixed $5/four-attempt bounds", async () => {
  const settings = await draft();
  meteredEnterprise();
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  await assert.rejects(
    runs.startEvaluationRun(
      h.records(),
      h.userA,
      { ...settings, expectedPlanHash: "b".repeat(64) },
      ORIGIN,
    ),
    /reviewed latency probe plan changed/,
  );
  assert.equal(h.evaluationStarts.length, 0);
  // The probe freezes only the pinned baseline; a candidate edit cannot alter its plan.
  const draftRow = h.sqlite
    .prepare("SELECT bundle FROM content_drafts WHERE id=?")
    .get(settings.source.draftId);
  const changed = JSON.parse(draftRow.bundle);
  changed.cycles[0].question = "A changed candidate question?";
  await h
    .records()
    .from("content_drafts")
    .update({ bundle: changed })
    .eq("id", settings.source.draftId);
  const afterEdit = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  assert.equal(afterEdit.hash, preview.hash);
  const run = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    { ...settings, expectedPlanHash: preview.hash },
    ORIGIN,
  );
  assert.equal(run.provider, "gemini-enterprise");
  assert.equal(run.bundleSource, "latency-probe");
  assert.equal(run.total, 4);
  assert.equal(run.attemptLimit, 4);
  assert.equal(run.latencyProbe.version, "content-latency-probe-1");
  assert.equal(run.latencyProbe.positions.length, 4);
  const columns = h.sqlite
    .prepare(
      "SELECT dollar_ceiling_micros, review_reserve_micros, campaign_attempt_limit, arm_key, enterprise_thinking, qualification_profile FROM evaluation_runs WHERE id=?",
    )
    .get(run.id);
  assert.deepEqual(
    { ...columns },
    {
      dollar_ceiling_micros: 5_000_000,
      review_reserve_micros: 0,
      campaign_attempt_limit: 4,
      arm_key: "latency-probe",
      enterprise_thinking: null,
      qualification_profile: null,
    },
  );
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(h.evaluationStarts[0].total, 4);
  assert.equal(h.evaluationStarts[0].enterpriseThinking, undefined);
  await assert.rejects(begin(settings), /already running/i);
});

test("a halted unknown probe cannot be restarted with a fresh reservation ledger", async () => {
  const settings = await draft();
  const preview = await runs.previewEvaluationPlan(h.records(), h.userA, settings);
  h.setGeminiEnterprise(() => {
    throw Object.assign(new Error("fixture timeout"), { name: "TimeoutError" });
  });
  const run = await begin(settings);
  await step(run, 0);
  assert.equal(
    h.sqlite.prepare("SELECT status FROM evaluation_runs WHERE id=?").get(run.id).status,
    "halted",
  );
  assert.equal(
    h.sqlite.prepare("SELECT SUM(reserved_micros) n FROM evaluation_results").get().n,
    2_800_000,
  );
  await assert.rejects(
    runs.startEvaluationRun(
      h.records(),
      h.userA,
      { ...settings, expectedPlanHash: preview.hash },
      ORIGIN,
    ),
    /already started|retained/i,
  );
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM evaluation_runs").get().n, 1);
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(
    h.sqlite.prepare("SELECT SUM(reserved_micros) n FROM evaluation_results").get().n,
    2_800_000,
  );
});

test("terminal and stale probe records still prevent starting another copy of the experiment", async () => {
  for (const status of [
    "complete",
    "halted",
    "stopped",
    "error",
    "queued",
    "running",
    "stopping",
  ]) {
    await h.reset();
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
    const settings = await draft();
    const run = await begin(settings);
    h.sqlite
      .prepare("UPDATE evaluation_runs SET status=?,updated_at=? WHERE id=?")
      .run(status, "2000-01-01T00:00:00.000Z", run.id);
    await assert.rejects(begin(settings), /already started|retained/i, status);
    assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM evaluation_runs").get().n, 1, status);
    assert.equal(h.evaluationStarts.length, 1, status);
  }
});

test("four signed steps apply the frozen per-position thinking once each and complete", async () => {
  const settings = await draft();
  meteredEnterprise();
  const run = await begin(settings);
  for (let position = 0; position < 4; position++) await step(run, position);
  assert.equal(h.geminiEnterpriseRequests.length, 4);
  assert.deepEqual(
    h.geminiEnterpriseRequests.map(
      (request) => request.generationConfig?.thinkingConfig?.thinkingLevel,
    ),
    ["LOW", "MEDIUM", "LOW", "MEDIUM"],
  );
  assert.deepEqual(
    h.geminiEnterpriseRequests.map((request) => request.generationConfig?.maxOutputTokens),
    [65536, 65536, 65536, 65536],
  );
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "complete", capture.run.message);
  assert.equal(capture.run.completed, 4);
  assert.equal(capture.ledger.campaignAttempts, 4);
  assert.equal(capture.ledger.dollarCeilingMicros, 5_000_000);
  assert.ok(capture.ledger.campaignReservedMicros < 1_000_000);
  assert.match(shared.readingEvaluationReportScope(capture.run), /planned observations/);
  for (const [index, result] of capture.results.entries()) {
    assert.equal(result.metadata.bundleSource, "latency-probe");
    assert.equal(result.metadata.caseSetId, "draft-pilot-2");
    assert.equal(result.metadata.experimentVersion, "content-latency-probe-1");
    assert.equal(result.metadata.runPlanHash, capture.ledger.sourcePlan.hash);
    assert.equal(result.case.transport.thinkingLevel, ["LOW", "MEDIUM", "LOW", "MEDIUM"][index]);
    assert.equal(result.case.transport.deadlineMs, 60_000);
  }
  // A replayed step settles from storage; it never requests the provider again.
  await step(run, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 4);
});

test("an unavailable first observation halts the campaign and keeps its full reservation", async () => {
  const settings = await draft();
  h.setGeminiEnterprise(() => {
    throw Object.assign(new Error("fixture timeout"), { name: "TimeoutError" });
  });
  const run = await begin(settings);
  await step(run, 0);
  const state = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(state.run.status, "halted");
  assert.equal(state.run.completed, 1);
  assert.equal(state.ledger.campaignAttempts, 1);
  assert.equal(state.ledger.campaignReservedMicros, 2_800_000);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  // The remaining $2.20 cannot cover the next $2.80 reservation: no further traffic.
  meteredEnterprise();
  const before = h.geminiEnterpriseRequests.length;
  await step(run, 1);
  assert.equal(h.geminiEnterpriseRequests.length, before);
});

test("unknown usage halts before the next reservation; drift and member-provider change stop before traffic", async () => {
  const settings = await draft();
  meteredEnterprise({ unknownUsage: true });
  const run = await begin(settings);
  await step(run, 0);
  await step(run, 1);
  let capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "halted");
  assert.equal(h.geminiEnterpriseRequests.length, 1);

  await h.reset();
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  const drifted = await begin(await draft());
  meteredEnterprise();
  const plan = storedRun(drifted.id);
  plan.cases[0].facts[0].statement = "A tampered fact statement.";
  storePlan(drifted.id, plan);
  await step(drifted, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: drifted.id });
  assert.equal(capture.run.status, "error");
  assert.match(capture.run.message, /frozen|provider traffic/i);

  await h.reset();
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  const switched = await begin(await draft());
  meteredEnterprise();
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  await step(switched, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: switched.id });
  assert.equal(capture.run.status, "error");
});

test("a recorded thinking level that differs from its frozen position stops the run", async () => {
  const settings = await draft();
  meteredEnterprise();
  const run = await begin(settings);
  await step(run, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  // Simulate a capture whose recorded control diverges from the frozen position.
  const row = h.sqlite
    .prepare("SELECT id, result FROM evaluation_results WHERE run_id=? AND position=0")
    .get(run.id);
  const altered = JSON.parse(row.result);
  altered.case.transport.thinkingLevel = "MEDIUM";
  altered.controller = null;
  h.sqlite
    .prepare("UPDATE evaluation_results SET result=? WHERE id=?")
    .run(JSON.stringify(altered), row.id);
  await step(run, 0);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "error");
  assert.match(capture.run.message, /thinking control/i);
  assert.equal(h.geminiEnterpriseRequests.length, 1, "no further provider traffic");
});

test("a changed reported model halts at capture", async () => {
  const settings = await draft();
  meteredEnterprise({ models: ["gemini-3.8-pro-20260902"] });
  const run = await begin(settings);
  await step(run, 0);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "halted");
  assert.match(capture.run.message, /model/i);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

test("a reported model that changes between positions halts the probe", async () => {
  const settings = await draft();
  meteredEnterprise({ models: ["gemini-3.8-flash-20260902", "gemini-3.8-flash-20261001"] });
  const run = await begin(settings);
  await step(run, 0);
  await step(run, 1);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "halted");
  assert.match(capture.run.message, /model identity changed during this run/);
  assert.equal(capture.results.length, 2, "both captures retained");
  assert.equal(h.geminiEnterpriseRequests.length, 2);
});

test("high-usage captures halt before the third reservation under the frozen $5 ceiling", async () => {
  const settings = await draft();
  // Largest valid usage per capture: input*2 + output*20 = 1_441_792 micros ($1.44).
  meteredEnterprise({ tokens: { prompt: 65_536, candidates: 65_536, thoughts: 0 } });
  const run = await begin(settings);
  await step(run, 0);
  await step(run, 1);
  let capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "running");
  assert.equal(capture.ledger.campaignReservedMicros, 2 * 1_441_792);
  // $2.88 accounted + the $2.80 next reservation exceeds the frozen $5 ceiling.
  await step(run, 2);
  capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "halted");
  assert.match(capture.run.message, /attempt or dollar reservation ceiling/);
  assert.equal(capture.run.completed, 2);
  assert.equal(h.geminiEnterpriseRequests.length, 2, "the third case was never requested");
});

test("a tampered earlier capture stops the probe without further provider traffic", async () => {
  const settings = await draft();
  meteredEnterprise();
  const run = await begin(settings);
  await step(run, 0);
  const row = h.sqlite
    .prepare("SELECT id, result FROM evaluation_results WHERE run_id=? AND position=0")
    .get(run.id);
  const altered = JSON.parse(row.result);
  altered.metadata.bundleHash = "0".repeat(64);
  h.sqlite
    .prepare("UPDATE evaluation_results SET result=? WHERE id=?")
    .run(JSON.stringify(altered), row.id);
  await step(run, 1);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "error");
  assert.match(capture.run.message, /settings or reported model identity changed/);
  assert.equal(capture.results.length, 2, "both captures retained");
  assert.equal(h.geminiEnterpriseRequests.length, 2);
  await step(run, 2);
  assert.equal(h.geminiEnterpriseRequests.length, 2, "no traffic after the stop");
});

test("stopping the probe retains captured observations without further traffic", async () => {
  const settings = await draft();
  meteredEnterprise();
  const run = await begin(settings);
  await step(run, 0);
  const stopping = await runs.stopEvaluationRun(h.records(), h.userA, run.id);
  assert.equal(stopping.status, "stopping");
  await step(run, 1);
  const capture = await runs.readEvaluationRun(h.records(), h.userA, { runId: run.id });
  assert.equal(capture.run.status, "stopped");
  assert.equal(capture.run.completed, 1);
  assert.equal(capture.results.length, 1, "the captured observation is retained");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

test("the frozen manifest constants stay pinned to the enforced transport configuration", () => {
  assert.equal(probe.LATENCY_PROBE_VERSION, "content-latency-probe-1");
  assert.equal(probe.LATENCY_PROBE_MODEL, "gemini-enterprise/gemini-3.8-flash");
  assert.equal(probe.LATENCY_PROBE_NATIVE_MODEL, "gemini-3.8-flash");
  assert.equal(probe.LATENCY_PROBE_RESERVATION_MICROS, 2_800_000);
});

test("the plan builder refuses scope, identity and fixture drift offline", async () => {
  const baseline = baselineBundle();
  const identity = {
    version: baseline.version,
    canonicalHash: await hashing.contentChecksum(baseline),
    checksumAlgorithm: "sha256-canonical-json-v1",
    bundleHash: "0".repeat(64),
    bundleHashAlgorithm: "sha256-json-stringify-v1",
    storedChecksum: await hashing.contentChecksum(baseline),
    storedChecksumAlgorithm: "sha256-canonical-json-v1",
  };
  assert.throws(
    () => probePlan.createLatencyProbePlan(baseline, identity, "0".repeat(40)),
    /integrity check/,
    "a wrong bundle hash is refused",
  );
  identity.bundleHash = probePlanHash(baseline);
  assert.throws(
    () => probePlan.createLatencyProbePlan(baseline, identity, null),
    /exact built source SHA/,
  );
  assert.throws(
    () => probePlan.createLatencyProbePlan(baseline, identity, "not-a-sha"),
    /exact built source SHA/,
  );
  const changed = structuredClone(baseline);
  changed.cycles[0].question = "Changed?";
  assert.throws(
    () =>
      probePlan.createLatencyProbePlan(
        changed,
        { ...identity, version: changed.version },
        "0".repeat(40),
      ),
    /integrity|frozen reviewed draft baseline/,
  );
});

function probePlanHash(bundle) {
  return createHash("sha256").update(JSON.stringify(bundle)).digest("hex");
}
