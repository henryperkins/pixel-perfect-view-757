import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async () => {
  await h.reset();
});
after(async () => {
  await h?.close();
});

async function admin() {
  const result = await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  assert.equal(result.error, null);
}
function diagnostic(outcome = "accepted", code = "accepted", extra = {}) {
  return {
    version: 1,
    promptVersion: "daily-astro-body-1",
    validatorVersion: "daily-reference-1",
    model: "google/gemini-3.7-flash",
    outcome,
    attempted: !["no_cycle", "not_configured"].includes(code),
    code,
    durationMs: 12,
    paragraph: null,
    ...extra,
  };
}
async function reading(outcome = "accepted", code = "accepted", options = {}) {
  const id = options.id ?? randomUUID();
  const meta = options.meta ?? {
    diagnostics: diagnostic(outcome, code, options.diagnostics),
    citations:
      outcome === "accepted" ? [{ paragraph: 1, facts: options.facts ?? ["C1", "I1"] }] : [],
    reason: "RAW_PRIVATE_ERROR_SENTINEL",
  };
  const result = await h
    .records()
    .from("daily_readings")
    .insert({
      id,
      user_id: options.user ?? h.userA,
      reading_date: options.day ?? "2026-10-11",
      created_at: options.createdAt ?? "2026-10-11T12:00:00.000Z",
      release_version: options.release ?? "builtin-0.2.0",
      headline: "Private headline sentinel",
      body_ct: "UNREAD_ENCRYPTED_PROSE_SENTINEL",
      idempotency_key: id,
      language_mode: outcome === "accepted" ? "model" : "template",
      language_model: outcome === "accepted" ? "google/gemini-3.7-flash" : null,
      language_meta: meta,
    });
  assert.equal(result.error, null, result.error?.message);
  return id;
}

test("quality feedback has separate default-off permission and never crosses the language boundary", () => {
  const { SOURCE_MAP, defaultGranted, isPermitted, assertUse } = h.registryModule;
  const source = SOURCE_MAP["USR-15"];
  assert.ok(source);
  assert.deepEqual(
    [source.tier, source.sensitivity, source.phase, source.retention_days],
    [1, "ordinary", "launch", 730],
  );
  assert.deepEqual(source.allowed_uses, ["quality_measurement"]);
  assert.equal(defaultGranted(source), false);
  for (const grants of [[], ["USR-11"]])
    assert.equal(isPermitted("USR-15", "quality_measurement", new Set(grants)), false);
  assert.equal(isPermitted("USR-15", "quality_measurement", new Set(["USR-15"])), true);
  assert.equal(isPermitted("USR-15", "external_language", new Set(["USR-15"])), false);
  assert.throws(() => assertUse("USR-15", "external_language"));
  assert.deepEqual(SOURCE_MAP["USR-11"].allowed_uses, ["personalisation", "provenance"]);
});

test("non-admin cannot query aggregate metadata or feedback", async () => {
  h.requests.length = 0;
  assert.deepEqual(await h.app.readingQuality(h.records(), h.userA), { isAdmin: false });
  assert.equal(
    h.requests.some((r) => /daily_readings|reading_feedback|source_consents/.test(r.sql)),
    false,
  );
});

test("attempt rate separates accepted, rejected, unavailable, quiet, unconfigured and legacy rows", async () => {
  await admin();
  await reading();
  await reading("rejected", "sentence", { diagnostics: { paragraph: 2 } });
  await reading("unavailable", "timeout");
  await reading("skipped", "no_cycle", { diagnostics: { durationMs: null } });
  await reading("unavailable", "not_configured", { diagnostics: { durationMs: null } });
  await reading("rejected", "shape", {
    meta: {
      reason: "RAW_PRIVATE_ERROR_SENTINEL",
      facts: [{ id: "F1", statement: "PRIVATE_CONTEXT_SENTINEL" }],
    },
  });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.deepEqual(report.measurement, {
    instrumented: 5,
    attempts: 3,
    accepted: 1,
    rejected: 1,
    unavailable: 1,
    skipped: 1,
    quietSkips: 1,
    noInterpretationSkips: 0,
    unconfigured: 1,
    legacy: 1,
    fallbackCount: 2,
    fallbackRate: 66.7,
  });
  const output = JSON.stringify(report);
  for (const secret of [
    "RAW_PRIVATE_ERROR_SENTINEL",
    "PRIVATE_CONTEXT_SENTINEL",
    "UNREAD_ENCRYPTED_PROSE_SENTINEL",
    h.userA,
  ])
    assert.equal(output.includes(secret), false);
  assert.equal(report.outcomes.find((r) => r.code === "sentence").count, 1);
  assert.equal(report.configurations[0].attempts, 3);
  assert.equal(
    h.requests.some((r) =>
      /SELECT.*body_ct|SELECT.*note_ct|SELECT.*headline|SELECT.*labels/.test(r.sql),
    ),
    false,
  );
});

test("feedback is paired by owned reading and separate current consent, with neutral distinct from unrated", async () => {
  await admin();
  const model = await reading();
  const fallback = await reading("rejected", "coverage");
  await reading();
  const foreign = await reading("accepted", "accepted", { user: h.userB });
  await h.app.submitFeedback(h.records(), h.userA, model, 1, []);
  await h.app.submitFeedback(h.records(), h.userA, fallback, 0, []);
  await h.app.submitFeedback(h.records(), h.userB, foreign, -1, []);
  await h.app.setConsent(h.records(), h.userA, "USR-11", true);
  let report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(
    report.feedback.reduce((n, row) => n + row.ratedReadings, 0),
    0,
  );
  await h.app.setConsent(h.records(), h.userA, "USR-15", true);
  report = await h.app.readingQuality(h.records(), h.userA);
  const m = report.feedback.find((row) => row.cohort === "model");
  const t = report.feedback.find((row) => row.cohort === "template");
  assert.deepEqual(
    [
      m.readings,
      m.eligibleReadings,
      m.ratedReadings,
      m.coverage,
      m.positive,
      m.neutral,
      m.negative,
      m.average,
    ],
    [3, 2, 1, 50, 1, 0, 0, 1],
  );
  assert.deepEqual([t.ratedReadings, t.neutral, t.average], [1, 1, 0]);
  await h.app.setConsent(h.records(), h.userA, "USR-15", false);
  report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(
    report.feedback.reduce((n, row) => n + row.ratedReadings, 0),
    0,
  );
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) AS n FROM reading_feedback").get().n, 3);
});

test("feedback cannot be written for another reader's reading", async () => {
  const foreign = await reading("accepted", "accepted", { user: h.userB });
  await assert.rejects(
    h.app.submitFeedback(h.records(), h.userA, foreign, 1, []),
    /own|found|available/i,
  );
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) AS n FROM reading_feedback").get().n, 0);
});

test("empty and skipped-only reports have no attempt rate rather than a measured zero", async () => {
  await admin();
  let report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.measurement.fallbackRate, null);
  await reading("skipped", "no_cycle", { diagnostics: { durationMs: null } });
  report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.measurement.fallbackRate, null);
  assert.equal(report.measurement.attempts, 0);
});

test("window is bounded by generation time with deterministic same-day row identities", async () => {
  await admin();
  const recent = await reading("accepted", "accepted", {
    day: "2020-01-01",
    createdAt: "2026-10-11T14:00:00.000Z",
  });
  await reading("accepted", "accepted", {
    day: "2099-01-01",
    createdAt: "2026-10-10T12:00:00.000Z",
  });
  for (let i = 0; i < 299; i++) await reading("rejected", "sentence");
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.total, 300);
  assert.equal(report.window.truncated, true);
  assert.equal(report.window.newest, "2026-10-11T14:00:00.000Z");
  assert.equal(report.window.oldest, "2026-10-11T12:00:00.000Z");
  assert.equal(report.samples[0].id, recent);
  assert.equal(new Set(report.samples.map((s) => s.id)).size, report.samples.length);
  assert.equal(report.model, 1);
});

test("generation ordering normalizes SQLite, ISO and offset timestamps to the same clock", async () => {
  await admin();
  const early = await reading("accepted", "accepted", { createdAt: "2026-10-11T09:00:00.000Z" });
  const late = await reading("accepted", "accepted", { createdAt: "2026-10-11 18:00:00" });
  const offset = await reading("accepted", "accepted", { createdAt: "2026-10-12T07:00:00+14:00" });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.deepEqual(
    report.samples.map((s) => s.id),
    [late, offset, early],
  );
  assert.equal(report.window.newest, "2026-10-11T18:00:00.000Z");
  assert.equal(report.window.oldest, "2026-10-11T09:00:00.000Z");
});

test("malformed or mode-inconsistent diagnostics are legacy and do not fabricate attempts", async () => {
  await admin();
  await reading("accepted", "accepted", { diagnostics: { attempted: false } });
  await reading("accepted", "accepted", { meta: { diagnostics: diagnostic("rejected", "shape") } });
  await reading("rejected", "shape", { diagnostics: { code: "RAW_PRIVATE_ERROR_SENTINEL" } });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.measurement.legacy, 3);
  assert.equal(report.measurement.attempts, 0);
  assert.equal(report.measurement.fallbackRate, null);
  assert.deepEqual(report.outcomes, []);
});

test("future prompt versions stay separate and fact-kind readings count distinct rows", async () => {
  await admin();
  await reading("accepted", "accepted", { facts: ["C1", "I1"] });
  await reading("accepted", "accepted", {
    facts: ["C2", "I1"],
    diagnostics: { promptVersion: "daily-astro-body-2" },
    release: "builtin-0.3.0",
  });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.configurations.length, 2);
  assert.equal(
    report.configurations.every((config) => config.attempts === 1 && config.fallbackRate === 0),
    true,
  );
  assert.equal(report.kinds.find((kind) => kind.label === "Timing window").readings, 2);
  assert.equal(report.kinds.find((kind) => kind.label === "Published interpretation").readings, 2);
});

test("timeout budgets split configurations without turning prior diagnostics into legacy", async () => {
  await admin();
  await reading(); // Previous structured diagnostics did not record a budget.
  await reading("accepted", "accepted", { diagnostics: { gatewayTimeoutMs: 20_000 } });
  await reading("rejected", "id", { diagnostics: { gatewayTimeoutMs: 20_000, paragraph: 1 } });
  await reading("unavailable", "timeout", { diagnostics: { gatewayTimeoutMs: 30_000 } });
  await reading("unavailable", "timeout", { diagnostics: { gatewayTimeoutMs: null } });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.measurement.instrumented, 5);
  assert.equal(report.measurement.legacy, 0);
  assert.equal(report.measurement.attempts, 5);
  assert.equal(report.configurations.length, 3);
  const config = (budget) => report.configurations.find((row) => row.gatewayTimeoutMs === budget);
  assert.deepEqual(
    [config(null).readings, config(null).attempts, config(null).fallbackRate],
    [2, 2, 50],
  );
  assert.deepEqual(
    [
      config(20_000).readings,
      config(20_000).accepted,
      config(20_000).rejected,
      config(20_000).fallbackRate,
    ],
    [2, 1, 1, 50],
  );
  assert.deepEqual(
    [config(30_000).readings, config(30_000).unavailable, config(30_000).fallbackRate],
    [1, 1, 100],
  );
  assert.ok(report.configurations.every((row) => row.promptVersion === "daily-astro-body-1"));
});

test("malformed recorded timeout budgets cannot fabricate a configuration or leak raw values", async () => {
  await admin();
  for (const budget of [0, -1, 1.5, 120_001, "20000", "RAW_PRIVATE_POLICY_SENTINEL", {}])
    await reading("accepted", "accepted", { diagnostics: { gatewayTimeoutMs: budget } });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.measurement.instrumented, 0);
  assert.equal(report.measurement.legacy, 7);
  assert.equal(report.measurement.attempts, 0);
  assert.deepEqual(report.configurations, []);
  assert.equal(JSON.stringify(report).includes("RAW_PRIVATE_POLICY_SENTINEL"), false);
});

test("forged foreign feedback and invalid scores are excluded from owned opt-in cohorts", async () => {
  await admin();
  const id = await reading();
  await h.app.setConsent(h.records(), h.userA, "USR-15", true);
  await h.app.setConsent(h.records(), h.userB, "USR-15", true);
  await h
    .records()
    .from("reading_feedback")
    .insert({ user_id: h.userB, reading_id: id, resonance: 1 });
  await h
    .records()
    .from("reading_feedback")
    .insert({ user_id: h.userA, reading_id: id, resonance: 42 });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.feedback[0].eligibleReadings, 1);
  assert.equal(report.feedback[0].ratedReadings, 0);
  assert.equal(report.feedback[0].average, null);
});

test("real cached readings keep one persisted observation through reload and database reopen", async () => {
  await admin();
  await h.seedChart(h.records());
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  const before = await h.app.readingQuality(h.records(), h.userA);
  h.reopen();
  const cached = await h.app.getToday(h.records(), h.userA, "UTC");
  const after = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(cached.reading.id, first.reading.id);
  assert.deepEqual(after.measurement, before.measurement);
  assert.equal(after.measurement.instrumented, 1);
  assert.equal(after.measurement.skipped, 1);
  assert.equal(after.total, 1);
});

test("records and consent lookup failures are reported instead of presenting partial metrics", async () => {
  await admin();
  await reading();
  h.setFault({ matches: (sql) => /from\s+"?source_consents"?/i.test(sql) });
  await assert.rejects(h.app.readingQuality(h.records(), h.userA), /failure|failed/i);
});

test("quality separates synthesis references, quiet skips and missing-interpretation skips", async () => {
  await admin();
  await reading("accepted", "accepted", { facts: ["S1", "C1", "I1", "C2", "I2"] });
  await reading("skipped", "no_cycle", { diagnostics: { attempted: false, durationMs: null } });
  await reading("skipped", "no_interpretation", {
    diagnostics: { attempted: false, durationMs: null },
  });
  const report = await h.app.readingQuality(h.records(), h.userA);
  assert.equal(report.kinds.find((k) => k.label === "Published synthesis")?.readings, 1);
  assert.equal(report.measurement.quietSkips, 1);
  assert.equal(report.measurement.noInterpretationSkips, 1);
  assert.equal(report.measurement.skipped, 2);
  assert.equal(report.measurement.attempts, 1);
});
