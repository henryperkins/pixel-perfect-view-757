import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let vite, candidate, base, validate, assemble, fixtures, coverage;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ SYNTHESIS_CANDIDATE_BUNDLE: candidate } = await vite.ssrLoadModule(
    "/src/lib/content/synthesis-candidate-bundle.ts",
  ));
  ({ TRANSIT_CANDIDATE_BUNDLE: base } = await vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  ));
  ({ validateContentGraph: validate } = await vite.ssrLoadModule("/src/lib/content/schema.ts"));
  ({ assembleReading: assemble } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
  fixtures = await vite.ssrLoadModule("/src/lib/ai/reading-evaluation.fixtures.mjs");
  coverage = await vite.ssrLoadModule("/src/lib/content/synthesis-coverage.ts");
});
after(async () => await vite?.close());
const read = (id, bundle = candidate) => {
  const f = fixtures.READING_EVAL_CASES.find((c) => c.id === id);
  return assemble(
    f.chart,
    f.cycles,
    {
      granted: new Set(f.config.granted),
      tone: f.config.tone,
      depth: f.config.depth,
      localBucket: null,
      checkIn: null,
      wellness: null,
    },
    bundle,
  );
};

test("inactive candidate preserves all existing source families and natal/transit catalogues while adding the four missing fixed-suite exact sources", () => {
  validate(candidate);
  assert.notEqual(candidate.version, base.version);
  assert.deepEqual(candidate.natalLenses, base.natalLenses);
  assert.deepEqual(candidate.transitChapters, base.transitChapters);
  assert.ok(base.cycles.every((c) => candidate.cycles.some((n) => n.key === c.key)));
  for (const key of [
    "square:saturn:moon",
    "trine:jupiter:sun",
    "square:mars:sun",
    "conjunction:moon:moon",
  ])
    assert.ok(candidate.cycles.find((c) => c.key === key)?.themes.length);
  assert.ok(candidate.synthesisRules.filter((r) => r.relationship !== "independent").length > 4);
});

test("common multi-contact cases gain a reviewed relationship without changing strongest-three selection or suppression", () => {
  const before = read("multiple-cycles", base),
    after = read("multiple-cycles");
  assert.deepEqual(
    after.eligibleCycles.map((c) => c.cycle_key),
    before.eligibleCycles.map((c) => c.cycle_key),
  );
  assert.equal(before.interpretationPlan.pairStatus, "unmatched");
  assert.equal(after.interpretationPlan.pairStatus, "selected");
  assert.equal(after.interpretationPlan.synthesis.relationship, "tension");
  assert.ok(!read("unknown-birth-time").eligibleCycles.some((c) => c.natal_point === "ascendant"));
  assert.ok(
    !read("approximate-birth-time").eligibleCycles.some((c) => c.natal_point.startsWith("house_")),
  );
});

test("each positive direction is explicit, source-valid and has its separately authored reverse", () => {
  for (const rule of candidate.synthesisRules.filter((r) => r.relationship !== "independent")) {
    const reverse = candidate.synthesisRules.find(
      (r) =>
        r.primary.interpretationKey === rule.supporting.interpretationKey &&
        r.supporting.interpretationKey === rule.primary.interpretationKey,
    );
    assert.ok(reverse);
    assert.equal(reverse.relationship, rule.relationship);
    assert.notEqual(reverse.mechanism, rule.mechanism);
  }
  const matrix = coverage.synthesisCatalogueMatrix(candidate);
  assert.ok(matrix.rows.filter((r) => r.status === "impossible").every((r) => !r.ruleKey));
});
