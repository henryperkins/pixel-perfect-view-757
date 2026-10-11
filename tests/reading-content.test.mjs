import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";

let vite, DEFAULT_BUNDLE, findInterpretation, safetyPass, assembleReading, readingFacts;
const chart = READING_EVAL_CASES[0].chart;
const context = {
  granted: new Set(["USR-01", "USR-02"]),
  tone: "plain",
  depth: "standard",
  localBucket: null,
  checkIn: null,
  wellness: null,
};
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ DEFAULT_BUNDLE, findInterpretation, safetyPass } = await vite.ssrLoadModule(
    "/src/lib/content/default-bundle.ts",
  ));
  ({ assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts"));
});
after(async () => {
  await vite?.close();
});

function contact(transit, natal, aspect, domain) {
  return {
    ...READING_EVAL_CASES[0].cycles[0],
    cycle_key: `${transit}_${aspect}_${natal}`,
    transit_body: transit,
    natal_point: natal,
    aspect,
    domain,
    label: `${transit} ${aspect} natal ${natal}`,
    days_to_exact: 3,
  };
}

test("common supportive contacts select their own source copy through the real assembly and facts", () => {
  for (const [transit, natal, domain] of [
    ["saturn", "moon", "inner-life"],
    ["mars", "sun", "identity"],
    ["mercury", "mercury", "work"],
    ["venus", "venus", "relationships"],
  ]) {
    for (const aspect of ["trine", "sextile"]) {
      const reading = assembleReading(chart, [contact(transit, natal, aspect, domain)], context);
      const published = findInterpretation(DEFAULT_BUNDLE, aspect, transit, natal);
      assert.equal(reading.editorial.interpretation.key, published.key);
      assert.ok(reading.body.includes(published.mechanism));
      assert.deepEqual(reading.flagged, []);
      const facts = readingFacts(chart, reading);
      assert.ok(facts.find((fact) => fact.id === "I1").statement.includes(published.mechanism));
      assert.ok(
        reading.provenance.some((entry) => entry.label === `Interpretation ${published.key}`),
      );
    }
  }
});

test("common hard and soft sources provide distinct safe passages instead of one-line wildcard copy", () => {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  const passages = new Set();
  for (const [transit, natal] of [
    ["saturn", "sun"],
    ["saturn", "moon"],
    ["jupiter", "sun"],
    ["mars", "sun"],
    ["mercury", "mercury"],
    ["venus", "venus"],
  ]) {
    for (const aspect of ["square", "trine"]) {
      const source = findInterpretation(DEFAULT_BUNDLE, aspect, transit, natal);
      const sentences = [...segmenter.segment(source.mechanism)].filter((part) =>
        part.segment.trim(),
      );
      assert.ok(
        sentences.length >= 2 && sentences.length <= 3,
        `${source.key} must offer a short passage`,
      );
      assert.deepEqual(safetyPass(source.mechanism).flagged, [], source.key);
      assert.ok(
        !passages.has(source.mechanism),
        `${source.key} must have distinct authored wording`,
      );
      passages.add(source.mechanism);
    }
  }
  const moon = findInterpretation(DEFAULT_BUNDLE, "conjunction", "moon", "moon");
  assert.ok(
    [...segmenter.segment(moon.mechanism)].filter((part) => part.segment.trim()).length >= 2,
  );
});

test("common-domain framing avoids regulated claims when it joins safe source passages", () => {
  for (const [transit, natal, domain] of [
    ["saturn", "moon", "inner-life"],
    ["venus", "venus", "relationships"],
    ["mercury", "mercury", "work"],
    ["saturn", "sun", "identity"],
  ]) {
    for (const aspect of ["square", "trine"]) {
      const reading = assembleReading(chart, [contact(transit, natal, aspect, domain)], context);
      assert.deepEqual(reading.flagged, []);
      assert.doesNotMatch(
        reading.editorial.domain.text,
        /\b(health|medication|diagnosis|money|pregnancy|divorce|death|sleep|recovery)\b/i,
      );
      assert.ok(reading.body.includes(reading.editorial.domain.text));
    }
  }
});

test("built-in daily copy gets a new release identity without changing the natal catalog shape", () => {
  assert.equal(DEFAULT_BUNDLE.version, "builtin-0.5.0");
  assert.deepEqual(Object.keys(DEFAULT_BUNDLE.natal).sort(), [
    "ascendant_placement",
    "moon_placement",
    "sun_placement",
  ]);
  const reading = assembleReading(chart, [contact("saturn", "sun", "square", "identity")], context);
  assert.equal(reading.release_version, DEFAULT_BUNDLE.version);
});

test("phase and arc copy describe calculated timing without assuming a reader's experience", () => {
  for (const [phase, days, arc] of [
    ["approaching", 3, 0.1],
    ["exact", 0, 0.5],
    ["separating", -2, 0.8],
  ]) {
    const reading = assembleReading(
      chart,
      [
        {
          ...contact("saturn", "sun", "square", "identity"),
          phase,
          days_to_exact: days,
          arc_position: arc,
        },
      ],
      { ...context, depth: "technical" },
    );
    assert.doesNotMatch(
      reading.editorial.phase.text + reading.editorial.timing,
      /anticipation|what you notice|settling|legible|mostly potential|winding down/i,
    );
    assert.match(reading.editorial.timing, /Current orb at the reading's calculation time:/);
    assert.match(reading.editorial.timing, /calculated window/i);
  }
});

test("a tight exact-phase contact without a scanned pass does not acquire an exact date", () => {
  const reading = assembleReading(
    chart,
    [
      {
        ...contact("saturn", "sun", "square", "identity"),
        phase: "exact",
        exact_at: null,
        days_to_exact: null,
        orb: 0.25,
        arc_position: null,
      },
    ],
    { ...context, depth: "technical" },
  );
  const facts = readingFacts(chart, reading);
  assert.equal(facts.find((fact) => fact.id === "C1").cycle.exactDate, null);
  assert.match(facts.find((fact) => fact.id === "C1").statement, /No exact date was found/);
  assert.match(reading.editorial.timing, /no exact pass in this scan/);
  assert.match(reading.editorial.timing, /Current orb at the reading's calculation time: 0\.25°/);
  assert.doesNotMatch(
    reading.editorial.phase.text + reading.editorial.timing,
    /exact today|exact on|exact date is|zero degrees|0°/i,
  );
});

test("same-day timing and a nonzero calculation-time orb remain separate facts", () => {
  const reading = assembleReading(
    chart,
    [
      {
        ...contact("saturn", "sun", "square", "identity"),
        phase: "exact",
        days_to_exact: 0,
        exact_at: "2026-10-11T01:00:00Z",
        orb: 0.42,
      },
    ],
    { ...context, depth: "technical" },
  );
  assert.equal(
    readingFacts(chart, reading).find((fact) => fact.id === "C1").cycle.exactDate,
    "2026-10-11",
  );
  assert.match(reading.editorial.timing, /^Timing: exact today\./);
  assert.match(reading.editorial.timing, /Current orb at the reading's calculation time: 0\.42°\./);
  assert.ok(
    ![
      ...new Intl.Segmenter("en", { granularity: "sentence" }).segment(reading.editorial.timing),
    ].some(({ segment }) => /exact today/.test(segment) && /0\.42/.test(segment)),
  );
});
