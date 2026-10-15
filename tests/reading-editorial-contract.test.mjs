import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let vite, schema, base, invalidation;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  schema = await vite.ssrLoadModule("/src/lib/content/schema.ts");
  base = (await vite.ssrLoadModule("/src/lib/content/default-bundle.ts")).DEFAULT_BUNDLE;
  invalidation = await vite.ssrLoadModule("/src/lib/content/daily-writing-invalidation.ts");
});
after(async () => await vite?.close());
const material = {
  meaning: "A point can survive a change of wording.",
  scene: "A question becomes a suggestion in a draft.",
  imagery: "A messenger rereads the original note.",
  direction: "The point can stay beside the draft.",
  reflection: "Directness can be considerate.",
};
const copy = () => ({
  key: "reply",
  writingMaterial: structuredClone(material),
  constraints: ["Do not infer an actual message or promise a response."],
  headline: "When a point survives",
  reflection: "When is directness considerate?",
  fallbackParagraphs: [
    "A question can become a suggestion in a draft.",
    "The original point can stay beside the new wording.",
  ],
});
const bundle = () => ({
  ...structuredClone(base),
  version: "editorial-test-1",
  schemaVersion: 6,
  dailyEditorial: {
    version: "daily-editorial-1",
    frames: [
      {
        ...copy(),
        source: { kind: "interpretation", key: "conjunction:mercury:mercury" },
        cycleKeys: ["mercury_conjunction_mercury"],
      },
    ],
    quiet: [0, 1].map((i) => ({
      ...copy(),
      key: `quiet-${i}`,
      writingMaterial: { ...material, imagery: null },
    })),
  },
});
const interpretation = (b) => ({
  releaseVersion: b.version,
  interpretations: [
    {
      index: 1,
      cycleKey: "mercury_conjunction_mercury",
      interpretationKey: "conjunction:mercury:mercury",
      mechanism: b.cycles.find((c) => c.key === "conjunction:mercury:mercury").mechanism,
      themes: ["expression"],
    },
  ],
  synthesis: null,
  pairStatus: "insufficient",
  pairRuleKey: null,
});

test("schema 6 retains explicit editorial copy without inheriting it into older releases", () => {
  const b = bundle();
  assert.doesNotThrow(() => schema.validateContentGraph(b));
  const normalized = schema.normalizeContentBundle(b, b.version, base);
  assert.deepEqual(normalized.dailyEditorial, b.dailyEditorial);
  normalized.dailyEditorial.frames[0].constraints[0] = "Changed";
  assert.notEqual(
    normalized.dailyEditorial.frames[0].constraints[0],
    b.dailyEditorial.frames[0].constraints[0],
  );
  const legacy = schema.normalizeContentBundle(
    { version: "older", schemaVersion: 4, cycles: base.cycles },
    "older",
    b,
  );
  assert.equal(legacy.dailyEditorial, undefined);
});

test("catalogue rejects unknown fields, duplicate bindings, absent sources and mismatched geometry", () => {
  for (const mutate of [
    (b) => {
      b.dailyEditorial.frames[0].writingMaterial.evidence = "Do not leak provenance";
    },
    (b) => {
      b.dailyEditorial.frames.push({
        ...copy(),
        key: "duplicate",
        source: { kind: "interpretation", key: "conjunction:mercury:mercury" },
        cycleKeys: ["mercury_conjunction_mercury"],
      });
    },
    (b) => {
      b.dailyEditorial.frames[0].source.key = "square:neptune:mercury";
    },
    (b) => {
      b.dailyEditorial.frames[0].cycleKeys = ["venus_opposition_venus"];
    },
    (b) => {
      b.dailyEditorial.quiet[0].source = { kind: "interpretation", key: "hard:*:*" };
    },
    (b) => {
      b.dailyEditorial.quiet[0].writingMaterial.imagery = "Mercury names.";
    },
    (b) => {
      b.dailyEditorial.quiet[0].fallbackParagraphs = [
        "Mercury's square makes today difficult.",
        "There is a hidden signal.",
      ];
    },
    (b) => {
      b.dailyEditorial.frames[0].reflection = "Notice the point.";
    },
    (b) => {
      b.schemaVersion = 5;
    },
  ]) {
    const b = bundle();
    mutate(b);
    assert.throws(() => schema.validateContentGraph(b), /editorial/i);
  }
});

test("selection is exact, scoped to warm standard, and does not borrow frame imagery", async () => {
  const editorial = await vite.ssrLoadModule("/src/lib/content/daily-editorial.ts");
  const b = bundle(),
    p = interpretation(b),
    ctx = { day: "2026-10-11", tone: "warm", depth: "standard" };
  const selected = editorial.resolveDailyEditorial(b, p, ctx);
  assert.equal(selected.entry.key, "reply");
  assert.deepEqual(selected.requiredFacts, ["C1", "I1"]);
  assert.equal(editorial.resolveDailyEditorial(b, p, { ...ctx, tone: "plain" }), null);
  assert.equal(editorial.resolveDailyEditorial(b, p, { ...ctx, depth: "technical" }), null);
  p.interpretations[0].cycleKey = "mercury_square_mercury";
  assert.equal(editorial.resolveDailyEditorial(b, p, ctx), null);
  p.releaseVersion = "stale";
  assert.throws(() => editorial.resolveDailyEditorial(b, p, ctx), /release/i);
});

test("authored fallback requires complete sentences within the same paragraph bounds as generated copy", () => {
  for (const collection of ["frames", "quiet"]) {
    for (const paragraph of [
      "An unfinished observation",
      "One thing. Two things. Three things. Four things. Five things.",
    ]) {
      const b = bundle();
      b.dailyEditorial[collection][0].fallbackParagraphs[0] = paragraph;
      assert.throws(() => schema.validateContentGraph(b), /editorial fallback/i);
    }
  }
});

test("quiet selection is stable across a local date and changes on consecutive dates without facts", async () => {
  const editorial = await vite.ssrLoadModule("/src/lib/content/daily-editorial.ts");
  const b = bundle(),
    p = { ...interpretation(b), interpretations: [] };
  const a = editorial.resolveDailyEditorial(b, p, {
    day: "2026-10-11",
    tone: "warm",
    depth: "standard",
  });
  const repeat = editorial.resolveDailyEditorial(b, p, {
    day: "2026-10-11",
    tone: "warm",
    depth: "standard",
  });
  const next = editorial.resolveDailyEditorial(b, p, {
    day: "2026-10-12",
    tone: "warm",
    depth: "standard",
  });
  assert.deepEqual(a, repeat);
  assert.notEqual(a.entry.key, next.entry.key);
  assert.equal(a.mode, "quiet");
  assert.deepEqual(a.requiredFacts, []);
  assert.equal(editorial.resolveDailyEditorial(b, p, { tone: "warm", depth: "standard" }), null);
  assert.throws(
    () =>
      editorial.resolveDailyEditorial(b, p, { day: "2026-02-30", tone: "warm", depth: "standard" }),
    /date|day/i,
  );
  const brief = editorial.toDailyEditorialBrief(a);
  assert.deepEqual(Object.keys(brief).sort(), [
    "constraints",
    "mode",
    "requiredFacts",
    "version",
    "writingMaterial",
  ]);
  assert.equal("constraints" in brief.writingMaterial, false);
  assert.equal("fallbackParagraphs" in brief, false);
});

test("editing an interpretation invalidates its editorial frame but preserves source-free quiet copy", () => {
  const previous = bundle(),
    next = structuredClone(previous);
  next.cycles.find((c) => c.key === "conjunction:mercury:mercury").mechanism =
    "Changed reviewed meaning.";
  const result = invalidation.invalidateDailyWritingFrames(previous, next);
  assert.deepEqual(result.bundle.dailyEditorial.frames, []);
  assert.deepEqual(result.bundle.dailyEditorial.quiet, previous.dailyEditorial.quiet);
});

test("a new exact interpretation invalidates an editorial frame bound to the displaced family source", () => {
  const previous = bundle();
  previous.dailyEditorial.frames[0].source.key = "soft:jupiter:sun";
  previous.dailyEditorial.frames[0].cycleKeys = ["jupiter_trine_sun"];
  const next = structuredClone(previous);
  next.cycles.push({
    key: "trine:jupiter:sun",
    mechanism: "A distinct reviewed interpretation.",
    question: "What has your attention?",
    themes: [],
  });
  assert.deepEqual(
    invalidation.invalidateDailyWritingFrames(previous, next).bundle.dailyEditorial.frames,
    [],
  );
});

test("editing either synthesis parent invalidates its editorial material", () => {
  const previous = bundle();
  const rule = previous.synthesisRules.find(
    (r) =>
      r.primary.interpretationKey === "square:saturn:sun" &&
      r.supporting.interpretationKey === "trine:jupiter:mars",
  );
  previous.dailyEditorial.frames[0].source = { kind: "synthesis", key: rule.key };
  previous.dailyEditorial.frames[0].cycleKeys = ["saturn_square_sun", "jupiter_trine_mars"];
  for (const key of [rule.primary.interpretationKey, rule.supporting.interpretationKey]) {
    const next = structuredClone(previous);
    next.cycles.find((c) => c.key === key).mechanism = "Revised source condition.";
    assert.deepEqual(
      invalidation.invalidateDailyWritingFrames(previous, next).bundle.dailyEditorial.frames,
      [],
    );
  }
});
