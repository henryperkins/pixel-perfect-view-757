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
  const response = await signed(JSON.stringify({ runId, position }));
  assert.equal(response.status, 200);
  return (await response.json()).next;
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
    /could not start this run/,
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
