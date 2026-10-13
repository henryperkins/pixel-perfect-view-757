import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { READING_EVAL_CASES } from "../src/lib/ai/reading-evaluation.fixtures.mjs";
import {
  DRAFT_FALLBACK_CASES,
  DRAFT_PILOT_CASE_IDS,
} from "../src/lib/ai/reading-evaluation.draft.fixtures.mjs";

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
let h, getEvaluationCaseSet, prepare, run, findInterpretation, assemble, readingFacts;
let baseline, candidate, revised, syntheticNatalReliability, supportedBodies, targets, aspects;
before(async () => {
  h = await createRecordsHarness();
  ({ getEvaluationCaseSet } = await h.vite.ssrLoadModule("/src/lib/ai/evaluation-case-sets.ts"));
  ({ prepareSyntheticEvaluationCase: prepare, runSyntheticEvaluationCase: run } =
    await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts"));
  ({ findInterpretation } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
  ({ assembleReading: assemble } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts } = await h.vite.ssrLoadModule("/src/lib/ai/facts.ts"));
  ({ syntheticNatalReliability } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.natal.ts",
  ));
  ({ TRANSIT_BODIES: supportedBodies, NATAL_TARGETS: targets } = await h.vite.ssrLoadModule(
    "/src/lib/astro/cycles.ts",
  ));
  ({ ASPECTS: aspects } = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts"));
  const { TRANSIT_CANDIDATE_BUNDLE: inherited } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  const evidence = new URL(
    "../docs/reviews/content-draft-effectiveness/2026-10-13/",
    import.meta.url,
  );
  const attachment = JSON.parse(
    await readFile(new URL("attachment-cycle-comparison.json", evidence), "utf8"),
  );
  revised = JSON.parse(
    await readFile(new URL("revised-fallback-entries.json", evidence), "utf8"),
  ).entries;
  // Only the cycle catalogue is exact attachment evidence. Inherited local natal,
  // transit and synthesis catalogues exercise assembly; this is not a live release.
  baseline = {
    ...structuredClone(inherited),
    version: "attachment-cycle-baseline-test",
    cycles: attachment.extractedCycles.flatMap((entry) => (entry.baseline ? [entry.baseline] : [])),
  };
  candidate = {
    ...structuredClone(inherited),
    version: "revised-cycle-candidate-test",
    cycles: attachment.extractedCycles.flatMap((entry) =>
      entry.candidate
        ? [
            {
              ...entry.candidate,
              ...revised.find((replacement) => replacement.key === entry.key),
            },
          ]
        : [],
    ),
  };
});
after(async () => h?.close());

test("closed manifests retain the legacy 50, cover 20 additions offline, and bind only four pilot cases", () => {
  const legacy = getEvaluationCaseSet();
  assert.equal(legacy.id, "synthetic-daily-7");
  assert.deepEqual(legacy.cases, READING_EVAL_CASES);
  const offline = getEvaluationCaseSet("draft-fallback-1");
  assert.equal(offline.cases.length, 70);
  assert.deepEqual(offline.cases.slice(0, 50), READING_EVAL_CASES);
  assert.deepEqual(offline.cases.slice(50), DRAFT_FALLBACK_CASES);
  const pilot = getEvaluationCaseSet("draft-pilot-1");
  assert.equal(pilot.cases.length, 4);
  assert.deepEqual(
    pilot.cases.map((fixed) => fixed.id),
    DRAFT_PILOT_CASE_IDS,
  );
  assert.deepEqual(
    pilot.cases.map(
      (fixed) =>
        prepare(fixed.id, candidate, undefined, pilot.id).assembled.interpretationPlan
          .interpretations[0].interpretationKey,
    ),
    ["hard:mars:*", "hard:uranus:*", "soft:saturn:*", "soft:neptune:*"],
  );
  for (const manifest of [legacy, offline, pilot]) {
    assert.equal(manifest.fixtureVersion, manifest.id);
    assert.equal(manifest.caseSetHash, digest(manifest.cases), `${manifest.id} frozen hash`);
    assert.equal(new Set(manifest.cases.map((fixed) => fixed.id)).size, manifest.cases.length);
    assert.equal(
      manifest.cases.filter(
        (fixed) => prepare(fixed.id, candidate, undefined, manifest.id).input.hasEligibleCycles,
      ).length,
      { "synthetic-daily-7": 49, "draft-fallback-1": 69, "draft-pilot-1": 4 }[manifest.id],
      "Attempt inventories are data, not authorization to execute the offline suite",
    );
  }
  pilot.cases[0].config.day = "2099-01-01";
  assert.equal(getEvaluationCaseSet(pilot.id).cases[0].config.day, "2026-10-11");
  assert.throws(() => getEvaluationCaseSet("anything"), /Unknown.*case set/);
  assert.throws(() => prepare(DRAFT_FALLBACK_CASES[0].id, candidate), /Unknown.*case/);
  assert.throws(
    () => prepare("saturn-square-sun", candidate, undefined, pilot.id),
    /Unknown.*case/,
  );
});

test("every added key is primary with exact baseline/global and revised/body source facts and template copy", () => {
  const expected = new Set(
    supportedBodies.flatMap((body) => ["hard", "soft"].map((family) => `${family}:${body}:*`)),
  );
  assert.equal(expected.size, 20);
  for (const fixed of DRAFT_FALLBACK_CASES) {
    const old = prepare(fixed.id, baseline, undefined, "draft-fallback-1");
    const next = prepare(fixed.id, candidate, undefined, "draft-fallback-1");
    const contact = fixed.cycles[0];
    const family = contact.aspect === "square" ? "hard" : "soft";
    const key = `${family}:${contact.transit_body}:*`;
    assert.ok(expected.delete(key), `${key} exactly once`);
    assert.equal(contact.natal_point, contact.transit_body === "mercury" ? "moon" : "mercury");
    assert.ok(Date.parse(contact.exact_at) > next.reference.getTime());
    assert.ok(Date.parse(contact.ingress_at) <= next.reference.getTime());
    assert.ok(Date.parse(contact.egress_at) >= Date.parse(contact.exact_at));
    assert.equal(
      old.assembled.interpretationPlan.interpretations[0].interpretationKey,
      `${family}:*:*`,
    );
    assert.equal(next.assembled.interpretationPlan.interpretations[0].interpretationKey, key);
    const source = candidate.cycles.find((entry) => entry.key === key);
    const fact = next.facts.find((entry) => entry.id === "I1");
    assert.equal(fact.sourceKey, key);
    assert.equal(fact.statement, `Published interpretation ${key}: ${source.mechanism}`);
    assert.equal(fact.releaseVersion, candidate.version);
    assert.ok(
      next.input.facts.some((entry) => entry.id === "I1" && entry.statement === fact.statement),
    );
    assert.ok(next.input.fallback.body.includes(source.mechanism));
    assert.ok(next.input.fallback.prompt.startsWith(source.question));
    assert.deepEqual(next.assembled.interpretationPlan.interpretations[0].themes, []);
    assert.equal(next.assembled.interpretationPlan.synthesis, null);
  }
  assert.equal(expected.size, 0);
});

test("every new source remains available at I2 and I3 without inventing synthesis or mandatory rendering", () => {
  const natal = READING_EVAL_CASES.find((fixed) => fixed.id === "natal-duty-reflex");
  const reliability = syntheticNatalReliability(natal);
  const other = READING_EVAL_CASES.find((fixed) => fixed.id === "jupiter-trine-sun-technical")
    .cycles[0];
  for (const fixed of DRAFT_FALLBACK_CASES)
    for (const position of [2, 3]) {
      const changed = { ...fixed.cycles[0], importance: position === 2 ? 0.7 : 0.4 };
      const cycles = [
        { ...natal.cycles[0], importance: 0.9 },
        changed,
        {
          ...other,
          importance: position === 2 ? 0.4 : 0.7,
        },
      ];
      const assembled = assemble(
        natal.chart,
        cycles,
        {
          ...natal.config,
          granted: new Set(natal.config.granted),
          localBucket: null,
          checkIn: null,
          wellness: null,
        },
        candidate,
        reliability,
      );
      const facts = readingFacts(natal.chart, assembled, natal.config.timeZone);
      const source = findInterpretation(
        candidate,
        changed.aspect,
        changed.transit_body,
        changed.natal_point,
      );
      assert.equal(
        assembled.interpretationPlan.interpretations.find((entry) => entry.index === position)
          .interpretationKey,
        source.key,
      );
      assert.equal(
        facts.find((entry) => entry.id === `I${position}`).statement,
        `Published interpretation ${source.key}: ${source.mechanism}`,
      );
      assert.equal(assembled.natalLensPlan.status, "selected");
      assert.equal(assembled.interpretationPlan.synthesis, null);
      assert.ok(!facts.some((entry) => entry.id === "S1"));
      // Optional secondary facts are supplied to generation, but this source-only
      // natal template renders the primary/lens when there is no synthesis rule.
      assert.ok(!assembled.astroBody.includes(source.mechanism));
      assert.ok(facts.some((entry) => entry.id === "N1"));
    }
});

test("natal composition conserves every primary revised sentence and its independent question", () => {
  const natal = READING_EVAL_CASES.find((fixed) => fixed.id === "natal-duty-reflex");
  for (const fixed of DRAFT_FALLBACK_CASES) {
    const assembled = assemble(
      natal.chart,
      fixed.cycles,
      {
        ...fixed.config,
        granted: new Set(fixed.config.granted),
        localBucket: null,
        checkIn: null,
        wellness: null,
      },
      candidate,
      syntheticNatalReliability(natal),
    );
    const source = findInterpretation(
      candidate,
      fixed.cycles[0].aspect,
      fixed.cycles[0].transit_body,
      fixed.cycles[0].natal_point,
    );
    assert.equal(assembled.natalLensPlan.status, "selected");
    for (const sentence of source.mechanism.split(/(?<=[.!?])\s+/))
      assert.ok(assembled.astroBody.includes(sentence), `${source.key}: ${sentence}`);
    assert.ok(assembled.prompt.startsWith(source.question));
  }
});

test("all stronger catalogue entries and all eight resolver tiers retain precedence", () => {
  for (const entry of baseline.cycles.filter((entry) => !entry.key.includes("*"))) {
    const [aspect, body, target] = entry.key.split(":");
    assert.equal(
      findInterpretation(candidate, aspect, body, target).key,
      findInterpretation(baseline, aspect, body, target).key,
    );
    assert.deepEqual(
      candidate.cycles.find((item) => item.key === entry.key),
      entry,
    );
  }
  for (const body of supportedBodies)
    for (const target of targets)
      for (const aspect of aspects) {
        const old = findInterpretation(baseline, aspect.key, body, target);
        if (!["hard:*:*", "soft:*:*"].includes(old.key))
          assert.equal(findInterpretation(candidate, aspect.key, body, target).key, old.key);
      }
  const tiers = [
    "square:mars:mercury",
    "square:mars:*",
    "square:*:mercury",
    "square:*:*",
    "hard:mars:mercury",
    "hard:mars:*",
    "hard:*:mercury",
    "hard:*:*",
  ];
  for (let index = 0; index < tiers.length; index++) {
    const bundle = {
      ...candidate,
      cycles: tiers
        .slice(index)
        .reverse()
        .map((key) => ({ key, mechanism: key, question: "What do you notice?" })),
    };
    assert.equal(findInterpretation(bundle, "square", "mars", "mercury").key, tiers[index]);
  }
});

test("both rewritten globals are shadowed for supported contacts and remain valid isolated fallback sources", () => {
  for (const body of supportedBodies)
    for (const target of targets)
      for (const aspect of aspects) {
        assert.ok(
          !["hard:*:*", "soft:*:*"].includes(
            findInterpretation(candidate, aspect.key, body, target).key,
          ),
        );
      }
  for (const [family, aspect] of [
    ["hard", "square"],
    ["soft", "sextile"],
  ]) {
    const isolated = {
      ...candidate,
      cycles: candidate.cycles.filter((entry) => entry.key === `${family}:*:*`),
    };
    assert.equal(findInterpretation(isolated, aspect, "mars", "mercury").key, `${family}:*:*`);
  }
});

test("unknown and approximate birth times, thresholds, and quiet days retain their eligibility rules", () => {
  const fixed = DRAFT_FALLBACK_CASES[0];
  const make = (uncertainty, cycles) =>
    assemble(
      { ...fixed.chart, uncertainty },
      cycles,
      {
        ...fixed.config,
        granted: new Set(fixed.config.granted),
        localBucket: null,
        checkIn: null,
        wellness: null,
      },
      candidate,
    );
  for (const [accuracy, point, angles] of [
    ["unknown", "ascendant", true],
    ["approximate", "house_10", false],
  ]) {
    const suppressed = {
      ...fixed.cycles[0],
      cycle_key: `saturn_square_${point}`,
      natal_point: point,
      importance: 0.95,
    };
    const assembled = make(
      {
        ...fixed.chart.uncertainty,
        accuracy,
        housesReliable: false,
        angleClaimsSuppressed: angles,
      },
      [suppressed, ...fixed.cycles],
    );
    assert.equal(assembled.eligibleCycles.length, 1);
    assert.equal(assembled.primary_cycle_key, fixed.cycles[0].cycle_key);
  }
  const quiet = make(
    fixed.chart.uncertainty,
    fixed.cycles.map((cycle) => ({ ...cycle, importance: 0.01 })),
  );
  assert.equal(quiet.eligibleCycles.length, 0);
  assert.equal(quiet.interpretationPlan.interpretations.length, 0);
  assert.equal(quiet.primary_cycle_key, null);
  assert.ok(
    !readingFacts(fixed.chart, quiet, fixed.config.timeZone).some((fact) =>
      /^I[123]$/.test(fact.id),
    ),
  );
});

test("executed case metadata identifies its selected manifest, with no live provider traffic", async () => {
  // Missing test credentials yield the normal local fallback before fetch.
  const manifest = getEvaluationCaseSet("draft-pilot-1");
  const result = await run(manifest.cases[0].id, candidate, "lovable", undefined, {}, manifest.id);
  assert.equal(result.metadata.fixtureVersion, manifest.fixtureVersion);
  assert.equal(result.metadata.caseSetHash, manifest.caseSetHash);
  assert.equal(result.case.id, manifest.cases[0].id);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});
