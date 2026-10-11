import assert from "node:assert/strict";
import { test } from "node:test";
import http from "node:http";
import net from "node:net";
import https from "node:https";
import tls from "node:tls";
import dnsPromises from "node:dns/promises";
import {
  compareReports,
  evaluateReadings,
  validateResponses,
  withNetworkBlocked,
} from "../scripts/evaluate-readings.mjs";
import {
  BASELINE_RESPONSES,
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "../scripts/reading-eval-cases.mjs";

test("fixed synthetic baseline exercises the real daily validators without quality scores", async () => {
  const report = await evaluateReadings();
  assert.equal(READING_EVAL_CASES.length, 10);
  assert.equal(report.fixtureVersion, READING_EVAL_FIXTURE_VERSION);
  assert.equal(report.source, "synthetic-baseline");
  assert.equal(report.network, "blocked; gateway replayed in memory");
  assert.deepEqual(report.summary.outcomes, {
    accepted: 9,
    rejected: 0,
    unavailable: 0,
    skipped: 1,
  });
  assert.equal(report.summary.gatewayReplays, 9);
  assert.equal(report.summary.liveAcceptanceRate, null);
  assert.equal(report.summary.replayAcceptanceRate, 1);
  assert.match(report.warning, /not.*live|does not.*live/i);
  assert.ok(
    report.cases.every((c) => Object.values(c.manualReview).every((value) => value === null)),
  );
  assert.ok(report.cases.every((c) => c.configHash && c.facts.length && c.output.body));
  const unknown = report.cases.find((c) => c.id === "unknown-birth-time");
  assert.deepEqual(unknown.eligibleCycleKeys, ["saturn_square_sun"]);
  const moon = report.cases.find((c) => c.id === "moon-dst-boundary");
  assert.equal(moon.localNoon, "2026-11-01T17:00:00.000Z");
  assert.equal(moon.facts[0].cycle.exactDate, "2026-10-31");
  assert.equal(moon.config.timeZone, "America/New_York");
  const multiple = report.cases.find((c) => c.id === "multiple-cycles");
  assert.equal(multiple.eligibleCycleKeys.length, 3);
  const quiet = report.cases.find((c) => c.id === "quiet-threshold");
  assert.equal(quiet.diagnostics.attempted, false);
  assert.deepEqual(quiet.eligibleCycleKeys, []);
});

test("candidate replay records a real validator rejection and deterministic fallback", async () => {
  const responses = structuredClone(BASELINE_RESPONSES);
  responses["saturn-square-sun"].paragraphs[0].facts.push("UNSUPPLIED");
  const report = await evaluateReadings({ responses });
  assert.equal(report.source, "candidate-replay");
  assert.equal(report.summary.outcomes.rejected, 1);
  assert.equal(report.summary.replayAcceptanceRate, 8 / 9);
  const item = report.cases.find((c) => c.id === "saturn-square-sun");
  assert.equal(item.diagnostics.outcome, "rejected");
  assert.equal(item.diagnostics.code, "id");
  assert.equal(item.output.mode, "template");
  assert.equal(item.output.body, item.template.body);
  assert.ok(!item.output.body.includes("UNSUPPLIED"));
});

test("replay requires exactly the fixed case IDs before evaluating responses", () => {
  const missing = structuredClone(BASELINE_RESPONSES);
  delete missing["quiet-threshold"];
  assert.throws(() => validateResponses(missing), /exact.*case|missing/i);
  assert.throws(() => validateResponses({ ...BASELINE_RESPONSES, mystery: {} }), /case|unknown/i);
  assert.throws(() => validateResponses([]), /object/i);
  assert.throws(
    () => validateResponses({ ...BASELINE_RESPONSES, "quiet-threshold": {} }),
    /quiet.*null/i,
  );
});

test("comparison refuses changed fixtures, case sets, or input configs", async () => {
  const before = await evaluateReadings();
  const after = structuredClone(before);
  const compared = compareReports(before, after);
  assert.equal(compared.acceptedDelta, 0);
  assert.equal(compared.cases.length, 10);
  assert.equal(
    compared.warning,
    "Replay changes do not establish live acceptance, grounding, or writing quality.",
  );
  after.promptVersion = "daily-new-brief";
  after.validatorVersion = "daily-new-guard";
  after.model = "synthetic-candidate-model";
  after.bundleHash = "new-copy-hash";
  const changed = compareReports(before, after);
  assert.deepEqual(
    changed.configurationChanges.map((change) => change.field),
    ["promptVersion", "validatorVersion", "bundleHash", "model"],
  );
  assert.equal(changed.acceptedDelta, 0);
  after.fixtureVersion = "different-fixture";
  assert.throws(() => compareReports(before, after), /fixture/i);
  after.fixtureVersion = before.fixtureVersion;
  after.cases.pop();
  assert.throws(() => compareReports(before, after), /case/i);
  after.cases = structuredClone(before.cases);
  after.cases[0].configHash = "different-config";
  assert.throws(() => compareReports(before, after), /config/i);
  const croppedBefore = structuredClone(before);
  const croppedAfter = structuredClone(before);
  croppedBefore.cases.pop();
  croppedAfter.cases.pop();
  assert.throws(() => compareReports(croppedBefore, croppedAfter), /case/i);
  const editedSummary = structuredClone(before);
  editedSummary.summary.outcomes.accepted = 500;
  assert.equal(compareReports(before, editedSummary).acceptedDelta, 0);
});

test("network guard blocks fetch, HTTP(S), TCP, TLS, and DNS and restores globals", async () => {
  const originalFetch = globalThis.fetch;
  const originalHttpRequest = http.request;
  const originalSocketConnect = net.Socket.prototype.connect;
  await withNetworkBlocked(async () => {
    await assert.rejects(fetch("https://example.invalid"), /network.*blocked/i);
    assert.throws(() => http.request("http://example.invalid"), /network.*blocked/i);
    assert.throws(() => https.request("https://example.invalid"), /network.*blocked/i);
    assert.throws(() => net.connect({ host: "127.0.0.1", port: 1 }), /network.*blocked/i);
    assert.throws(() => tls.connect({ host: "example.invalid", port: 443 }), /network.*blocked/i);
    await assert.rejects(async () => dnsPromises.lookup("example.invalid"), /network.*blocked/i);
  });
  assert.equal(globalThis.fetch, originalFetch);
  assert.equal(http.request, originalHttpRequest);
  assert.equal(net.Socket.prototype.connect, originalSocketConnect);
});

test("network and temporary key restore even when evaluation fails", async () => {
  const originalFetch = globalThis.fetch;
  await assert.rejects(
    withNetworkBlocked(async () => {
      throw new Error("synthetic failure");
    }),
    /synthetic failure/,
  );
  assert.equal(globalThis.fetch, originalFetch);
  const originalKey = process.env.LOVABLE_API_KEY;
  const responses = structuredClone(BASELINE_RESPONSES);
  responses["saturn-square-sun"] = { paragraphs: [] };
  await evaluateReadings({ responses });
  assert.equal(process.env.LOVABLE_API_KEY, originalKey);
});
