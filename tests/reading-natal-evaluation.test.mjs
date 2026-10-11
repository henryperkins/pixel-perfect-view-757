import assert from "node:assert/strict";
import { after, before, test } from "node:test";
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
  ({ NATAL_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
});
after(async () => h?.close());
test("natal_fixed_cases_use_production_screen_and_planner", async () => {
  assert.equal(READING_EVAL_FIXTURE_VERSION, "synthetic-daily-5");
  assert.equal(READING_EVAL_CASES.length, 28);
  for (const [id, rule] of [
    ["natal-duty-reflex", "nl-moon-10"],
    ["natal-freedom-reflex", "nl-moon-09"],
    ["natal-service-aspect", "nl-moon-10-aspect-01"],
    ["natal-exact-house", "nl-moon-10-house-01"],
    ["natal-own-target", "nl-sun-03"],
    ["natal-moon-fallback", "nl-moon-10"],
    ["natal-sign-boundary", null],
    ["natal-unknown-time", null],
    ["natal-mixed-source", "nl-moon-10"],
    ["natal-degraded-positions", null],
    ["natal-legacy-snapshot", null],
    ["natal-synthesis-integration", "nl-sun-03"],
  ]) {
    h.setGateway(() =>
      Response.json({
        choices: [{ message: { content: JSON.stringify(BASELINE_RESPONSES[id]) } }],
      }),
    );
    const result = await run(id, bundle);
    assert.equal(result.case.natalLensPlan.lens?.ruleKey ?? null, rule, id);
    assert.equal(result.case.diagnostics.outcome, "accepted", id);
    assert.equal(result.metadata.natalPlanVersion, "daily-natal-lens-2");
    assert.equal(result.metadata.reliabilityVersion, "natal-reliability-1");
  }
});
test("natal_fixture_runner_reads_no_birth_records_and_requests_no_swiss", async () => {
  h.requests.length = 0;
  h.setGateway(() =>
    Response.json({
      choices: [{ message: { content: JSON.stringify(BASELINE_RESPONSES["natal-duty-reflex"]) } }],
    }),
  );
  await run("natal-duty-reflex", bundle);
  assert.equal(h.requests.length, 0);
  assert.equal(h.swissRequests.length, 0);
});
test("natal_policy_change_stops_mixed_run", async () => {
  const one = await run("natal-duty-reflex", bundle);
  const two = structuredClone(one);
  two.case.id = "natal-freedom-reflex";
  two.metadata.reliabilityVersion = "changed";
  assert.throws(() => combine([one, two], { partial: true }), /configuration changed/);
});
test("version5_comparison_requires_identical_transit_copy_and_inputs", async () => {
  const report = await evaluateReadings();
  assert.equal(report.summary.gatewayReplays, 27);
  assert.equal(report.summary.outcomes.accepted, 27);
  assert.equal(report.bundleVersion, "builtin-0.6.0");
  assert.match(report.transitCopyHash, /^[0-9a-f]{64}$/);
  // A natal-free baseline (the built-in fallback) differs only by release identity
  // and catalogue, so it can be compared and the change is reported.
  const baseline = structuredClone(report);
  baseline.bundleVersion = "builtin-0.5.0";
  baseline.bundleHash = "natal-free-fallback";
  const comparison = compareReports(baseline, report);
  assert.deepEqual(
    comparison.configurationChanges.map((change) => change.field),
    ["bundleVersion", "bundleHash"],
  );
  const changedCopy = structuredClone(report);
  changedCopy.transitCopyHash = "changed-transit-copy";
  assert.throws(() => compareReports(report, changedCopy), /transit copy/i);
  const changedModel = structuredClone(report);
  changedModel.model = "another-model";
  assert.throws(() => compareReports(report, changedModel), /transit copy and model/i);
  const duty = report.cases.find((c) => c.id === "natal-duty-reflex");
  const freedom = report.cases.find((c) => c.id === "natal-freedom-reflex");
  assert.deepEqual(
    duty.facts.filter((f) => f.id !== "N1"),
    freedom.facts.filter((f) => f.id !== "N1"),
  );
  assert.deepEqual(duty.config, freedom.config);
});
