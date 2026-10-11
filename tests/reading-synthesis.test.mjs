import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let vite,
  DEFAULT_BUNDLE,
  findInterpretation,
  validateContentGraph,
  normalizeContentBundle,
  samePublishedBundle,
  resolveInterpretationPlan,
  assembleReading;

before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ DEFAULT_BUNDLE, findInterpretation } = await vite.ssrLoadModule(
    "/src/lib/content/default-bundle.ts",
  ));
  ({ validateContentGraph, normalizeContentBundle, samePublishedBundle } = await vite.ssrLoadModule(
    "/src/lib/content/schema.ts",
  ));
  ({ resolveInterpretationPlan } = await vite.ssrLoadModule("/src/lib/content/synthesis.ts"));
  ({ assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
});

after(async () => {
  await vite?.close();
});

test("exact-aspect precedence over family copy and active-array authority", () => {
  const bundleWithExact = {
    version: "test-exact",
    schemaVersion: 2,
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "Family saturn sun copy",
        question: "Family question?",
        themes: ["structure"],
      },
      {
        key: "square:saturn:sun",
        mechanism: "Exact square saturn sun copy",
        question: "Exact question?",
        themes: ["structure"],
      },
    ],
    natal: {},
    phases: {},
    domains: {},
    synthesisRules: [],
  };

  const found = findInterpretation(bundleWithExact, "square", "saturn", "sun");
  assert.equal(found.key, "square:saturn:sun");
  assert.equal(found.mechanism, "Exact square saturn sun copy");

  // Legacy fallback when exact is missing
  const bundleFamilyOnly = {
    version: "test-family",
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "Family saturn sun copy",
        question: "Family question?",
      },
    ],
    natal: {},
    phases: {},
    domains: {},
  };
  const foundFamily = findInterpretation(bundleFamilyOnly, "square", "saturn", "sun");
  assert.equal(foundFamily.key, "hard:saturn:sun");

  // Active array authority: a miss in an explicit active array must return fallback, never search built-in
  const activeEmpty = {
    version: "active-empty",
    cycles: [],
    natal: {},
    phases: {},
    domains: {},
  };
  const miss = findInterpretation(activeEmpty, "square", "saturn", "sun");
  assert.equal(miss.key, "fallback");
  assert.match(miss.mechanism, /no interpretation is published/i);
});

test("normalizeContentBundle preserves active authority, normalizes themes, and isolates legacy bundles from defaults rules", () => {
  const legacyActiveBundle = {
    version: "legacy-v1",
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "Legacy saturn copy",
        question: "Legacy question?",
      },
    ],
  };

  const newBuiltinBundle = {
    version: "builtin-0.5.0",
    schemaVersion: 2,
    cycles: [
      {
        key: "square:saturn:sun",
        mechanism: "Builtin saturn copy",
        question: "Builtin question?",
        themes: ["structure"],
      },
    ],
    natal: { sun_placement: "Sun description" },
    phases: { approaching: "Approaching" },
    domains: { work: { label: "Work", hard: "h", soft: "s", prompt: "p" } },
    synthesisRules: [
      {
        key: "rule-1",
        relationship: "independent",
        mechanism: null,
        primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
        supporting: { interpretationKey: "square:saturn:sun", theme: "structure" },
      },
    ],
  };

  const normalized = normalizeContentBundle(
    legacyActiveBundle,
    "legacy-reviewed",
    newBuiltinBundle,
  );

  // Must have empty synthesisRules, NOT inherit from newBuiltinBundle!
  assert.deepEqual(normalized.synthesisRules, []);
  assert.equal(normalized.version, "legacy-reviewed");
  // Active cycles authority: does not include newBuiltinBundle cycles
  assert.equal(normalized.cycles.length, 1);
  assert.equal(normalized.cycles[0].key, "hard:saturn:sun");
  // Absent themes normalize to empty array
  assert.deepEqual(normalized.cycles[0].themes, []);
  // Inherits partial defaults for missing natal/phases/domains
  assert.equal(normalized.natal.sun_placement, "Sun description");
  assert.equal(normalized.phases.approaching, "Approaching");
  assert.equal(normalized.domains.work.label, "Work");
});

test("legacy partial bundles with omitted cycles never inherit new editorial annotations", () => {
  const legacy = { version: "legacy", natal: { sun_placement: "Legacy sun copy" } };
  assert.doesNotThrow(() => validateContentGraph(legacy));
  const normalized = normalizeContentBundle(legacy, "legacy", DEFAULT_BUNDLE);
  assert.equal(normalized.cycles.length, DEFAULT_BUNDLE.cycles.length);
  assert.ok(normalized.cycles.every((entry) => entry.themes.length === 0));
  assert.deepEqual(normalized.synthesisRules, []);
  assert.equal(normalized.schemaVersion, undefined);
  assert.equal(normalized.natal.sun_placement, "Legacy sun copy");
  assert.ok(DEFAULT_BUNDLE.cycles.some((entry) => entry.themes?.length > 0));
});

test("empty graphs are rejected while explicit empty catalogues and partial legacy copy remain valid", () => {
  for (const raw of [
    {},
    { version: "empty" },
    { schemaVersion: 2 },
    { natal: {} },
    { unknown: "copy" },
  ]) {
    assert.throws(() => validateContentGraph(raw), /empty/i);
  }
  for (const raw of [{ cycles: [] }, { natal: { sun_placement: "Legacy sun copy" } }]) {
    assert.doesNotThrow(() => validateContentGraph(raw));
  }
});

test("validateContentGraph rejects new annotations and rules without schemaVersion 2", () => {
  const bundleWithThemesNoSchema = {
    version: "no-schema-themes",
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "Mechanism copy",
        question: "Question?",
        themes: ["structure"],
      },
    ],
  };
  assert.throws(() => validateContentGraph(bundleWithThemesNoSchema), /schemaVersion.*2/i);

  const bundleWithRulesNoSchema = {
    version: "no-schema-rules",
    cycles: [
      {
        key: "square:saturn:sun",
        mechanism: "Mechanism copy",
        question: "Question?",
      },
    ],
    synthesisRules: [],
  };
  assert.throws(() => validateContentGraph(bundleWithRulesNoSchema), /schemaVersion.*2/i);
});

test("validateContentGraph rejects duplicate keys, duplicate pairs, missing parents, wrong parent themes, and wildcard selectors", () => {
  const baseCycle1 = {
    key: "square:saturn:sun",
    mechanism: "Saturn square sun mechanism",
    question: "Saturn question?",
    themes: ["structure"],
  };
  const baseCycle2 = {
    key: "trine:jupiter:mars",
    mechanism: "Jupiter trine mars mechanism",
    question: "Jupiter question?",
    themes: ["expansion", "initiative"],
  };

  // Duplicate cycle key
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, { ...baseCycle1 }],
        synthesisRules: [],
      }),
    /duplicate.*key/i,
  );

  // Duplicate rule key
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, baseCycle2],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "tension",
            mechanism: "Tension mechanism",
            primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
          },
          {
            key: "rule-1",
            relationship: "independent",
            mechanism: null,
            primary: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
            supporting: { interpretationKey: "square:saturn:sun", theme: "structure" },
          },
        ],
      }),
    /duplicate.*rule.*key/i,
  );

  // Duplicate ordered pair
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, baseCycle2],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "tension",
            mechanism: "Tension mechanism 1",
            primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
          },
          {
            key: "rule-2",
            relationship: "tension",
            mechanism: "Tension mechanism 2",
            primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "initiative" },
          },
        ],
      }),
    /duplicate.*pair/i,
  );

  // Missing parent
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "tension",
            mechanism: "Tension mechanism",
            primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
            supporting: { interpretationKey: "nonexistent:key", theme: "expansion" },
          },
        ],
      }),
    /missing parent|not found/i,
  );

  // Wrong parent theme
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, baseCycle2],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "tension",
            mechanism: "Tension mechanism",
            primary: { interpretationKey: "square:saturn:sun", theme: "rest" }, // cycle1 does not have "rest"
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
          },
        ],
      }),
    /theme/i,
  );

  // Wildcard selector
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, baseCycle2],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "tension",
            mechanism: "Tension mechanism",
            primary: { interpretationKey: "square:saturn:*", theme: "structure" },
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
          },
        ],
      }),
    /wildcard/i,
  );

  // Unknown theme tag on interpretation
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [
          {
            ...baseCycle1,
            themes: ["not-a-real-theme"],
          },
        ],
        synthesisRules: [],
      }),
    /unknown.*tag|invalid.*theme/i,
  );

  // Invalid relationship text
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, baseCycle2],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "tension",
            mechanism: "", // empty text
            primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
          },
        ],
      }),
    /mechanism/i,
  );

  // Non-null mechanism on independent rule
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [baseCycle1, baseCycle2],
        synthesisRules: [
          {
            key: "rule-1",
            relationship: "independent",
            mechanism: "Should not have mechanism",
            primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
            supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
          },
        ],
      }),
    /null/i,
  );
});

test("validateContentGraph enforces graph bounds and safety", () => {
  // > 3 themes
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [
          {
            key: "square:saturn:sun",
            mechanism: "Valid mechanism",
            question: "Valid question?",
            themes: ["structure", "autonomy", "rest", "uncertainty"],
          },
        ],
      }),
    /themes/i,
  );

  // Key length > 100
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [
          {
            key: "a".repeat(101),
            mechanism: "Valid mechanism",
            question: "Valid question?",
          },
        ],
      }),
    /key/i,
  );

  // Mechanism length > 1000
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [
          {
            key: "square:saturn:sun",
            mechanism: "m".repeat(1001),
            question: "Valid question?",
          },
        ],
      }),
    /mechanism/i,
  );

  // Question length > 300
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [
          {
            key: "square:saturn:sun",
            mechanism: "Valid mechanism",
            question: "q".repeat(301),
          },
        ],
      }),
    /question/i,
  );

  // Unsafe copy in mechanism (e.g. DER-22 banned phrases like "will definitely")
  assert.throws(
    () =>
      validateContentGraph({
        schemaVersion: 2,
        cycles: [
          {
            key: "square:saturn:sun",
            mechanism: "This will definitely cure your disease.",
            question: "Valid question?",
          },
        ],
      }),
    /safe|flagged|banned/i,
  );
});

test("samePublishedBundle compares bundles order-insensitively for object keys and order-sensitively for arrays", () => {
  const bundleA = {
    version: "v1",
    schemaVersion: 2,
    cycles: [
      { key: "k1", mechanism: "m1", question: "q1" },
      { key: "k2", mechanism: "m2", question: "q2" },
    ],
    natal: { a: "1", b: "2" },
  };

  const bundleB = {
    natal: { b: "2", a: "1" },
    schemaVersion: 2,
    cycles: [
      { question: "q1", key: "k1", mechanism: "m1" },
      { key: "k2", mechanism: "m2", question: "q2" },
    ],
    version: "v1",
  };

  assert.ok(samePublishedBundle(bundleA, bundleB));

  // Swapped array order in cycles must NOT be equal
  const bundleSwappedArray = {
    ...bundleA,
    cycles: [bundleA.cycles[1], bundleA.cycles[0]],
  };
  assert.ok(!samePublishedBundle(bundleA, bundleSwappedArray));
});

test("built-in DEFAULT_BUNDLE passes validateContentGraph", () => {
  assert.doesNotThrow(() => validateContentGraph(DEFAULT_BUNDLE));
  assert.equal(DEFAULT_BUNDLE.version, "builtin-0.5.0");
  assert.equal(DEFAULT_BUNDLE.schemaVersion, 2);
  assert.equal(DEFAULT_BUNDLE.synthesisRules.length, 6);
  assert.equal(
    DEFAULT_BUNDLE.cycles.filter(
      (c) => c.key.includes(":") && !c.key.startsWith("hard:") && !c.key.startsWith("soft:"),
    ).length,
    6,
  );
});

function makeCycle(transit, aspect, natal, importance, extra = {}) {
  return {
    cycle_key: `${transit}_${aspect}_${natal}`,
    transit_body: transit,
    aspect,
    natal_point: natal,
    importance,
    label: `${transit} ${aspect} natal ${natal}`,
    phase: "approaching",
    orb: 1.0,
    days_to_exact: 3,
    domain: "work",
    ingress_at: "2026-10-01T00:00:00Z",
    exact_at: "2026-10-14T00:00:00Z",
    egress_at: "2026-10-28T00:00:00Z",
    arc_position: 0.3,
    ...extra,
  };
}

const baseChart = {
  engine: "swiss",
  engineVersion: "2.10",
  houseSystem: "placidus",
  points: {},
  uncertainty: {
    accuracy: "exact",
    minutes: 0,
    ascendantSpreadDeg: 0,
    angleClaimsSuppressed: false,
    housesReliable: true,
  },
};

const defaultContext = {
  granted: new Set(["USR-01", "USR-02"]),
  tone: "plain",
  depth: "standard",
  localBucket: null,
  checkIn: null,
  wellness: null,
};

test("resolveInterpretationPlan handles selected tension, reinforcement, and explicit independence", () => {
  // 1. Tension
  const c1Tension = makeCycle("saturn", "square", "sun", 0.8);
  const c2Tension = makeCycle("jupiter", "trine", "mars", 0.5);
  const planTension = resolveInterpretationPlan(DEFAULT_BUNDLE, [c1Tension, c2Tension]);
  assert.equal(planTension.pairStatus, "selected");
  assert.equal(planTension.synthesis?.relationship, "tension");
  assert.equal(planTension.synthesis?.ruleKey, "square:saturn:sun_tension_trine:jupiter:mars");
  assert.deepEqual(planTension.synthesis?.dependsOn, ["C1", "I1", "C2", "I2"]);
  assert.equal(planTension.interpretations.length, 2);

  // 2. Reinforcement
  const c1Reinf = makeCycle("saturn", "trine", "sun", 0.8);
  const c2Reinf = makeCycle("mars", "trine", "sun", 0.5);
  const planReinf = resolveInterpretationPlan(DEFAULT_BUNDLE, [c1Reinf, c2Reinf]);
  assert.equal(planReinf.pairStatus, "selected");
  assert.equal(planReinf.synthesis?.relationship, "reinforcement");
  assert.equal(planReinf.synthesis?.ruleKey, "trine:saturn:sun_reinforcement_trine:mars:sun");

  // 3. Independent
  const c1Indep = makeCycle("venus", "opposition", "venus", 0.8);
  const c2Indep = makeCycle("mercury", "conjunction", "mercury", 0.5);
  const planIndep = resolveInterpretationPlan(DEFAULT_BUNDLE, [c1Indep, c2Indep]);
  assert.equal(planIndep.pairStatus, "independent");
  assert.equal(planIndep.synthesis, null);
  assert.equal(
    planIndep.pairRuleKey,
    "opposition:venus:venus_independent_conjunction:mercury:mercury",
  );

  // 4. Reversed orientation
  const planRev = resolveInterpretationPlan(DEFAULT_BUNDLE, [c2Tension, c1Tension]);
  assert.equal(planRev.pairStatus, "selected");
  assert.equal(planRev.synthesis?.relationship, "tension");
  assert.equal(planRev.synthesis?.ruleKey, "trine:jupiter:mars_tension_square:saturn:sun");
});

test("resolveInterpretationPlan handles unmatched, unavailable copy, and insufficient contacts", () => {
  // Unmatched
  const c1 = makeCycle("saturn", "square", "sun", 0.8);
  const c2 = makeCycle("venus", "opposition", "venus", 0.5);
  const planUnmatched = resolveInterpretationPlan(DEFAULT_BUNDLE, [c1, c2]);
  assert.equal(planUnmatched.pairStatus, "unmatched");
  assert.equal(planUnmatched.synthesis, null);
  assert.equal(planUnmatched.pairRuleKey, null);

  // Insufficient contacts (0 or 1)
  const plan0 = resolveInterpretationPlan(DEFAULT_BUNDLE, []);
  assert.equal(plan0.pairStatus, "insufficient");
  assert.equal(plan0.synthesis, null);

  const plan1 = resolveInterpretationPlan(DEFAULT_BUNDLE, [c1]);
  assert.equal(plan1.pairStatus, "insufficient");
  assert.equal(plan1.synthesis, null);

  // Unavailable parent copy (C2 has fallback sentinel)
  const bundleNoJupiter = {
    ...DEFAULT_BUNDLE,
    cycles: DEFAULT_BUNDLE.cycles.filter((c) => !c.key.includes("jupiter") && c.key !== "soft:*:*"),
  };
  const planUnavailable = resolveInterpretationPlan(bundleNoJupiter, [
    c1,
    makeCycle("jupiter", "trine", "mars", 0.5),
  ]);
  assert.equal(planUnavailable.pairStatus, "unmatched");
  assert.equal(planUnavailable.synthesis, null);
  assert.equal(planUnavailable.interpretations.length, 1); // fallback sentinel omitted
});

test("assembleReading deterministic body, tie-breaking, suppression, and 4th contact bounds", () => {
  // Equal importance tie-breaking by cycle_key
  const cA = makeCycle("saturn", "square", "sun", 0.5); // cycle_key: saturn_square_sun
  const cB = makeCycle("jupiter", "trine", "mars", 0.5); // cycle_key: jupiter_trine_mars
  // "jupiter_trine_mars" < "saturn_square_sun" alphabetically
  const readingTie = assembleReading(baseChart, [cA, cB], defaultContext, DEFAULT_BUNDLE);
  assert.equal(readingTie.eligibleCycles[0].cycle_key, "jupiter_trine_mars");
  assert.equal(readingTie.eligibleCycles[1].cycle_key, "saturn_square_sun");
  assert.equal(readingTie.interpretationPlan.pairStatus, "selected");
  assert.equal(
    readingTie.interpretationPlan.synthesis?.ruleKey,
    "trine:jupiter:mars_tension_square:saturn:sun",
  );

  // Deterministic body includes synthesis mechanism right after primary mechanism
  const c1 = makeCycle("saturn", "square", "sun", 0.8);
  const c2 = makeCycle("jupiter", "trine", "mars", 0.5);
  const reading = assembleReading(baseChart, [c1, c2], defaultContext, DEFAULT_BUNDLE);
  assert.ok(reading.interpretationPlan);
  assert.equal(reading.interpretationPlan.pairStatus, "selected");
  assert.ok(reading.interpretationPlan.synthesis);
  assert.ok(reading.body.includes(reading.interpretationPlan.synthesis.mechanism));

  // Synthesis provenance is recorded when consumed
  assert.ok(
    reading.provenance.some(
      (p) => p.label === `Synthesis ${reading.interpretationPlan.synthesis?.ruleKey}`,
    ),
  );
  // Supporting interpretation provenance is recorded when consumed by synthesis
  assert.ok(
    reading.provenance.some((p) => p.label.startsWith("Interpretation trine:jupiter:mars")),
  );

  // Independent pair: no synthesis text in body, no synthesis provenance, no supporting interpretation provenance
  const cIndep1 = makeCycle("venus", "opposition", "venus", 0.8);
  const cIndep2 = makeCycle("mercury", "conjunction", "mercury", 0.5);
  const readingIndep = assembleReading(
    baseChart,
    [cIndep1, cIndep2],
    defaultContext,
    DEFAULT_BUNDLE,
  );
  assert.equal(readingIndep.interpretationPlan.pairStatus, "independent");
  assert.equal(readingIndep.interpretationPlan.synthesis, null);
  assert.ok(!readingIndep.provenance.some((p) => p.label.startsWith("Synthesis")));
  assert.ok(
    !readingIndep.provenance.some((p) =>
      p.label.startsWith("Interpretation conjunction:mercury:mercury"),
    ),
  );

  // Suppression test: angle contact with high importance is suppressed
  const suppressedChart = {
    ...baseChart,
    uncertainty: { ...baseChart.uncertainty, angleClaimsSuppressed: true },
  };
  const angleCycle = makeCycle("saturn", "conjunction", "ascendant", 0.99);
  const readingSuppressed = assembleReading(
    suppressedChart,
    [angleCycle, c1, c2],
    defaultContext,
    DEFAULT_BUNDLE,
  );
  assert.ok(!readingSuppressed.eligibleCycles.some((c) => c.natal_point === "ascendant"));
  assert.ok(
    !readingSuppressed.interpretationPlan.interpretations.some((i) =>
      i.cycleKey.includes("ascendant"),
    ),
  );

  // 4th contact cannot become synthesis parent
  const c3 = makeCycle("mars", "trine", "sun", 0.4);
  const c4 = makeCycle("mercury", "conjunction", "mercury", 0.3);
  const reading4 = assembleReading(baseChart, [c1, c2, c3, c4], defaultContext, DEFAULT_BUNDLE);
  assert.equal(reading4.eligibleCycles.length, 3);
  assert.ok(!reading4.eligibleCycles.some((c) => c.cycle_key === c4.cycle_key));
});

test("family entries cannot become synthesis selectors even with reviewed tags", () => {
  const bundle = structuredClone(DEFAULT_BUNDLE);
  const parent = bundle.cycles.find((c) => c.key === "hard:saturn:sun");
  parent.themes = ["structure"];
  bundle.synthesisRules[0].primary.interpretationKey = parent.key;
  assert.throws(() => validateContentGraph(bundle), /exact/i);
});

test("explicit malformed catalogue containers are rejected rather than inheriting defaults", () => {
  for (const bundle of [[], { cycles: {} }, { cycles: null }, { cycles: "missing" }])
    assert.throws(() => validateContentGraph(bundle), /object|array/i);
});
