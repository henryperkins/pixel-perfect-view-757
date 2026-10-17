import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { READING_EVAL_CASES } from "../src/lib/ai/reading-evaluation.fixtures.mjs";

let h, assemble, candidate, natalReliability, transitCalculation, readingFacts, language;
before(async () => {
  h = await createRecordsHarness();
  ({ assembleReading: assemble } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ EDITORIAL_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/editorial-candidate-bundle.ts",
  ));
  ({ syntheticNatalReliability: natalReliability } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.natal.ts",
  ));
  ({ syntheticTransitCalculation: transitCalculation } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.transit.ts",
  ));
  ({ readingFacts } = await h.vite.ssrLoadModule("/src/lib/ai/facts.ts"));
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
after(async () => h?.close());

function reading(id, { natal = true, story = true, editorial = true, tone = "warm" } = {}) {
  const fixed = READING_EVAL_CASES.find((item) => item.id === id);
  assert.ok(fixed, id);
  const bundle = structuredClone(candidate);
  if (!editorial) delete bundle.dailyEditorial;
  const ctx = {
    ...fixed.config,
    tone,
    depth: "standard",
    granted: new Set(fixed.config.granted),
    localBucket: null,
    checkIn: null,
    wellness: null,
  };
  const reliability = natal ? natalReliability(fixed) : null;
  const initial = assemble(fixed.chart, fixed.cycles, ctx, bundle, reliability);
  const result = assemble(
    fixed.chart,
    fixed.cycles,
    ctx,
    bundle,
    reliability,
    story ? transitCalculation(fixed, initial.eligibleCycles[0]) : null,
  );
  return { result, fixed, ctx };
}

test("a selected natal lens keeps the complete legacy writer and fallback instead of editorial copy", () => {
  const { result, fixed } = reading("natal-synthesis-integration");
  const { result: legacy } = reading("natal-synthesis-integration", { editorial: false });
  assert.equal(result.natalLensPlan.status, "selected");
  assert.equal(result.transitStoryPlan.status, "omitted");
  assert.equal(result.writingPlan.editorial, undefined);
  assert.equal(result.writingTemplate, null);
  assert.deepEqual(result, legacy);
  assert.ok(readingFacts(fixed.chart, result).some((fact) => fact.id === "N1"));
});

test("a selected transit story keeps chronology and chapter sources on the legacy writer", () => {
  const options = { natal: false };
  const { result, fixed } = reading("arc-synthesis-natal-integration", options);
  const { result: legacy } = reading("arc-synthesis-natal-integration", {
    ...options,
    editorial: false,
  });
  assert.equal(result.natalLensPlan.lens, null);
  assert.equal(result.transitStoryPlan.status, "selected");
  assert.equal(result.writingPlan.editorial, undefined);
  assert.equal(result.writingTemplate, null);
  assert.deepEqual(result, legacy);
  const facts = readingFacts(fixed.chart, result);
  assert.ok(facts.some((fact) => fact.id === "A1"));
  assert.ok(facts.some((fact) => fact.id === "P2"));
  assert.ok(result.astroBody.includes(result.transitStoryPlan.chronologySentence));
  assert.ok(result.astroBody.includes(result.transitStoryPlan.copy.mechanism));
});

test("combined natal and story context retains its ordinary provider-failure fallback", async () => {
  const { result, fixed, ctx } = reading("arc-synthesis-natal-integration");
  const { result: legacy } = reading("arc-synthesis-natal-integration", { editorial: false });
  assert.equal(result.natalLensPlan.status, "selected");
  assert.equal(result.transitStoryPlan.status, "selected");
  assert.equal(result.writingPlan.editorial, undefined);
  assert.deepEqual(result, legacy);
  const input = {
    facts: readingFacts(fixed.chart, result),
    hasEligibleCycles: true,
    tone: ctx.tone,
    depth: ctx.depth,
    suppression: { angles: false, houses: false },
    fallback: { headline: result.headline, body: result.astroBody, prompt: result.astroPrompt },
  };
  const generated = await language.generateReadingProse(input);
  assert.equal(generated.meta.mode, "template");
  assert.equal(generated.body, legacy.astroBody);
  assert.equal(generated.prompt, legacy.astroPrompt);
  assert.equal(generated.meta.writing, undefined);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("an eligible contact with omitted context still uses the reviewed editorial fallback", () => {
  const { result } = reading("natal-synthesis-integration", { natal: false });
  assert.equal(result.natalLensPlan.lens, null);
  assert.equal(result.transitStoryPlan.status, "omitted");
  assert.equal(result.writingPlan.editorial?.mode, "contact");
  assert.equal(result.writingPlan.editorial.entry.key, "editorial-synthesis-tension");
  assert.equal(
    result.astroBody,
    result.writingPlan.editorial.entry.fallbackParagraphs.join("\n\n"),
  );
  assert.equal(result.prompt, result.writingPlan.editorial.entry.reflection);
});

test("quiet days retain the authored editorial invitation while unqualified tone keeps the old writer", () => {
  const { result } = reading("quiet-threshold");
  assert.equal(result.writingPlan.editorial?.mode, "quiet");
  assert.equal(
    result.astroBody,
    result.writingPlan.editorial.entry.fallbackParagraphs.join("\n\n"),
  );
  assert.equal(result.prompt, result.writingPlan.editorial.entry.reflection);
  const plain = reading("writing-reply-scene", { tone: "plain" }).result;
  const legacy = reading("writing-reply-scene", { tone: "plain", editorial: false }).result;
  assert.equal(plain.writingPlan.editorial, undefined);
  assert.deepEqual(plain, legacy);
});
