import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { DRAFT_PILOT_CASE_IDS } from "../src/lib/ai/reading-evaluation.draft.fixtures.mjs";

const SHA = "a".repeat(40);
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
let h, defaultBundle, comparison, resolver, plans, freezer, transitCopyIdentity;

before(async () => {
  h = await createRecordsHarness();
  ({ DEFAULT_BUNDLE: defaultBundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/default-bundle.ts",
  ));
  comparison = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
  resolver = await h.vite.ssrLoadModule("/src/lib/content/evaluation-source.server.ts");
  plans = await h.vite.ssrLoadModule("/src/lib/ai/qualification-plan.server.ts");
  freezer = await h.vite.ssrLoadModule("/src/lib/ai/content-comparison-plan.server.ts");
  ({ transitCopyIdentity } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
});
after(async () => h?.close());
beforeEach(async () => {
  await h.reset();
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
});
afterEach(() => {
  assert.equal(
    h.gatewayRequests.length + h.geminiEnterpriseRequests.length + h.swissRequests.length,
    0,
  );
});

async function sourcePair() {
  const baseline = { ...structuredClone(defaultBundle), version: "1.0.0" };
  const candidate = { ...structuredClone(baseline), version: "pending" };
  for (const key of ["hard:mars:*", "hard:uranus:*", "soft:saturn:*", "soft:neptune:*"]) {
    candidate.cycles.push({
      key,
      mechanism: "A changed task can leave room to consider a different approach.",
      question: "What, if anything, would you approach differently?",
      themes: [],
    });
  }
  const { data, error } = await h
    .records()
    .from("content_drafts")
    .insert({
      user_id: h.userA,
      status: "draft",
      base_version: baseline.version,
      base_bundle: baseline,
      base_hash: await comparison.contentChecksum(baseline),
      bundle: candidate,
    })
    .select("id")
    .single();
  assert.equal(error, null);
  return resolver.resolveContentComparisonSource(h.records(), h.userA, {
    kind: "draft",
    draftId: data.id,
  });
}
const freeze = (source) => freezer.createContentComparisonPlan(source, SHA, "gemini-enterprise");

test("comparison freeze retains both exact sources, identities, closed manifest and eight-call scope without SQL guards", async () => {
  const source = await sourcePair();
  const pair = freeze(source);
  assert.equal(pair.version, "content-comparison-1");
  assert.equal(pair.sourceSha, SHA);
  assert.equal(pair.provider, "gemini-enterprise");
  assert.equal(pair.model, pair.arms.baseline.metadata.model);
  assert.equal(pair.caseSetId, "draft-pilot-1");
  assert.deepEqual(pair.bundles, { baseline: source.baseline, candidate: source.candidate });
  assert.deepEqual(pair.identities, source.identities);
  assert.deepEqual(pair.source, source.source);
  assert.deepEqual(pair.changedKeys, source.changedKeys);
  assert.deepEqual(pair.changes, source.changes);
  assert.deepEqual(
    pair.caseManifest.cases.map((item) => item.id),
    DRAFT_PILOT_CASE_IDS,
  );
  assert.equal(pair.caseManifest.caseSetHash, digest(pair.caseManifest.cases));
  assert.equal(pair.attemptLimit, 8);
  assert.equal(Object.hasOwn(pair, "guards"), false);
  for (const arm of ["baseline", "candidate"]) {
    assert.equal(pair.arms[arm].attemptLimit, 4);
    assert.equal(pair.arms[arm].metadata.caseSetId, "draft-pilot-1");
    assert.equal(pair.arms[arm].metadata.maxInputBytes, 65536);
    assert.equal(pair.arms[arm].metadata.maxOutputTokens, 65536);
    assert.equal(pair.arms[arm].metadata.gatewayTimeoutMs, 60000);
    assert.equal(pair.arms[arm].metadata.bundleHash, source.identities[arm].bundleHash);
    assert.equal(
      pair.arms[arm].metadata.transitCopyHash,
      digest(transitCopyIdentity(pair.bundles[arm])),
    );
  }
  const { hash, ...body } = pair;
  assert.equal(hash, digest(body));
  assert.deepEqual(freeze(source), pair);
  source.candidate.cycles[0].mechanism = "Later source mutation.";
  assert.notEqual(pair.bundles.candidate.cycles[0].mechanism, source.candidate.cycles[0].mechanism);
});

test("the optional case set preserves legacy plans and binds pilot bounds independently of qualification profiles", () => {
  const implicit = plans.createEvaluationPlan(defaultBundle, undefined, SHA, "lovable");
  const explicit = plans.createEvaluationPlan(
    defaultBundle,
    undefined,
    SHA,
    "lovable",
    "synthetic-daily-7",
  );
  assert.deepEqual(implicit, explicit);
  assert.equal(implicit.cases.length, 50);
  assert.equal(implicit.attemptLimit, 49);
  assert.equal(Object.hasOwn(implicit.metadata, "caseSetId"), false);
  assert.equal(implicit.metadata.maxInputBytes, null);
  const pilot = plans.createEvaluationPlan(
    defaultBundle,
    undefined,
    SHA,
    "lovable",
    "draft-pilot-1",
  );
  assert.deepEqual(
    pilot.cases.map((item) => item.id),
    DRAFT_PILOT_CASE_IDS,
  );
  assert.equal(pilot.attemptLimit, 4);
  assert.equal(pilot.metadata.maxInputBytes, 65536);
  assert.equal(pilot.metadata.maxOutputTokens, 65536);
  assert.throws(
    () => plans.createEvaluationPlan(defaultBundle, undefined, null, "lovable", "draft-pilot-1"),
    /source/i,
  );
  assert.throws(
    () =>
      plans.createEvaluationPlan(defaultBundle, "writing-final", SHA, "lovable", "draft-pilot-1"),
    /profile|qualification|case set/i,
  );
});

test("each arm hashes its complete frozen pair and retains its own case plans", async () => {
  const pair = freeze(await sourcePair());
  const baseline = freezer.contentComparisonArmPlan(pair, "baseline");
  const candidate = freezer.contentComparisonArmPlan(pair, "candidate");
  for (const [arm, plan] of [
    ["baseline", baseline],
    ["candidate", candidate],
  ]) {
    assert.deepEqual(plan.cases, pair.arms[arm].cases);
    assert.equal(plan.contentComparison.arm, arm);
    assert.deepEqual(plan.contentComparison.pair, pair);
    const { hash, ...body } = plan;
    assert.equal(hash, digest(body));
    assert.notEqual(hash, pair.arms[arm].hash);
  }
  assert.notEqual(baseline.hash, candidate.hash);
  assert.throws(() => freezer.contentComparisonArmPlan(pair, "other"), /arm/i);
});

test("exact source SHA and provider identities are required before comparison preparation", async () => {
  const source = await sourcePair();
  for (const sha of [null, "", "unknown", "f".repeat(39)])
    assert.throws(
      () => freezer.createContentComparisonPlan(source, sha, "gemini-enterprise"),
      /source/i,
    );
  assert.throws(() => freezer.createContentComparisonPlan(source, SHA, "arbitrary"), /provider/i);
  assert.notEqual(
    freezer.createContentComparisonPlan(source, SHA, "lovable").hash,
    freeze(source).hash,
  );
});

test("altered source snapshots or identities are rejected instead of silently reidentified", async () => {
  const source = await sourcePair();
  for (const edit of [
    (value) => {
      value.candidate.cycles[0].mechanism += " Changed.";
    },
    (value) => {
      value.identities.baseline.canonicalHash = "0".repeat(64);
    },
    (value) => {
      value.identities.candidate.bundleHash = "0".repeat(64);
    },
    (value) => {
      value.identities.candidate.checksumAlgorithm = "legacy-unlabelled";
    },
    (value) => {
      value.changedKeys = [];
    },
    (value) => {
      value.changes = [];
    },
  ]) {
    const changed = structuredClone(source);
    edit(changed);
    assert.throws(() => freeze(changed), /identity|integrity|hash|changes/i);
  }
});

test("fixed pilot cannot spend on a candidate that misses one of its declared changed primary keys", async () => {
  const source = await sourcePair();
  source.candidate.cycles = source.candidate.cycles.filter((entry) => entry.key !== "hard:mars:*");
  source.identities.candidate.canonicalHash = await comparison.contentChecksum(source.candidate);
  source.identities.candidate.bundleHash = digest(source.candidate);
  source.changes = comparison
    .compareContentBundles(source.baseline, source.candidate)
    .entries.filter((entry) => entry.change !== "unchanged");
  source.changedKeys = source.changes
    .filter((entry) => entry.kind === "entry" && entry.section === "cycles")
    .map((entry) => entry.key);
  assert.throws(() => freeze(source), /scope|coverage/i);
});

test("revalidation reconstructs plans from stored snapshots after draft discard and pointer moves without source reads", async () => {
  const source = await sourcePair();
  const pair = freeze(source);
  h.sqlite
    .prepare("UPDATE content_drafts SET status='discarded',bundle=? WHERE id=?")
    .run(JSON.stringify(defaultBundle), source.source.draftId);
  h.requests.length = 0;
  assert.deepEqual(freezer.revalidateContentComparisonPlan(pair, SHA, "gemini-enterprise"), pair);
  assert.equal(h.requests.length, 0);
});

test("revalidation rejects source, provider, fixture, policy, snapshot and template drift", async () => {
  const pair = freeze(await sourcePair());
  assert.throws(
    () => freezer.revalidateContentComparisonPlan(pair, "b".repeat(40), "gemini-enterprise"),
    /source|identity|drift/i,
  );
  assert.throws(
    () => freezer.revalidateContentComparisonPlan(pair, SHA, "lovable"),
    /provider|identity|drift/i,
  );
  for (const edit of [
    (value) => {
      value.hash = "0".repeat(64);
    },
    (value) => {
      value.attemptLimit = 138;
    },
    (value) => {
      value.caseManifest.cases[0].config.tone = "clinical";
    },
    (value) => {
      value.arms.candidate.metadata.promptVersion = "other";
    },
    (value) => {
      value.arms.baseline.cases[0].template.body = "Changed template.";
    },
    (value) => {
      value.bundles.candidate.cycles[0].question = "Different?";
    },
    (value) => {
      value.caseSetId = "draft-fallback-1";
    },
    (value) => {
      value.model = "other-model";
    },
  ]) {
    const changed = structuredClone(pair);
    edit(changed);
    assert.throws(
      () => freezer.revalidateContentComparisonPlan(changed, SHA, "gemini-enterprise"),
      /integrity|hash|drift|identity|scope/i,
    );
  }
});

test("rehashing a stale plan cannot bypass runtime reconstruction", async () => {
  const pair = freeze(await sourcePair());
  pair.arms.candidate.metadata.validatorVersion = "previous-validator";
  const { hash: _hash, ...body } = pair;
  pair.hash = digest(body);
  assert.throws(
    () => freezer.revalidateContentComparisonPlan(pair, SHA, "gemini-enterprise"),
    /drift|identity|integrity/i,
  );
});
