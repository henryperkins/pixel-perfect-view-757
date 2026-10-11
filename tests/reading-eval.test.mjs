import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import https from "node:https";
import tls from "node:tls";
import dnsPromises from "node:dns/promises";
import {
  compareReports,
  evaluateReadings,
  extractResponses,
  main,
  validateResponses,
  withNetworkBlocked,
} from "../scripts/evaluate-readings.mjs";
import {
  BASELINE_RESPONSES,
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "../scripts/reading-eval-cases.mjs";

test("before/after comparison rejects a partial flag even when every case is present", async () => {
  const complete = await evaluateReadings();
  assert.throws(() => compareReports({ ...complete, partial: true }, complete), /partial/);
  assert.throws(() => compareReports(complete, { ...complete, partial: true }), /partial/);
});

test("fixed synthetic baseline exercises the real daily validators without quality scores", async () => {
  const report = await evaluateReadings();
  assert.equal(READING_EVAL_CASES.length, 28);
  assert.equal(report.fixtureVersion, READING_EVAL_FIXTURE_VERSION);
  assert.equal(report.source, "synthetic-baseline");
  assert.equal(report.network, "blocked; gateway replayed in memory");
  assert.deepEqual(report.summary.outcomes, {
    accepted: 27,
    rejected: 0,
    unavailable: 0,
    skipped: 1,
  });
  assert.equal(report.summary.gatewayReplays, 27);
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
  assert.equal(report.summary.replayAcceptanceRate, 26 / 27);
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
  assert.equal(compared.cases.length, READING_EVAL_CASES.length);
  assert.equal(
    compared.warning,
    "Replay changes do not establish live acceptance, grounding, or writing quality.",
  );
  after.promptVersion = "daily-new-brief";
  after.validatorVersion = "daily-new-guard";
  after.model = "synthetic-candidate-model";
  after.bundleHash = "new-copy-hash";
  assert.throws(() => compareReports(before, after), /transit copy and model/);
  after.model = before.model;
  after.transitCopyHash = "new-transit-copy";
  assert.throws(() => compareReports(before, after), /transit copy and model/);
  after.transitCopyHash = before.transitCopyHash;
  after.bundleHash = before.bundleHash;
  const changed = compareReports(before, after);
  assert.deepEqual(
    changed.configurationChanges.map((change) => change.field),
    ["promptVersion", "validatorVersion"],
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

test("handwritten synthesis rejection examples distinguish validator coverage from human support", async () => {
  const { SYNTHESIS_VALIDATOR_EXAMPLES } = await import("../scripts/reading-eval-cases.mjs");
  for (const fixture of SYNTHESIS_VALIDATOR_EXAMPLES) {
    const responses = structuredClone(BASELINE_RESPONSES);
    responses[fixture.caseId] = fixture.draft;
    const report = await evaluateReadings({ responses });
    assert.equal(
      report.cases.find((c) => c.id === fixture.caseId).diagnostics.code,
      fixture.validatorCode,
    );
    assert.equal(fixture.manualGrounding, "reject");
    assert.match(fixture.label, /Handwritten/);
  }
});

const SOURCE_REPORT = new URL(
  "../docs/reviews/daily-reading-writing/2026-10-11/source-report.json",
  import.meta.url,
);
const SOURCE_SHA256 = "166124efbabfb7ad690bda2d178fa4fd8fbbc7f9e7b4df668cdb4db0c6dc588f";
async function sourceReport() {
  const bytes = await readFile(SOURCE_REPORT);
  return {
    report: JSON.parse(bytes.toString("utf8")),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

test("offline runs use the explicitly selected shipped bundle", async () => {
  const builtin = await evaluateReadings({ bundleSource: "builtin" });
  assert.equal(builtin.bundleSource, "builtin");
  assert.equal(builtin.bundleVersion, "builtin-0.5.0");
  assert.ok(builtin.cases.every((c) => !c.facts.some((fact) => fact.id === "N1")));
  const candidate = await evaluateReadings({ bundleSource: "natal-candidate" });
  assert.equal(candidate.bundleSource, "natal-candidate");
  assert.equal(candidate.bundleVersion, "builtin-0.6.0");
  assert.ok(candidate.cases.some((c) => c.facts.some((fact) => fact.id === "N1")));
  assert.equal(candidate.transitCopyHash, builtin.transitCopyHash);
  for (const bundleSource of ["active", "custom", ""])
    await assert.rejects(evaluateReadings({ bundleSource }), /bundle/i);
});

test("the uploaded natal-free report extracts and replays only against builtin-0.5.0", async () => {
  const { report, sha256 } = await sourceReport();
  assert.equal(sha256, SOURCE_SHA256);
  const responses = await extractResponses(report, { bundleSource: "builtin" });
  assert.deepEqual(Object.keys(responses).sort(), READING_EVAL_CASES.map((c) => c.id).sort());
  assert.equal(responses["quiet-threshold"], null);
  for (const row of report.cases.filter((c) => c.diagnostics.attempted))
    assert.deepEqual(responses[row.id], {
      paragraphs: row.candidate.paragraphs.map(({ text, facts }) => ({ text, facts })),
    });
  await assert.rejects(extractResponses(report, { bundleSource: "natal-candidate" }), /bundle/i);
  const replay = await evaluateReadings({
    responses,
    bundleSource: "builtin",
    sourceReport: { report, sha256 },
  });
  assert.equal(replay.source, "source-report-replay");
  assert.deepEqual(replay.summary.outcomes, {
    accepted: 27,
    rejected: 0,
    unavailable: 0,
    skipped: 1,
  });
  assert.equal(replay.sourceReport.sha256, SOURCE_SHA256);
  assert.equal(replay.sourceReport.promptVersion, "daily-astro-body-6");
  assert.equal(replay.sourceReport.source, "live-synthetic");
  assert.equal(replay.sourceReport.bundleSource, null);
  assert.ok(!Object.hasOwn(replay.sourceReport, "sourceRevision"));
  assert.deepEqual(replay.sourceComparison, { cases: 28, matchingOutcomes: 28, differences: [] });
  const edited = structuredClone(responses);
  edited["saturn-square-sun"].paragraphs[0].text += " Added later.";
  await assert.rejects(
    evaluateReadings({
      responses: edited,
      bundleSource: "builtin",
      sourceReport: { report, sha256 },
    }),
    /differ from the source report/i,
  );
});

test("extraction refuses incomplete, mismatched or lossy reports", async () => {
  const { report } = await sourceReport();
  const variant = (change) => {
    const copy = structuredClone(report);
    change(copy);
    return copy;
  };
  const attempted = (copy) => copy.cases.find((c) => c.id === "saturn-square-sun");
  const rejected = (row) => {
    row.diagnostics = { ...row.diagnostics, outcome: "rejected", code: "id", paragraph: 1 };
  };
  for (const [name, change, message] of [
    ["partial", (r) => (r.partial = true), /partial/i],
    ["missing case", (r) => r.cases.pop(), /fixed case/i],
    ["duplicate case", (r) => (r.cases[1] = structuredClone(r.cases[0])), /duplicate/i],
    ["case set", (r) => (r.caseSetHash = "0".repeat(64)), /case set/i],
    ["input config", (r) => (attempted(r).configHash = "0".repeat(64)), /input config/i],
    ["model", (r) => (r.model = "another-model"), /model/i],
    ["custom copy", (r) => (r.bundleHash = "f".repeat(64)), /custom/i],
    ["truncated", (r) => (attempted(r).candidate.truncated = true), /truncat/i],
    ["sanitized", (r) => (attempted(r).candidate.captureLossless = false), /lossless/i],
    ["paragraph count", (r) => (attempted(r).candidate.paragraphCount = 5), /paragraph count/i],
    ["historical rejected draft", (r) => rejected(attempted(r)), /lossless/i],
    [
      "unavailable draft",
      (r) => {
        const row = attempted(r);
        row.diagnostics = { ...row.diagnostics, outcome: "unavailable", code: "timeout" };
        row.candidate = null;
      },
      /no captured draft/i,
    ],
    [
      "malformed paragraph",
      (r) => (attempted(r).candidate.paragraphs[0].text = null),
      /malformed/i,
    ],
  ])
    await assert.rejects(
      extractResponses(variant(change), { bundleSource: "builtin" }),
      message,
      name,
    );
  const provenRejected = variant((r) => {
    rejected(attempted(r));
    attempted(r).candidate.captureLossless = true;
  });
  const responses = await extractResponses(provenRejected, { bundleSource: "builtin" });
  assert.deepEqual(
    responses["saturn-square-sun"].paragraphs,
    attempted(report).candidate.paragraphs,
  );
  await assert.rejects(extractResponses(report, { bundleSource: "active" }), /bundle/i);
});

test("the CLI requires an explicit bundle and bounded mode combinations", async () => {
  for (const [args, message] of [
    [["--output", "/tmp/never-written.json"], /--bundle/],
    [["--responses", "x.json", "--output", "/tmp/never-written.json"], /--bundle/],
    [["--extract-responses", "x.json", "--output", "/tmp/never-written.json"], /--bundle/],
    [["--bundle", "active", "--output", "/tmp/never-written.json"], /--bundle/],
    [["--bundle", "builtin", "--extract-responses", "x.json"], /--output/],
    [["--bundle", "builtin", "--source-report", "x.json", "--output", "y.json"], /--responses/],
    [["--compare-natal", "a.json", "b.json", "--output", "c.json"], /identity/],
    [["--compare", "a.json", "b.json", "--bundle", "builtin"], /--bundle/],
  ])
    await assert.rejects(main(args), message, args.join(" "));
});
