import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  BASELINE_RESPONSES,
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "../scripts/reading-eval-cases.mjs";
import { compareReports, evaluateReadings } from "../scripts/evaluate-readings.mjs";
let h, run, combine, bundle;
before(async () => {
  h = await createRecordsHarness();
  ({ runSyntheticEvaluationCase: run } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ combineReadingEvaluationResults: combine } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.shared.ts",
  ));
  ({ TRANSIT_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  ));
});
after(async () => h?.close());
test("arc_fixed_cases_use_production_validation_and_planner", async () => {
  h.requests.length = 0;
  assert.equal(READING_EVAL_FIXTURE_VERSION, "synthetic-daily-7");
  assert.equal(READING_EVAL_CASES.length, 50);
  for (const [id, chapter] of [
    ["single-pass", "single"],
    ["opening-three", "opening"],
    ["return-three", "return"],
    ["closing-three", "closing"],
    ["return-five", "return"],
    ["between-passes", "between"],
    ["truncated-scan", null],
    ["station-tangent", null],
    ["birth-window-disagreement", null],
    ["synthesis-natal-integration", "return"],
  ]) {
    const caseId = `arc-${id}`;
    h.setGateway(() =>
      Response.json({
        choices: [{ message: { content: JSON.stringify(BASELINE_RESPONSES[caseId]) } }],
      }),
    );
    const result = await run(caseId, bundle);
    assert.equal(result.case.transitStoryPlan.chapter ?? null, chapter, caseId);
    assert.equal(
      result.case.diagnostics.outcome,
      "accepted",
      `${caseId}: ${result.case.diagnostics.code}`,
    );
    assert.equal(result.metadata.storyPlanVersion, "daily-transit-story-1");
    assert.equal(result.metadata.anchorVersion, "transit-anchor-1");
    assert.equal(result.metadata.solverVersion, "transit-episode-1");
    assert.equal(result.metadata.sourceContract, "swiss-transit-episode/1");
    assert.match(result.metadata.transitFixtureHash, /^[a-f0-9]{64}$/);
    if (id === "synthesis-natal-integration")
      assert.deepEqual(
        result.case.facts
          .filter((f) => ["S1", "N1", "P2"].includes(f.id))
          .map((f) => f.id)
          .sort(),
        ["N1", "P2", "S1"],
      );
  }
  assert.equal(h.requests.length, 0);
  assert.equal(h.swissRequests.length, 0);
  assert.equal(h.episodeRequests.length, 0);
});
test("arc_policy_change_stops_mixed_run", async () => {
  const one = await run("arc-return-three", bundle);
  for (const field of [
    "storyPlanVersion",
    "anchorVersion",
    "solverVersion",
    "sourceContract",
    "transitFixtureHash",
  ]) {
    const two = structuredClone(one);
    two.case.id = "arc-opening-three";
    two.metadata[field] = "changed";
    assert.throws(() => combine([one, two], { partial: true }), /configuration changed/, field);
  }
});
test("version6_comparison_requires_identical_inputs", async () => {
  const report = await evaluateReadings({ bundleSource: "transit-candidate" });
  assert.equal(report.summary.gatewayReplays, 49);
  assert.equal(report.summary.outcomes.accepted, 49);
  for (const field of [
    "bundleHash",
    "solverVersion",
    "sourceContract",
    "anchorVersion",
    "transitFixtureHash",
    "storyPlanVersion",
    "transitCopyHash",
    "natalPlanVersion",
    "reliabilityVersion",
    "planVersion",
    "gatewayTimeoutMs",
  ]) {
    const changed = structuredClone(report);
    changed[field] = field === "gatewayTimeoutMs" ? 12_000 : "changed";
    assert.throws(() => compareReports(report, changed), /frozen|source|fixture|policy/i, field);
  }
  for (const row of report.cases.filter((c) => c.id.startsWith("arc-"))) {
    for (const key of [
      "temporalCoherence",
      "chapterIntegration",
      "unsupportedHistory",
      "promisedResolution",
    ])
      assert.equal(row.manualReview[key], null);
  }
});
test("current transit comparison permits a declared story-use ablation with all other identities fixed", async () => {
  const enabled = await evaluateReadings({ bundleSource: "transit-candidate" });
  const disabled = structuredClone(enabled);
  disabled.storyUse = false;
  const comparison = compareReports(disabled, enabled);
  assert.deepEqual(comparison.configurationChanges, [
    { field: "storyUse", before: false, after: true },
  ]);
  assert.equal(comparison.before.storyUse, false);
  assert.equal(comparison.after.storyUse, true);
  assert.equal(comparison.cases.length, 50);
});
test("archived_version5_transit_reports_compare_as_36_cases_and_cannot_replay_as_current", async () => {
  const archived = async (side) =>
    JSON.parse(
      await readFile(
        new URL(`../docs/reviews/daily-transit-story/${side}-replay.json`, import.meta.url),
        "utf8",
      ),
    );
  const baseline = await archived("baseline");
  const candidate = await archived("candidate");
  const comparison = compareReports(baseline, candidate);
  assert.equal(comparison.fixtureVersion, "synthetic-daily-5");
  assert.equal(comparison.cases.length, 36);
  assert.equal(comparison.before.storyUse, false);
  assert.equal(comparison.after.storyUse, true);
  const current = await evaluateReadings({ bundleSource: "transit-candidate" });
  assert.throws(() => compareReports(candidate, current), /different fixture versions/);
  const relabeled = structuredClone(candidate);
  relabeled.fixtureVersion = "synthetic-daily-7";
  assert.throws(() => compareReports(relabeled, current), /fixed case IDs/);
});
