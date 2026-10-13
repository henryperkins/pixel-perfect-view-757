import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { BASELINE_RESPONSES, READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";

const ORIGIN = "https://pattern.example.test";
const BUILTIN = { bundleSource: "builtin", provider: "lovable" };
let h, runs, postStep, combine;
let expected = null;
before(async () => {
  h = await createRecordsHarness();
  runs = await h.vite.ssrLoadModule("/src/lib/evaluation-runs.server.ts");
  postStep = (await h.vite.ssrLoadModule("/src/routes/api/public/evaluation-step.ts")).Route.options
    .server.handlers.POST;
  ({ combineReadingEvaluationResults: combine } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.shared.ts",
  ));
});
beforeEach(async () => {
  await h.reset();
  expected = null;
});
after(async () => {
  await h?.close();
});

async function makeAdmin(user = h.userA) {
  const result = await h.records().from("user_roles").insert({ user_id: user, role: "admin" });
  assert.equal(result.error, null);
}
function gatewayAnswers() {
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify(expected) } }] }),
  );
}
function signed(raw, secret = process.env.PATTERN_WORKFLOW_SECRET) {
  return postStep({
    request: new Request(`${ORIGIN}/api/public/evaluation-step`, {
      method: "POST",
      headers: { "x-pattern-signature": createHmac("sha256", secret).update(raw).digest("hex") },
      body: raw,
    }),
  });
}
/** One edge-plane call for the case at `position`, answered with its baseline draft. */
async function step(runId, position) {
  expected = BASELINE_RESPONSES[READING_EVAL_CASES[position]?.id] ?? null;
  const response = await signed(JSON.stringify(frozenStep(runId, position)));
  assert.equal(response.status, 200);
  return (await response.json()).next;
}
function frozenStep(runId, position) {
  const row = h.sqlite
    .prepare(
      "SELECT plan,qualification_profile,enterprise_thinking FROM evaluation_runs WHERE id=?",
    )
    .get(runId);
  return {
    runId,
    position,
    ...(row?.plan ? { planHash: JSON.parse(row.plan).hash } : {}),
    ...(row?.qualification_profile ? { qualificationProfile: row.qualification_profile } : {}),
    ...(row?.enterprise_thinking ? { enterpriseThinking: row.enterprise_thinking } : {}),
  };
}
/** Plays the evaluation Workflow: signed steps in order until the app answers no. */
async function drive(runId) {
  const answers = [];
  for (let position = 0; position < READING_EVAL_CASES.length; position++) {
    answers.push(await step(runId, position));
    if (!answers.at(-1)) break;
  }
  return answers;
}
const current = (runId) => runs.readEvaluationRun(h.records(), h.userA, { runId });

test("only admins start, read and stop runs; a start asks the edge plane to call the step endpoint", async () => {
  for (const attempt of [
    () => runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    () => runs.readEvaluationRun(h.records(), h.userA),
    () => runs.stopEvaluationRun(h.records(), h.userA, "any-run"),
  ])
    await assert.rejects(attempt(), /Only admins/);
  assert.equal(h.evaluationStarts.length, 0);

  await makeAdmin();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  assert.equal(run.status, "queued");
  assert.equal(run.total, READING_EVAL_CASES.length);
  assert.equal(run.completed, 0);
  assert.deepEqual(h.evaluationStarts, [
    {
      runId: run.id,
      total: READING_EVAL_CASES.length,
      callback: `${ORIGIN}/api/public/evaluation-step`,
      planHash: JSON.parse(
        h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(run.id).plan,
      ).hash,
    },
  ]);
  await assert.rejects(
    runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    /already running/,
  );
  assert.deepEqual((await runs.readEvaluationRun(h.records(), h.userA)).run.id, run.id);
  assert.equal((await runs.stopEvaluationRun(h.records(), h.userA, run.id)).status, "stopping");
  // Another admin cannot read or stop this admin's run.
  await makeAdmin(h.userB);
  assert.equal((await runs.readEvaluationRun(h.records(), h.userB)).run, null);
  await assert.rejects(
    runs.stopEvaluationRun(h.records(), h.userB, run.id),
    /Unknown synthetic evaluation run/,
  );
});

test("a configured public app URL replaces the request origin for callbacks", async () => {
  await makeAdmin();
  process.env.PATTERN_APP_URL = "https://published.example.test/";
  await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, "https://preview.example.test");
  assert.equal(
    h.evaluationStarts[0].callback,
    "https://published.example.test/api/public/evaluation-step",
  );
});

test("the step endpoint refuses unsigned or malformed calls without running a case", async () => {
  await makeAdmin();
  h.setGateway(() => {
    throw new Error("A refused step must not reach the model");
  });
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  const body = JSON.stringify({ runId: run.id, position: 0 });
  const unsigned = await postStep({
    request: new Request(`${ORIGIN}/api/public/evaluation-step`, { method: "POST", body }),
  });
  assert.equal(unsigned.status, 401);
  assert.equal((await signed(body, "not-the-workflow-secret")).status, 401);
  for (const raw of [
    "not json",
    JSON.stringify({ runId: run.id }),
    JSON.stringify({ runId: run.id, position: -1 }),
    JSON.stringify({ runId: run.id, position: 0, caseId: "arbitrary-private-prompt" }),
  ])
    assert.equal((await signed(raw)).status, 400, raw);
  assert.equal(await step("unknown-run", 0), false);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal((await current(run.id)).run.status, "queued");
});

test("a run keeps going without any browser and completes with a combinable report", async () => {
  await makeAdmin();
  gatewayAnswers();
  // The explicit transit candidate accepts the natal and transit fixture drafts.
  const run = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    { bundleSource: "transit-candidate", provider: "lovable" },
    ORIGIN,
  );
  const answers = await drive(run.id);
  assert.deepEqual(answers, [...Array(READING_EVAL_CASES.length - 1).fill(true), false]);
  assert.equal(h.gatewayRequests.length, READING_EVAL_CASES.length - 1);

  const { run: done, results } = await current(run.id);
  assert.equal(done.status, "complete");
  assert.equal(done.completed, READING_EVAL_CASES.length);
  assert.deepEqual(
    results.map((result) => result.case.id),
    READING_EVAL_CASES.map((fixed) => fixed.id),
  );
  const report = combine(results);
  assert.equal(report.partial, false);
  assert.equal(report.bundleSource, "transit-candidate");
  assert.equal(report.summary.syntheticModelAcceptanceRate, 1);

  const tail = await runs.readEvaluationRun(h.records(), h.userA, {
    runId: run.id,
    after: READING_EVAL_CASES.length - 2,
  });
  assert.deepEqual(
    tail.results.map((result) => result.case.id),
    READING_EVAL_CASES.slice(-2).map((fixed) => fixed.id),
  );
  assert.equal(await step(run.id, 0), false, "A finished run answers no further steps");
  assert.equal(h.gatewayRequests.length, READING_EVAL_CASES.length - 1);
});

test("a replayed step never repeats a stored case, and steps out of order end the run", async () => {
  await makeAdmin();
  gatewayAnswers();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  assert.equal(await step(run.id, 0), true);
  assert.equal(await step(run.id, 0), true);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal((await current(run.id)).results.length, 1);
  assert.equal(await step(run.id, 2), false);
  const { run: ended } = await current(run.id);
  assert.equal(ended.status, "error");
  assert.match(ended.message, /out of order/);
  assert.equal(h.gatewayRequests.length, 1);
});

test("stop after the current case and halting failures end the run without further requests", async () => {
  await makeAdmin();
  gatewayAnswers();
  const stopped = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  assert.equal(await step(stopped.id, 0), true);
  await runs.stopEvaluationRun(h.records(), h.userA, stopped.id);
  assert.equal(await step(stopped.id, 1), false);
  const after = await current(stopped.id);
  assert.equal(after.run.status, "stopped");
  assert.equal(after.run.completed, 1);
  assert.equal(after.results.length, 1);
  assert.equal(h.gatewayRequests.length, 1);

  h.setGateway(() => new Response("", { status: 402 }));
  const halted = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  assert.equal(await step(halted.id, 0), false);
  const { run, results } = await current(halted.id);
  assert.equal(run.status, "halted");
  assert.match(run.message, /requires available credit/);
  assert.equal(results.length, 1);
  assert.equal(results[0].case.diagnostics.code, "credit");
});

test("an active run blocks a second start until it stalls, then a new run replaces it", async () => {
  await makeAdmin();
  const first = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  await assert.rejects(
    runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    /already running/,
  );
  h.sqlite
    .prepare("UPDATE evaluation_runs SET updated_at = ? WHERE id = ?")
    .run("2000-01-01T00:00:00.000Z", first.id);
  const second = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  assert.notEqual(second.id, first.id);
  const { run: replaced } = await current(first.id);
  assert.equal(replaced.status, "error");
  assert.match(replaced.message, /replaced by a new run/);
  assert.equal((await runs.readEvaluationRun(h.records(), h.userA)).run.id, second.id);
});

test("an unreachable edge plane marks the run as an error and requests no case", async () => {
  await makeAdmin();
  h.setEvaluationPlane(() => new Response("unavailable", { status: 503 }));
  await assert.rejects(
    runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    /dispatch could not be confirmed/,
  );
  const { run } = await runs.readEvaluationRun(h.records(), h.userA);
  assert.equal(run.status, "error");
  assert.equal(h.gatewayRequests.length, 0);
});

test("a case runs only while the admin who started the run is still an admin", async () => {
  await makeAdmin();
  gatewayAnswers();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  h.sqlite.prepare("DELETE FROM user_roles WHERE user_id = ?").run(h.userA);
  assert.equal(await step(run.id, 0), false);
  const row = h.sqlite
    .prepare("SELECT status, message FROM evaluation_runs WHERE id = ?")
    .get(run.id);
  assert.equal(row.status, "error");
  assert.match(row.message, /no longer has admin access/);
  assert.equal(h.gatewayRequests.length, 0);
});

test("runs write only evaluation tables and never read member records", async () => {
  await makeAdmin();
  await h.seedChart(h.records(), h.userA);
  const memberTables = () =>
    Object.fromEntries(
      h.sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'evaluation_%' ORDER BY name",
        )
        .all()
        .map(({ name }) => [name, h.sqlite.prepare(`SELECT * FROM ${name} ORDER BY id`).all()]),
    );
  const previous = memberTables();
  gatewayAnswers();
  h.requests.length = 0;
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  await drive(run.id);
  assert.deepEqual(memberTables(), previous);
  assert.ok(
    h.requests.every(({ sql }) =>
      /\bfrom "?(?:user_roles|evaluation_runs|evaluation_results)\b|^(?:insert into|update) "?evaluation_(?:runs|results)\b/i.test(
        sql,
      ),
    ),
    "Only roles and evaluation tables are touched",
  );
  const serialized = JSON.stringify(await current(run.id));
  assert.doesNotMatch(serialized, /Private birth place|local-reading-user|example\.invalid/);
});

test("overlapping signed steps reserve one model attempt before transport and expose no partial case as completed", async () => {
  await makeAdmin();
  let entered;
  const entering = new Promise((resolve) => (entered = resolve));
  let finish;
  const finished = new Promise((resolve) => (finish = resolve));
  h.setGateway(async () => {
    entered();
    await finished;
    return Response.json({
      choices: [
        { message: { content: JSON.stringify(BASELINE_RESPONSES[READING_EVAL_CASES[0].id]) } },
      ],
    });
  });
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  const first = runs.evaluationStep(h.records(), frozenStep(run.id, 0));
  await entering;
  const duplicate = runs.evaluationStep(h.records(), frozenStep(run.id, 0));
  // Release the held provider even on the old double-call implementation.
  await new Promise((resolve) => setTimeout(resolve, 20));
  finish();
  const outcomes = await Promise.allSettled([first, duplicate]);
  assert.equal(h.gatewayRequests.length, 1, "reservation must precede the first provider call");
  assert.equal(outcomes[0].status, "fulfilled");
  assert.equal(outcomes[1].status, "fulfilled");
  assert.deepEqual(outcomes[1].value, { next: false });
  assert.equal((await current(run.id)).results.length, 1);
});

test("a failed result write preserves a spent attempt and an explicit replay never calls the model again", async () => {
  await makeAdmin();
  gatewayAnswers();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  h.setFault({ matches: (sql) => sql.startsWith('update "evaluation_results"') });
  // The result may fail to store after transport, but a durable pre-call claim remains.
  await step(run.id, 0).catch(() => false);
  h.setFault(null);
  const before = h.gatewayRequests.length;
  assert.equal(await step(run.id, 0), false);
  assert.equal(h.gatewayRequests.length, before);
  const rows = h.sqlite.prepare("SELECT result FROM evaluation_results WHERE run_id=?").all(run.id);
  assert.equal(rows.length, 1);
  assert.equal(JSON.parse(rows[0].result).kind, "attempt-reservation");
  assert.equal((await current(run.id)).results.length, 0);
  const incomplete = await current(run.id);
  assert.equal(incomplete.ledger.entries.length, 1);
  assert.equal(incomplete.ledger.entries[0].capture, "uncertain");
  assert.equal(incomplete.ledger.entries[0].attempted, true);
});

test("a captured credit failure survives a lost terminal update and a replay cannot resume it", async () => {
  await makeAdmin();
  h.setGateway(() => new Response("", { status: 402 }));
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  h.setFault({
    matches: (sql, params) => /update.*evaluation_runs/i.test(sql) && params.includes("halted"),
  });
  await step(run.id, 0).catch(() => false);
  h.setFault(null);
  assert.equal((await current(run.id)).results.length, 1);
  assert.equal(await step(run.id, 0), false);
  assert.equal((await current(run.id)).run.status, "halted");
  assert.equal(h.gatewayRequests.length, 1);
});

test("a late captured case preserves an externally stopped run and cannot advance the Workflow", async () => {
  await makeAdmin();
  let entered, finish;
  const entering = new Promise((r) => (entered = r)),
    finished = new Promise((r) => (finish = r));
  h.setGateway(async () => {
    entered();
    await finished;
    return Response.json({
      choices: [
        { message: { content: JSON.stringify(BASELINE_RESPONSES[READING_EVAL_CASES[0].id]) } },
      ],
    });
  });
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  const pending = runs.evaluationStep(h.records(), frozenStep(run.id, 0));
  await entering;
  h.sqlite
    .prepare("UPDATE evaluation_runs SET status='error',message='external source stop' WHERE id=?")
    .run(run.id);
  finish();
  assert.deepEqual(await pending, { next: false });
  assert.equal((await current(run.id)).run.status, "error");
  assert.equal((await current(run.id)).results.length, 1);
});

test("qualification starts require a closed profile and explicit campaign budget; each frozen arm can start only once", async () => {
  await makeAdmin();
  const settings = {
    bundleSource: "writing-candidate",
    provider: "lovable",
    qualificationProfile: "writing-base",
  };
  await assert.rejects(runs.startEvaluationRun(h.records(), h.userA, settings, ORIGIN), /budget/);
  await assert.rejects(
    runs.startEvaluationRun(
      h.records(),
      h.userA,
      {
        ...settings,
        qualificationProfile: "custom-prompt",
        budget: { dollarCeilingCents: 2500, reviewReserveCents: 500 },
      },
      ORIGIN,
    ),
    /profile/,
  );
  const run = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    { ...settings, budget: { dollarCeilingCents: 2500, reviewReserveCents: 500 } },
    ORIGIN,
  );
  assert.equal(run.qualificationProfile, "writing-base");
  assert.equal(run.attemptLimit, 49);
  assert.equal(run.campaignId, run.id);
  const row = h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(run.id);
  const plan = JSON.parse(row.plan);
  assert.equal(plan.cases.length, 50);
  assert.equal(plan.attemptLimit, 49);
  assert.match(plan.sourceSha, /^[a-f0-9]{40}$/);
  h.sqlite.prepare("UPDATE evaluation_runs SET status='stopped' WHERE id=?").run(run.id);
  await assert.rejects(
    runs.startEvaluationRun(h.records(), h.userA, { ...settings, campaignId: run.id }, ORIGIN),
    /already|once/,
  );
  const next = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    { ...settings, qualificationProfile: "writing-natal", campaignId: run.id },
    ORIGIN,
  );
  assert.equal(next.campaignId, run.id);
  assert.equal(next.qualificationProfile, "writing-natal");
  assert.equal(h.gatewayRequests.length, 0);
});

test("a frozen source change stops the next planned case before provider traffic", async () => {
  await makeAdmin();
  gatewayAnswers();
  const bundleModule = await h.vite.ssrLoadModule("/src/lib/content/writing-candidate-bundle.ts");
  const run = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    {
      bundleSource: "writing-candidate",
      provider: "lovable",
      qualificationProfile: "writing-base",
      budget: { dollarCeilingCents: 2500, reviewReserveCents: 500 },
    },
    ORIGIN,
  );
  const original = bundleModule.WRITING_CANDIDATE_BUNDLE.version;
  try {
    bundleModule.WRITING_CANDIDATE_BUNDLE.version = "builtin-changed";
    assert.equal(await step(run.id, 0), false);
    assert.equal(h.gatewayRequests.length, 0);
    assert.equal((await current(run.id)).run.status, "error");
  } finally {
    bundleModule.WRITING_CANDIDATE_BUNDLE.version = original;
  }
});

test("concurrent starts for one admin create only one active Workflow", async () => {
  await makeAdmin();
  const answers = await Promise.allSettled([
    runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
  ]);
  assert.equal(answers.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(h.evaluationStarts.length, 1);
  assert.equal(
    h.sqlite
      .prepare("SELECT count(*) n FROM evaluation_runs WHERE status IN ('queued','running')")
      .get().n,
    1,
  );
});
test("unknown model/billing stops qualification with a full reservation and dollar ceilings stop before transport", async () => {
  await makeAdmin();
  gatewayAnswers();
  const run = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    {
      bundleSource: "writing-candidate",
      provider: "lovable",
      qualificationProfile: "writing-base",
      budget: { dollarCeilingCents: 400, reviewReserveCents: 100 },
    },
    ORIGIN,
  );
  assert.equal(await step(run.id, 0), false);
  assert.equal(
    h.sqlite.prepare("SELECT reserved_micros FROM evaluation_results WHERE run_id=?").get(run.id)
      .reserved_micros,
    2800000,
  );
  assert.equal(await step(run.id, 1), false);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal((await current(run.id)).run.status, "halted");
  assert.match((await current(run.id)).run.message, /identity|unknown|incomplete/);
  const next = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    {
      bundleSource: "writing-candidate",
      provider: "lovable",
      qualificationProfile: "writing-natal",
      campaignId: run.id,
    },
    ORIGIN,
  );
  assert.equal(await step(next.id, 0), false);
  assert.equal(h.gatewayRequests.length, 1);
  assert.match((await current(next.id)).run.message, /ceiling/);
});

test("the durable Enterprise pilot freezes both arms, signs each position and records all 24 independent observations", async () => {
  await makeAdmin();
  h.setGeminiEnterprise(() =>
    Response.json({
      modelVersion: "gemini-3.8-flash-20260902",
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 100,
        thoughtsTokenCount: 50,
        totalTokenCount: 250,
      },
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(expected) }] } },
      ],
    }),
  );
  const settings = {
    bundleSource: "transit-candidate",
    provider: "gemini-enterprise",
    enterpriseThinking: "LOW",
    budget: { dollarCeilingCents: 2500, reviewReserveCents: 500 },
  };
  const low = await runs.startEvaluationRun(h.records(), h.userA, settings, ORIGIN);
  const plan = JSON.parse(
    h.sqlite.prepare("SELECT plan FROM evaluation_runs WHERE id=?").get(low.id).plan,
  );
  assert.deepEqual(Object.keys(plan.pilotPlans), ["LOW", "MEDIUM"]);
  assert.equal(low.total, 12);
  assert.equal(low.attemptLimit, 12);
  for (let p = 0; p < 12; p++) {
    expected = BASELINE_RESPONSES[plan.cases[p].id];
    assert.equal((await signed(JSON.stringify(frozenStep(low.id, p)))).status, 200);
  }
  assert.equal((await current(low.id)).run.status, "complete");
  const medium = await runs.startEvaluationRun(
    h.records(),
    h.userA,
    {
      bundleSource: "transit-candidate",
      provider: "gemini-enterprise",
      enterpriseThinking: "MEDIUM",
      campaignId: low.id,
    },
    ORIGIN,
  );
  for (let p = 0; p < 12; p++) {
    expected = BASELINE_RESPONSES[plan.cases[p].id];
    await signed(JSON.stringify(frozenStep(medium.id, p)));
  }
  const done = await current(medium.id);
  assert.equal(done.run.status, "complete");
  assert.equal(done.ledger.campaignAttempts, 24);
  assert.equal(h.geminiEnterpriseRequests.length, 24);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(done.ledger.entries.length, 12);
  assert.equal(h.geminiEnterpriseRequests[0].generationConfig.thinkingConfig.thinkingLevel, "LOW");
  assert.equal(
    h.geminiEnterpriseRequests[12].generationConfig.thinkingConfig.thinkingLevel,
    "MEDIUM",
  );
  assert.equal(h.geminiEnterpriseRequests[0].generationConfig.maxOutputTokens, 65536);
  await assert.rejects(
    runs.startEvaluationRun(
      h.records(),
      h.userA,
      {
        bundleSource: "transit-candidate",
        provider: "gemini-enterprise",
        enterpriseThinking: "MEDIUM",
        campaignId: low.id,
      },
      ORIGIN,
    ),
    /once|already/,
  );
});

test("signed steps with a different source plan or profile stop before provider traffic", async () => {
  await makeAdmin();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  const response = await signed(
    JSON.stringify({ ...frozenStep(run.id, 0), planHash: "f".repeat(64) }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).next, false);
  assert.equal(h.gatewayRequests.length, 0);
  assert.match((await current(run.id)).run.message, /Signed/);
});

test("a stop received just before attempt reservation settles as stopped without a false budget failure", async () => {
  await makeAdmin();
  gatewayAnswers();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  h.setFault({
    matches: (sql) => {
      if (sql.startsWith("INSERT INTO evaluation_results"))
        h.sqlite.prepare("UPDATE evaluation_runs SET status='stopping' WHERE id=?").run(run.id);
      return false;
    },
  });
  assert.equal(await step(run.id, 0), false);
  h.setFault(null);
  const state = await current(run.id);
  assert.equal(state.run.status, "stopped");
  assert.doesNotMatch(state.run.message ?? "", /ceiling/);
  assert.equal(h.gatewayRequests.length, 0);
});

test("historical captures retain their observed attempts while legacy cost accounting remains unknown", async () => {
  await makeAdmin();
  gatewayAnswers();
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  await step(run.id, 0);
  h.sqlite.prepare("UPDATE evaluation_runs SET plan=NULL,status='stopped' WHERE id=?").run(run.id);
  h.sqlite.prepare("UPDATE evaluation_results SET attempted=0 WHERE run_id=?").run(run.id);
  const state = await current(run.id);
  assert.equal(state.ledger.entries[0].attempted, true);
  assert.equal(state.ledger.campaignAttempts, 1);
  assert.equal(state.ledger.costStatus, "legacy-accounting-unknown");
});

test("a lost Workflow startup acknowledgement preserves captures without claiming no case was requested", async () => {
  await makeAdmin();
  gatewayAnswers();
  h.setEvaluationPlane(async (body) => {
    await step(body.runId, 0);
    return new Response("", { status: 503 });
  });
  await assert.rejects(
    runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    /could not be confirmed/,
  );
  const state = await runs.readEvaluationRun(h.records(), h.userA);
  assert.equal(state.ledger.campaignAttempts, 1);
  assert.equal(state.results.length, 1);
  assert.equal(h.gatewayRequests.length, 1);
  assert.doesNotMatch(state.run.message, /no case was requested/);
});

test("reported model changes halt even when the first response had no model identity", async () => {
  await makeAdmin();
  h.setGateway(() =>
    Response.json({
      model:
        h.gatewayRequests.length === 1
          ? undefined
          : h.gatewayRequests.length === 2
            ? "gemini-3.8-flash-20260902"
            : "gemini-3.8-flash-20261012",
      choices: [{ message: { content: JSON.stringify(expected) } }],
    }),
  );
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN);
  assert.equal(await step(run.id, 0), true);
  assert.equal(await step(run.id, 1), true);
  assert.equal(await step(run.id, 2), false);
  const state = await current(run.id);
  assert.equal(state.results.length, 3);
  assert.equal(state.run.status, "error");
  assert.match(state.run.message, /model identity/);
});

test("a lagging duplicate keeps a stop request active until the winning provider call finishes", async () => {
  await makeAdmin();
  let paused, releaseLag, entered, releaseProvider;
  const atClaim = new Promise((r) => (paused = r)),
    lagGate = new Promise((r) => (releaseLag = r)),
    entering = new Promise((r) => (entered = r)),
    providerGate = new Promise((r) => (releaseProvider = r));
  h.setGateway(async () => {
    entered();
    await providerGate;
    return Response.json({
      choices: [
        { message: { content: JSON.stringify(BASELINE_RESPONSES[READING_EVAL_CASES[0].id]) } },
      ],
    });
  });
  const run = await runs.startEvaluationRun(h.records(), h.userA, BUILTIN, ORIGIN),
    db = h.records();
  const lagDb = {
    ...db,
    exec: async (sql, params) => {
      if (sql.startsWith("INSERT INTO evaluation_results")) {
        paused();
        await lagGate;
      }
      return db.exec(sql, params);
    },
  };
  const lag = runs.evaluationStep(lagDb, frozenStep(run.id, 0));
  await atClaim;
  const winning = runs.evaluationStep(db, frozenStep(run.id, 0));
  await entering;
  await runs.stopEvaluationRun(db, h.userA, run.id);
  releaseLag();
  assert.deepEqual(await lag, { next: false });
  const status = (await current(run.id)).run.status;
  releaseProvider();
  await winning;
  assert.equal(status, "stopping");
  assert.equal((await current(run.id)).run.status, "stopped");
  assert.equal((await current(run.id)).results.length, 1);
  assert.equal(h.gatewayRequests.length, 1);
});
