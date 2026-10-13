import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, profiles, bundle, prepare, fixtures;
before(async () => {
  h = await createRecordsHarness();
  profiles = await h.vite.ssrLoadModule("/src/lib/ai/qualification-profiles.ts");
  ({ WRITING_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/writing-candidate-bundle.ts",
  ));
  fixtures = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.fixtures.mjs");
  ({ prepareSyntheticEvaluationCase: prepare } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
});
after(async () => h?.close());
test("four closed profiles vary only their declared policy, preserving the final source catalogue", () => {
  const policies = profiles.QUALIFICATION_PROFILES.map(profiles.qualificationPolicy);
  assert.deepEqual(
    policies.map((p) => [p.writing, p.natal, p.transit]),
    [
      [true, false, false],
      [true, true, false],
      [true, true, true],
      [false, true, true],
    ],
  );
  assert.throws(() => profiles.qualificationPolicy("custom-prompt"), /Unknown/);
  for (const p of profiles.QUALIFICATION_PROFILES) {
    const selected = profiles.qualificationBundle(bundle, p);
    for (const key of [
      "cycles",
      "synthesisRules",
      "natalLenses",
      "transitChapters",
      "phases",
      "domains",
    ])
      assert.deepEqual(selected[key], bundle[key]);
  }
});
test("matched profile plans use identical fixtures and sources, with 49 eligible attempts each and no network", () => {
  assert.equal(typeof prepare, "function");
  const plans = profiles.QUALIFICATION_PROFILES.map((profile) =>
    prepare("writing-all-evidence", bundle, profile),
  );
  assert.ok(plans[0].facts.every((f) => !["N1", "A1", "P2"].includes(f.id)));
  assert.ok(plans[1].facts.some((f) => f.id === "N1"));
  assert.ok(plans[1].facts.every((f) => !["A1", "P2"].includes(f.id)));
  assert.ok(plans[2].facts.some((f) => f.id === "A1") && plans[2].facts.some((f) => f.id === "N1"));
  assert.deepEqual(plans[2].facts, plans[3].facts);
  assert.ok(plans[2].input.writing && !plans[3].input.writing);
  for (const profile of profiles.QUALIFICATION_PROFILES) {
    const count = fixtures.READING_EVAL_CASES.map((f) => prepare(f.id, bundle, profile)).filter(
      (p) => p.input.hasEligibleCycles && p.facts.some((f) => f.id === "I1"),
    ).length;
    assert.equal(count, 49, profile);
  }
  assert.equal(
    h.gatewayRequests.length + h.geminiEnterpriseRequests.length + h.swissRequests.length,
    0,
  );
});
