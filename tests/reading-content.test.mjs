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
      assert.equal(reading.editorial.interpretation.key, `soft:${transit}:${natal}`);
      const published = findInterpretation(DEFAULT_BUNDLE, aspect, transit, natal);
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
  assert.equal(DEFAULT_BUNDLE.version, "builtin-0.3.0");
  assert.deepEqual(Object.keys(DEFAULT_BUNDLE.natal).sort(), [
    "ascendant_placement",
    "moon_placement",
    "sun_placement",
  ]);
  const reading = assembleReading(chart, [contact("saturn", "sun", "square", "identity")], context);
  assert.equal(reading.release_version, DEFAULT_BUNDLE.version);
});
