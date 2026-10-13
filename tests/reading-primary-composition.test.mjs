import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let vite, prepare, assemble, bundle, cases;
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
  ({ prepareSyntheticEvaluationCase: prepare } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ assembleReading: assemble } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
  const pair = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  bundle = pair.bundles.candidate;
  cases = pair.caseManifest.cases;
});
after(async () => vite?.close());

test("all pilot sources keep exactly their own question across every tone and depth", () => {
  for (const fixed of cases)
    for (const tone of ["plain", "warm", "clinical"])
      for (const depth of ["standard", "technical"]) {
        const prepared = prepare(fixed.id, bundle, undefined, "draft-pilot-1");
        const reading = assemble(
          prepared.chart,
          prepared.cycles,
          { ...context, tone, depth },
          bundle,
        );
        const source = bundle.cycles.find(
          (entry) => entry.key === reading.editorial.interpretation.key,
        );
        assert.equal(reading.prompt, source.question, `${fixed.id}/${tone}/${depth}`);
        assert.equal(reading.astroPrompt, source.question);
        assert.equal((reading.prompt.match(/\?/g) ?? []).length, 1);
      }
});

test("schema-4 wellness context never appends a second premise to the source question", () => {
  const prepared = prepare(cases[0].id, bundle, undefined, "draft-pilot-1");
  const reading = assemble(
    prepared.chart,
    prepared.cycles,
    {
      ...context,
      granted: new Set([...context.granted, "WEL-01", "WEL-03"]),
      wellness: { sleep: 1, stress: 5 },
    },
    bundle,
  );
  assert.equal(
    reading.prompt,
    "Where, if anywhere, is your preferred pace out of step with the task?",
  );
  assert.ok(reading.contextBody.includes("sleep 1/5 and stress 5/5"));
});

test("a quiet schema-4 day uses a single safe fallback without inherited framing", () => {
  const prepared = prepare("quiet-threshold", bundle, undefined, "draft-fallback-2");
  for (const tone of ["plain", "warm", "clinical"])
    for (const depth of ["standard", "technical"]) {
      const reading = assemble(
        prepared.chart,
        prepared.cycles,
        { ...context, tone, depth },
        bundle,
      );
      assert.equal(reading.prompt, "What, if anything, has your attention today?");
    }
});

test("missing or malformed source questions use one safe domain fallback", () => {
  const fixed = cases.find((f) => f.id.includes("uranus"));
  const prepared = prepare(fixed.id, bundle, undefined, "draft-pilot-1");
  for (const question of ["", "Two questions? Another?", "Reflection: Choose a label?"]) {
    const changed = structuredClone(bundle);
    changed.cycles.find((e) => e.key === "hard:uranus:*").question = question;
    const reading = assemble(prepared.chart, prepared.cycles, context, changed);
    assert.equal(
      reading.prompt,
      "What, if anything, would you like to notice about how you describe yourself?",
    );
    assert.doesNotMatch(reading.prompt, /out of date/);
  }
});

test("templates omit inherited shared phase filler and mechanical tone labels while retaining source meaning", () => {
  for (const fixed of cases)
    for (const tone of ["plain", "warm", "clinical"]) {
      const prepared = prepare(fixed.id, bundle, undefined, "draft-pilot-1");
      const reading = assemble(prepared.chart, prepared.cycles, { ...context, tone }, bundle);
      assert.doesNotMatch(
        reading.astroBody,
        /Taking this gently:|Observation:|If a demand catches your attention/,
      );
      assert.ok(reading.astroBody.includes(reading.editorial.interpretation.mechanism));
      assert.ok(reading.astroBody.includes("exact in 3 days"));
    }
});

test("distinct authored phase copy is preserved instead of being suppressed wholesale", () => {
  const prepared = prepare(cases[0].id, bundle, undefined, "draft-pilot-1");
  const changed = structuredClone(bundle);
  changed.phases.approaching = "A draft can leave a place for an unfinished detail.";
  const reading = assemble(prepared.chart, prepared.cycles, context, changed);
  assert.ok(reading.astroBody.includes(changed.phases.approaching));
});

test("technical fallback ties current orb and approach to the named aspect", () => {
  const prepared = prepare("fallback-soft-saturn-mercury", bundle, undefined, "draft-pilot-1");
  assert.match(
    prepared.assembled.astroBody,
    /Saturn's sextile to natal Mercury is approaching exactness; its current aspect orb is 0\.42 degrees\./,
  );
  assert.doesNotMatch(prepared.assembled.astroBody, /Saturn is approaching natal Mercury/);
});
