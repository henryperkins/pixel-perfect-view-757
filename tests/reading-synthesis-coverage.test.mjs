import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let vite, coverage, bundle, fixtures, assemble;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  coverage = await vite.ssrLoadModule("/src/lib/content/synthesis-coverage.ts");
  ({ TRANSIT_CANDIDATE_BUNDLE: bundle } = await vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  ));
  fixtures = await vite.ssrLoadModule("/src/lib/ai/reading-evaluation.fixtures.mjs");
  ({ assembleReading: assemble } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
});
after(async () => await vite?.close());

test("matrix enumerates every ordered non-wildcard pair and distinguishes calculation constraints from editorial gaps", () => {
  const report = coverage.synthesisCatalogueMatrix(bundle);
  const concrete = bundle.cycles.filter((c) => !c.key.includes("*"));
  assert.equal(report.rows.length, concrete.length * (concrete.length - 1));
  const impossible = report.rows.find(
    (r) => r.primaryKey === "square:saturn:sun" && r.supportingKey === "trine:saturn:sun",
  );
  assert.equal(impossible.status, "impossible");
  assert.match(impossible.reason, /same transit.*natal|one contact/i);
  const family = report.rows.find(
    (r) => r.primaryKey === "hard:saturn:moon" && r.supportingKey === "trine:jupiter:mars",
  );
  assert.equal(family.selectorEligible, false);
  assert.equal(family.status, "pending");
  assert.ok(report.rows.every((r) => r.primarySourceHash && r.supportingSourceHash));
});

test("synthetic coverage reports selected, independent, unmatched and insufficient outcomes without member-population claims", () => {
  const report = coverage.synthesisAcceptanceCoverage(
    bundle,
    fixtures.READING_EVAL_CASES,
    assemble,
  );
  assert.equal(report.caseCount, 50);
  assert.equal(report.population, "fixed synthetic plans; not member coverage");
  assert.equal(report.cases.length, 50);
  assert.equal(report.cases.find((c) => c.id === "synthesis-tension").pairStatus, "selected");
  assert.equal(
    report.cases.find((c) => c.id === "synthesis-independent").pairStatus,
    "independent",
  );
  assert.equal(report.cases.find((c) => c.id === "quiet-threshold").pairStatus, "insufficient");
  assert.ok(report.unmatchedPairs.length);
  assert.deepEqual(report.wildcardSourceKeys, []);
  assert.ok(report.pairs.every((p) => typeof p.reverseCovered === "boolean"));
  const wildcard = structuredClone(fixtures.READING_EVAL_CASES[0]);
  wildcard.id = "coverage-wildcard-only";
  wildcard.cycles[0] = {
    ...wildcard.cycles[0],
    cycle_key: "uranus_square_mars",
    transit_body: "uranus",
    natal_point: "mars",
  };
  assert.deepEqual(
    coverage.synthesisAcceptanceCoverage(bundle, [wildcard], assemble).wildcardSourceKeys,
    ["hard:*:*"],
  );
});

test("review decisions require source-bound reasons and preserve separate directed assessments", () => {
  const matrix = coverage.synthesisCatalogueMatrix(bundle);
  const row = matrix.rows.find(
    (r) =>
      r.primaryKey === "square:saturn:sun" && r.supportingKey === "conjunction:mercury:mercury",
  );
  assert.throws(
    () =>
      coverage.applySynthesisDecisions(matrix, [
        { ...row, status: "independent", reason: "", reviewed: true },
      ]),
    /reason/i,
  );
  assert.throws(
    () =>
      coverage.applySynthesisDecisions(matrix, [
        {
          ...row,
          status: "independent",
          reason: "Each parent supports a different focus.",
          reviewed: true,
          primarySourceHash: "wrong",
        },
      ]),
    /source|hash/i,
  );
  const approved = coverage.applySynthesisDecisions(matrix, [
    {
      ...row,
      status: "independent",
      reason:
        "The first source concerns role capacity; the other concerns phrasing ideas. Neither source establishes that one controls the other.",
      reviewed: true,
    },
  ]);
  assert.equal(
    approved.rows.find(
      (r) => r.primaryKey === row.primaryKey && r.supportingKey === row.supportingKey,
    ).status,
    "independent",
  );
  assert.equal(
    approved.rows.find(
      (r) => r.primaryKey === row.supportingKey && r.supportingKey === row.primaryKey,
    ).status,
    "pending",
  );
});

test("review decisions cannot invent rule identities, override a positive rule, or manufacture impossibility", () => {
  const matrix = coverage.synthesisCatalogueMatrix(bundle);
  const positive = matrix.rows.find((r) => r.status === "tension");
  for (const ruleKey of [null, "invented"])
    assert.throws(
      () =>
        coverage.applySynthesisDecisions(matrix, [
          {
            ...positive,
            ruleKey,
            reviewed: true,
            reason: "The source mechanisms support the proposed comparison.",
          },
        ]),
      /rule/i,
    );
  assert.throws(
    () =>
      coverage.applySynthesisDecisions(matrix, [
        { ...positive, status: "independent", reviewed: true, reason: "Separate source meanings." },
      ]),
    /rule/i,
  );
  const possible = matrix.rows.find((r) => r.status === "pending" && r.selectorEligible);
  assert.throws(
    () =>
      coverage.applySynthesisDecisions(matrix, [
        {
          ...possible,
          status: "impossible",
          reviewed: true,
          reason: "This pair was not reached in a fixture.",
        },
      ]),
    /calculation/i,
  );
  const extended = structuredClone(bundle);
  extended.cycles.push({
    key: "quincunx:uranus:mars",
    themes: ["initiative"],
    mechanism: "One action can be compared with a current arrangement.",
    question: "Which action would you compare?",
  });
  assert.equal(
    coverage
      .synthesisCatalogueMatrix(extended)
      .rows.find(
        (r) => r.primaryKey === "quincunx:uranus:mars" && r.supportingKey === "trine:jupiter:mars",
      ).selectorEligible,
    true,
  );
});
