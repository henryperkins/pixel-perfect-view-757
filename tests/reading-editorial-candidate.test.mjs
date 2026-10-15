import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const json = async (path) => JSON.parse(await readFile(new URL(path, `file://${root}`), "utf8"));
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const expectedBaseHash = "300173610977707a1852f4e5898d8e27a2e0d4b932ab3fc4db398eda7efbdad8";
let vite, candidate, baseline, findInterpretation, resolveInterpretationPlan, validateContentGraph;
let resolveDailyEditorial, assembleReading, readingFacts;
let networkAttempts = 0;
const originalFetch = globalThis.fetch;

before(async () => {
  globalThis.fetch = async () => {
    networkAttempts++;
    throw Error("Editorial candidate tests forbid network access.");
  };
  baseline = await json("docs/reviews/daily-reading-editorial/2026-10-15/baseline.json");
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ EDITORIAL_CANDIDATE_BUNDLE: candidate } = await vite.ssrLoadModule(
    "/src/lib/content/editorial-candidate-bundle.ts",
  ));
  ({ findInterpretation } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
  ({ resolveInterpretationPlan } = await vite.ssrLoadModule("/src/lib/content/synthesis.ts"));
  ({ validateContentGraph } = await vite.ssrLoadModule("/src/lib/content/schema.ts"));
  ({ resolveDailyEditorial } = await vite.ssrLoadModule("/src/lib/content/daily-editorial.ts"));
  ({ assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts"));
});
after(async () => {
  await vite?.close();
  globalThis.fetch = originalFetch;
  assert.equal(networkAttempts, 0);
});

test("inactive candidate preserves the frozen base except the declared source changes", async () => {
  validateContentGraph(candidate);
  assert.equal(candidate.version, "0.9.0-editorial-pilot.1");
  assert.equal(candidate.schemaVersion, 6);
  assert.equal(hash(baseline.bundle.value), expectedBaseHash);
  const data = await json("src/lib/content/editorial-candidate-data.json");
  assert.equal(data.baseline.sha256, expectedBaseHash);
  assert.deepEqual(data.baseline.value, baseline.bundle.value);
  const changed = new Set(data.sourceChanges.interpretations.map((entry) => entry.key));
  assert.deepEqual([...changed], []);
  for (const source of baseline.bundle.value.cycles)
    if (!changed.has(source.key))
      assert.deepEqual(
        candidate.cycles.find((entry) => entry.key === source.key),
        source,
        source.key,
      );
  for (const family of ["phases", "natal", "domains", "natalLenses", "transitChapters"])
    assert.deepEqual(candidate[family], baseline.bundle.value[family], family);
  assert.equal(candidate.cycles.length, baseline.bundle.value.cycles.length + 1);
  assert.deepEqual(candidate.synthesisRules, baseline.bundle.value.synthesisRules);
  assert.equal(candidate.dailyEditorial.frames.length, 5);
  assert.deepEqual(candidate.dailyWritingFrames, baseline.bundle.value.dailyWritingFrames);
});

test("family imagery cannot be selected for another aspect or borrowed by generic Neptune fallback", () => {
  const context = { day: "2026-10-11", tone: "warm", depth: "standard" };
  const geometry = (cycle_key, transit_body, aspect, natal_point) => ({
    cycle_key,
    transit_body,
    aspect,
    natal_point,
  });
  const trine = resolveInterpretationPlan(candidate, [
    geometry("jupiter_trine_sun", "jupiter", "trine", "sun"),
  ]);
  assert.equal(
    resolveDailyEditorial(candidate, trine, context).entry.source.key,
    "soft:jupiter:sun",
  );
  const sextile = resolveInterpretationPlan(candidate, [
    geometry("jupiter_sextile_sun", "jupiter", "sextile", "sun"),
  ]);
  assert.equal(sextile.interpretations[0].interpretationKey, "soft:jupiter:sun");
  assert.equal(resolveDailyEditorial(candidate, sextile, context), null);
  const generic = resolveInterpretationPlan(candidate, [
    geometry("neptune_opposition_mercury", "neptune", "opposition", "mercury"),
  ]);
  assert.equal(generic.interpretations[0].interpretationKey, "hard:*:*");
  assert.equal(resolveDailyEditorial(candidate, generic, context), null);
  assert.equal(resolveDailyEditorial(candidate, trine, { ...context, tone: "plain" }), null);
  assert.equal(resolveDailyEditorial(candidate, trine, { ...context, depth: "technical" }), null);
});

test("four quiet civil days select distinct source-free entries with a stable first benchmark", () => {
  const plan = resolveInterpretationPlan(candidate, []);
  const selections = [11, 12, 13, 14].map((day) =>
    resolveDailyEditorial(candidate, plan, {
      day: `2026-10-${day}`,
      tone: "warm",
      depth: "standard",
    }),
  );
  assert.deepEqual(
    selections.map((selected) => selected.entry.key),
    candidate.dailyEditorial.quiet.map((entry) => entry.key),
  );
  for (const selected of selections) {
    assert.equal(selected.mode, "quiet");
    assert.deepEqual(selected.requiredFacts, []);
    assert.equal(selected.entry.source, undefined);
    assert.equal(selected.entry.writingMaterial.imagery, null);
  }
});

test("application assembly renders all six selected authored fallbacks and preserves historical baseline output", async () => {
  const drafts = await json("docs/reviews/daily-reading-editorial/2026-10-15/drafts.json");
  for (const [index, saved] of baseline.cases.entries()) {
    const input = structuredClone(saved.effectiveInput);
    const context = { ...input.context, day: input.day, granted: new Set(input.context.granted) };
    const assembled = assembleReading(input.chart, input.cycles, context, candidate, null, null);
    const selected = assembled.writingPlan.editorial;
    assert.ok(selected, saved.id);
    assert.equal(assembled.headline, drafts.cases[index].headline, saved.id);
    assert.equal(assembled.prompt, drafts.cases[index].prompt, saved.id);
    assert.equal(assembled.astroBody, drafts.cases[index].paragraphs.join("\n\n"), saved.id);
    const facts = readingFacts(input.chart, assembled, input.timeZone);
    assert.ok(!facts.some((fact) => ["N1", "A1", "P2"].includes(fact.id)), saved.id);
    if (index === 5) assert.ok(!facts.some((fact) => ["I1", "S1", "C1"].includes(fact.id)));
    const legacy = assembleReading(
      input.chart,
      input.cycles,
      context,
      baseline.bundle.value,
      null,
      null,
    );
    assert.deepEqual(
      { headline: legacy.headline, body: legacy.body, prompt: legacy.prompt },
      {
        headline: saved.reading.headline,
        body: saved.reading.body,
        prompt: saved.reading.prompt,
      },
      saved.id,
    );
  }
});

test("five contact cases keep their identities except the newly authored exact Neptune source", () => {
  const expected = [
    ["conjunction:mercury:mercury"],
    ["opposition:venus:venus"],
    ["square:saturn:sun", "trine:jupiter:mars"],
    ["soft:jupiter:sun"],
    ["square:neptune:mercury"],
  ];
  for (const [index, entry] of baseline.cases.slice(0, 5).entries()) {
    const cycles = entry.effectiveInput.cycles.filter((cycle) =>
      entry.interpretationPlan.interpretations.some(
        (source) => source.cycleKey === cycle.cycle_key,
      ),
    );
    const plan = resolveInterpretationPlan(candidate, cycles);
    assert.deepEqual(
      plan.interpretations.map((source) => source.interpretationKey),
      expected[index],
      entry.id,
    );
    if (entry.id === "synthesis-tension") {
      assert.equal(plan.synthesis.ruleKey, "square:saturn:sun_tension_trine:jupiter:mars");
      assert.deepEqual(plan.synthesis.dependsOn, ["C1", "I1", "C2", "I2"]);
      assert.equal(plan.synthesis.relationship, "tension");
      assert.match(plan.synthesis.mechanism, /can increase the structure needed/);
    }
  }
  assert.equal(
    findInterpretation(candidate, "square", "neptune", "mercury").key,
    "square:neptune:mercury",
  );
  assert.equal(findInterpretation(candidate, "opposition", "neptune", "mercury").key, "hard:*:*");
  assert.equal(findInterpretation(candidate, "square", "neptune", "sun").key, "hard:neptune:sun");
  const jupiter = candidate.dailyEditorial.frames.find(
    (frame) => frame.source.key === "soft:jupiter:sun",
  );
  assert.deepEqual(jupiter.cycleKeys, ["jupiter_trine_sun"]);
  assert.ok(!candidate.cycles.some((source) => source.key === "trine:jupiter:sun"));
});

test("source material and source-free quiet repertoire retain separately validated headlines and reflections", async () => {
  const drafts = await json("docs/reviews/daily-reading-editorial/2026-10-15/drafts.json");
  for (const [index, frame] of candidate.dailyEditorial.frames.entries()) {
    assert.equal(frame.headline, drafts.cases[index].headline);
    assert.equal(frame.reflection, drafts.cases[index].prompt);
    assert.deepEqual(frame.fallbackParagraphs, drafts.cases[index].paragraphs);
    assert.deepEqual(Object.keys(frame.writingMaterial), [
      "meaning",
      "scene",
      "imagery",
      "direction",
      "reflection",
    ]);
    assert.ok(frame.constraints.length);
    assert.ok(!Object.hasOwn(frame, "evidence"));
  }
  const quiet = candidate.dailyEditorial.quiet;
  assert.equal(quiet.length, 4);
  assert.equal(new Set(quiet.map((entry) => entry.key)).size, 4);
  assert.equal(new Set(quiet.map((entry) => entry.headline)).size, 4);
  assert.equal(new Set(quiet.map((entry) => entry.writingMaterial.direction)).size, 4);
  assert.deepEqual(quiet[0].fallbackParagraphs, drafts.cases[5].paragraphs);
  for (const entry of quiet) {
    assert.equal(entry.writingMaterial.imagery, null);
    assert.equal(entry.source, undefined);
    assert.equal(entry.cycleKeys, undefined);
    assert.ok(
      !/\b(?:planet|transit|natal|chart signal)\b/i.test(entry.fallbackParagraphs.join(" ")),
    );
  }
});
