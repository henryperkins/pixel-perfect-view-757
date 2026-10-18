import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, plans, bundle;
before(async () => {
  h = await createRecordsHarness();
  plans = await h.vite.ssrLoadModule("/src/lib/ai/qualification-plan.server.ts");
  ({ WRITING_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/writing-candidate-bundle.ts",
  ));
});
after(async () => h?.close());
test("Enterprise pilot freezes six source shapes, two independent repetitions and both supported controls before traffic", () => {
  const dry = plans.createEnterprisePilotPlan(bundle, "LOW", "b".repeat(40));
  assert.equal(dry.cases.length, 12);
  assert.equal(dry.attemptLimit, 12);
  assert.equal(new Set(dry.cases.map((c) => c.id)).size, 6);
  assert.equal(dry.metadata.enterpriseThinking, "LOW");
  assert.equal(dry.metadata.gatewayTimeoutMs, 60000);
  assert.equal(dry.metadata.experimentVersion, "enterprise-thinking-pilot-1");
  assert.equal(plans.createEnterprisePilotPlan(bundle, "MEDIUM", "b".repeat(40)).attemptLimit, 12);
  assert.throws(
    () => plans.createEnterprisePilotPlan(bundle, "MINIMAL", "b".repeat(40)),
    /thinking/,
  );
  assert.throws(() => plans.createEnterprisePilotPlan(bundle, "LOW", null), /source/);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});
test("the dry campaign freezes four 49-attempt source-bound arms and rejects unknown source identity", () => {
  const dry = plans.createQualificationPlan(bundle, "writing-final", "a".repeat(40));
  assert.equal(dry.attemptLimit, 49);
  assert.equal(dry.cases.length, 50);
  assert.equal(dry.sourceSha, "a".repeat(40));
  assert.equal(dry.metadata.promptVersion, "daily-concrete-body-16");
  assert.equal(dry.metadata.validatorVersion, "daily-reference-11");
  assert.equal(dry.metadata.model, "google/gemini-3.8-flash");
  assert.equal(dry.metadata.gatewayTimeoutMs, 60000);
  assert.throws(() => plans.createQualificationPlan(bundle, "writing-final", null), /source/);
  assert.throws(
    () => plans.createQualificationPlan(bundle, "arbitrary", "a".repeat(40)),
    /profile/,
  );
  const changed = structuredClone(bundle);
  changed.cycles[0].mechanism += " Another source sentence.";
  assert.notEqual(
    plans.createQualificationPlan(changed, "writing-final", "a".repeat(40)).hash,
    dry.hash,
  );
  const all = ["writing-base", "writing-natal", "writing-final", "writing-baseline"].map((p) =>
    plans.createQualificationPlan(bundle, p, "a".repeat(40)),
  );
  assert.equal(
    all.reduce((n, p) => n + p.attemptLimit, 0),
    196,
  );
  for (const p of all) assert.equal(p.metadata.bundleHash, dry.metadata.bundleHash);
  assert.equal(all[3].metadata.promptVersion, "daily-astro-body-17");
  assert.equal(
    h.gatewayRequests.length + h.geminiEnterpriseRequests.length + h.swissRequests.length,
    0,
  );
});
