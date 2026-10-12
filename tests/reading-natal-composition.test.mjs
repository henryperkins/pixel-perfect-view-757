import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";

let h, assemble, natalBundle, fallbackBundle, transitBundle, screen, calculation, localDay;
before(async () => {
  h = await createRecordsHarness();
  ({ assembleReading: assemble } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ NATAL_CANDIDATE_BUNDLE: natalBundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
  ({ DEFAULT_BUNDLE: fallbackBundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/default-bundle.ts",
  ));
  ({ TRANSIT_CANDIDATE_BUNDLE: transitBundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  ));
  ({ syntheticNatalReliability: screen } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.natal.ts",
  ));
  ({ syntheticTransitCalculation: calculation } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.transit.ts",
  ));
  localDay = await h.vite.ssrLoadModule("/src/lib/local-day.ts");
});
after(async () => h?.close());

function reading(id, bundle = natalBundle, context = {}) {
  const fixed = READING_EVAL_CASES.find((row) => row.id === id);
  assert.ok(fixed, id);
  const cycles = fixed.cycles.map((cycle) => ({
    ...cycle,
    days_to_exact: localDay.daysToLocalDate(
      cycle.exact_at,
      fixed.config.day,
      fixed.config.timeZone,
    ),
  }));
  const ctx = {
    ...fixed.config,
    granted: new Set(fixed.config.granted),
    localBucket: null,
    checkIn: null,
    wellness: null,
    ...context,
  };
  const reliability = screen(fixed);
  const initial = assemble(fixed.chart, cycles, ctx, bundle, reliability);
  return assemble(
    fixed.chart,
    cycles,
    ctx,
    bundle,
    reliability,
    calculation(fixed, initial.eligibleCycles[0]),
  );
}
const words = (text) => text.trim().split(/\s+/).length;
const paragraphs = (result) => result.astroBody.split("\n\n");
const positives = [
  "natal-duty-reflex",
  "natal-freedom-reflex",
  "natal-service-aspect",
  "natal-exact-house",
  "natal-own-target",
  "natal-moon-fallback",
  "natal-mixed-source",
  "natal-synthesis-integration",
];

test("eight positive fallback bodies are compact, deterministic and keep the lens in paragraph one", () => {
  for (const id of positives) {
    const result = reading(id);
    assert.equal(result.natalLensPlan.status, "selected", id);
    assert.equal(reading(id).astroBody, result.astroBody, id);
    assert.equal(paragraphs(result).length, 2, id);
    assert.ok(words(result.astroBody) <= 170, `${id}: ${words(result.astroBody)}`);
    assert.ok(!result.astroBody.includes(result.natalLensPlan.lens.mechanism), id);
    assert.doesNotMatch(
      result.astroBody,
      /Timing:|Also in range:|Observation:|Taking this gently:/,
    );
    assert.deepEqual(result.flagged, [], id);
    const plain = reading(id, fallbackBundle);
    assert.equal(result.headline, plain.headline, id);
    assert.equal(result.prompt, plain.prompt, id);
    assert.equal(result.confidence, plain.confidence, id);
    assert.deepEqual(result.eligibleCycles, plain.eligibleCycles, id);
  }
  // Concrete scene/condition regressions, not a claim of semantic qualification.
  const duty = paragraphs(reading("natal-duty-reflex"));
  assert.match(
    duty[0],
    /quiet moment might be spent mentally keeping track of an unfinished reply/,
  );
  assert.match(duty[0], /For that reply, useful preparation may be different from waiting/);
  assert.doesNotMatch(duty[1], /preparation|sharing|everything settled/);
  const freedom = paragraphs(reading("natal-freedom-reflex"));
  assert.match(freedom[0], /If that obligation feels narrow/);
  assert.match(freedom[0], /commitment itself and how much choice it leaves in carrying it out/);
  assert.notEqual(duty[0], freedom[0]);
  assert.match(
    paragraphs(reading("natal-service-aspect"))[0],
    /In that commitment, accepting useful support may be different from taking on every obligation/,
  );
  assert.match(
    paragraphs(reading("natal-exact-house"))[0],
    /If a quiet moment is spent mentally keeping track of an unfinished list, one useful task may be different/,
  );
  for (const id of ["natal-own-target", "natal-synthesis-integration"])
    assert.match(
      paragraphs(reading(id))[0],
      /If several possible projects within that role compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages/,
    );
  assert.match(
    paragraphs(reading("natal-moon-fallback"))[0],
    /If an unfinished reply is one of those obligations, useful preparation may be different/,
  );
  assert.equal(reading("natal-duty-reflex").astroBody, reading("natal-mixed-source").astroBody);
});

test("technical depth adds a bounded calculation passage without repeating standard filler", () => {
  for (const id of positives) {
    const standard = reading(id);
    const technical = reading(id, natalBundle, { depth: "technical" });
    assert.deepEqual(paragraphs(technical).slice(0, 2), paragraphs(standard), id);
    assert.equal(paragraphs(technical).length, 3, id);
    assert.ok(words(technical.astroBody) <= 240, id);
    assert.match(
      paragraphs(technical)[2],
      /Current orb at the reading's calculation time: 0\.42°\./,
    );
    assert.match(paragraphs(technical)[2], /\. Timing: exact in 3 days\./);
    assert.doesNotMatch(technical.astroBody, /Also in range:|arc position|approaching phase/);
  }
  const denied = reading("natal-duty-reflex", natalBundle, {
    depth: "technical",
    tone: "clinical",
    granted: new Set(),
  });
  assert.equal(denied.astroBody, reading("natal-duty-reflex").astroBody);
});

test("every natal-negative control and natal-free bundle retain the old non-natal assembly", () => {
  for (const fixed of READING_EVAL_CASES) {
    const result = reading(fixed.id);
    if (result.natalLensPlan.lens) continue;
    assert.deepEqual(result.body, reading(fixed.id, fallbackBundle).body, fixed.id);
    assert.doesNotMatch(result.astroBody, /nl-moon|nl-sun|natal lens|Capricorn|Placidus/);
  }
  for (const id of [
    "natal-sign-boundary",
    "natal-unknown-time",
    "natal-degraded-positions",
    "natal-legacy-snapshot",
  ])
    assert.equal(reading(id).natalLensPlan.lens, null, id);
  const suppressed = reading("natal-unknown-time");
  assert.match(suppressed.contextBody, /birth time is recorded as uncertain/);
  assert.doesNotMatch(suppressed.astroBody, /Ascendant|house placements/);
});

test("same-key edits to either full source invalidate authored prose; unfamiliar pairs retain current copy", () => {
  const before = reading("natal-duty-reflex");
  for (const field of ["lens", "interpretation"]) {
    const changed = structuredClone(natalBundle);
    const item =
      field === "lens"
        ? changed.natalLenses.find((rule) => rule.key === before.natalLensPlan.lens.ruleKey)
        : changed.cycles.find((rule) => rule.key === before.editorial.interpretation.key);
    item.mechanism =
      field === "lens"
        ? "A response can take shape around one clear question. An unfinished note may distinguish naming a detail from adding another explanation."
        : "A commitment can feel demanding when its scope is uncertain. A draft agreement can offer a place to consider that scope.";
    const after = reading("natal-duty-reflex", changed);
    for (const sentence of item.mechanism.split(/(?<=[.!?])\s+/))
      assert.ok(after.astroBody.includes(sentence), field);
    assert.doesNotMatch(after.astroBody, /For that reply, useful preparation may be different/);
    assert.notEqual(after.astroBody, before.astroBody);
  }
  // A change at the very end of I1 also invalidates the recipe; matching its
  // opening or its key alone would incorrectly keep the old authored treatment.
  const changed = structuredClone(natalBundle);
  const primary = changed.cycles.find((rule) => rule.key === before.editorial.interpretation.key);
  primary.mechanism += " A named limit can offer another comparison.";
  assert.doesNotMatch(
    reading("natal-duty-reflex", changed).astroBody,
    /For that reply, useful preparation may be different/,
  );
});

test("unfamiliar decimal punctuation and later primary conditions survive alongside synthesis", () => {
  const changed = structuredClone(natalBundle);
  const primary = changed.cycles.find((rule) => rule.key === "square:saturn:sun");
  primary.mechanism =
    "A 2.5-hour task can offer one comparison. This possibility applies only if its scope has been agreed. A longer task does not establish the same possibility.";
  const result = reading("natal-synthesis-integration", changed);
  assert.ok(paragraphs(result)[0].startsWith("A 2.5-hour task can offer one comparison."));
  assert.ok(paragraphs(result)[0].includes(result.natalLensPlan.lens.mechanism));
  assert.match(
    paragraphs(result)[1],
    /This possibility applies only if its scope has been agreed\./,
  );
  assert.match(paragraphs(result)[1], /A longer task does not establish the same possibility\./);
  assert.ok(paragraphs(result)[1].includes(result.interpretationPlan.synthesis.mechanism));
  assert.doesNotMatch(result.astroBody, /projects within that role/);
});

const SATURN_SUN =
  "Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.";
const JUPITER_MARS =
  "Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.";

test("a synthesis fallback names both parent contacts before their published relationship", () => {
  for (const [id, selected] of [
    ["natal-synthesis-integration", natalBundle],
    ["arc-synthesis-natal-integration", natalBundle],
    ["natal-synthesis-integration", transitBundle],
  ]) {
    const result = reading(id, selected);
    assert.notEqual(result.transitStoryPlan.status, "selected", id);
    const synthesis = result.interpretationPlan.synthesis.mechanism;
    const secondary = result.interpretationPlan.interpretations.find((i) => i.index === 2);
    // The second parent is introduced by its own published contact sentence.
    assert.ok(secondary.mechanism.split(/(?<=[.!?])\s+/).includes(JUPITER_MARS), id);
    assert.equal(paragraphs(result).length, 2, id);
    assert.match(paragraphs(result)[0], /projects within that role compete for the same free/, id);
    assert.equal(paragraphs(result)[1], `${SATURN_SUN} ${JUPITER_MARS} ${synthesis}`, id);
    assert.ok(words(result.astroBody) <= 170, id);
  }
});

test("edited second-parent or synthesis copy keeps every published sentence before S1", () => {
  for (const field of ["secondary", "synthesis"]) {
    const changed = structuredClone(natalBundle);
    const rule =
      field === "secondary"
        ? changed.cycles.find((item) => item.key === "trine:jupiter:mars")
        : changed.synthesisRules.find(
            (item) => item.key === "square:saturn:sun_tension_trine:jupiter:mars",
          );
    rule.mechanism += " This possibility applies only while the original scope still holds.";
    const result = reading("natal-synthesis-integration", changed);
    const plan = result.interpretationPlan;
    const secondary = plan.interpretations.find((i) => i.index === 2).mechanism;
    assert.equal(
      paragraphs(result)[1],
      `${SATURN_SUN} ${secondary} ${plan.synthesis.mechanism}`,
      field,
    );
    assert.match(paragraphs(result)[1], /only while the original scope still holds\./, field);
  }
});

test("synthesis and P2 keep their conditions and distinct claims, with one exact A1 chronology", () => {
  const pair = reading("natal-synthesis-integration");
  assert.ok(paragraphs(pair)[1].endsWith(pair.interpretationPlan.synthesis.mechanism));
  assert.match(paragraphs(pair)[1], /Giving a plan more scope can increase/);
  assert.doesNotMatch(pair.astroBody, /That distinction shows|sampling.*(?:causes|establishes)/);
  for (const depth of ["standard", "technical"]) {
    const result = reading("arc-synthesis-natal-integration", transitBundle, { depth });
    const { chronologySentence, copy } = result.transitStoryPlan;
    assert.equal(result.transitStoryPlan.status, "selected");
    assert.ok(result.natalLensPlan.lens);
    assert.ok(result.interpretationPlan.synthesis);
    assert.equal(result.astroBody.split(chronologySentence).length, 2);
    assert.ok(paragraphs(result)[0].endsWith(chronologySentence));
    assert.ok(paragraphs(result)[1].includes(result.interpretationPlan.synthesis.mechanism));
    assert.ok(paragraphs(result)[1].includes(copy.mechanism));
    // The story keeps its bounded paragraph, so S1 follows only its second parent here.
    assert.ok(
      paragraphs(result)[1].startsWith(
        `${JUPITER_MARS} ${result.interpretationPlan.synthesis.mechanism}`,
      ),
    );
    assert.ok(words(result.astroBody) <= (depth === "technical" ? 240 : 170));
    for (const paragraph of paragraphs(result))
      assert.ok((paragraph.match(/[.!?](?:\s|$)/g) ?? []).length <= 4, paragraph);
    assert.doesNotMatch(result.astroBody, /Timing:|first exact pass|Also in range:/);
  }
});

test("consented context and reflection stay separate from composed astronomical prose", () => {
  const ctx = {
    granted: new Set(["USR-01", "USR-02", "AMB-02", "USR-04", "WEL-01", "WEL-03"]),
    localBucket: "evening",
    checkIn: { mood: 2, energy: 3 },
    wellness: { sleep: 2, stress: 4 },
  };
  const candidate = reading("natal-duty-reflex", natalBundle, ctx);
  const plain = reading("natal-duty-reflex", fallbackBundle, ctx);
  assert.equal(candidate.contextBody, plain.contextBody);
  assert.equal(candidate.prompt, plain.prompt);
  assert.match(candidate.prompt, /pressure running high today/);
  assert.equal(candidate.astroBody, reading("natal-duty-reflex").astroBody);
  assert.match(candidate.contextBody, /mood 2\/5 and energy 3\/5/);
  assert.doesNotMatch(candidate.astroBody, /sleep|stress|mood|evening/);
  assert.equal(
    reading("natal-duty-reflex", natalBundle, { ...ctx, granted: new Set() }).contextBody,
    "",
  );
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.swissRequests.length, 0);
});
