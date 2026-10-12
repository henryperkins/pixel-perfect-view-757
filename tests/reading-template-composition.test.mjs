import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";

let h, assemble, bundle, natalBundle, reliability, localDay;
before(async () => {
  h = await createRecordsHarness();
  ({ assembleReading: assemble } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ DEFAULT_BUNDLE: bundle } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
  ({ NATAL_CANDIDATE_BUNDLE: natalBundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
  ({ syntheticNatalReliability: reliability } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.natal.ts",
  ));
  localDay = await h.vite.ssrLoadModule("/src/lib/local-day.ts");
});
after(async () => h?.close());

function warmReading(selectedBundle = bundle, context = {}) {
  const fixed = READING_EVAL_CASES.find((row) => row.id === "saturn-square-moon-warm");
  const cycles = fixed.cycles.map((cycle) => ({
    ...cycle,
    days_to_exact: localDay.daysToLocalDate(
      cycle.exact_at,
      fixed.config.day,
      fixed.config.timeZone,
    ),
  }));
  return assemble(
    fixed.chart,
    cycles,
    {
      ...fixed.config,
      granted: new Set(fixed.config.granted),
      localBucket: null,
      checkIn: null,
      wellness: null,
      ...context,
    },
    selectedBundle,
    reliability(fixed),
  );
}

test("warm Moon fallback develops its scene once before naming the contact's tension", () => {
  for (const selectedBundle of [bundle, natalBundle]) {
    const result = warmReading(selectedBundle);
    assert.equal(result.natalLensPlan.lens, null);
    const [scene, meaning] = result.astroBody.split("\n\n");
    assert.match(scene, /calendar/);
    assert.match(scene, /quiet moment|unclaimed hour/);
    assert.doesNotMatch(meaning, /calendar|quiet moment|unclaimed hour|unfinished|next task/);
    assert.match(meaning, /Saturn.*Moon/);
    assert.match(meaning, /feel responsible for/);
    assert.match(meaning, /uninterrupted space/);
    assert.deepEqual(result.flagged, []);
  }
});

test("warm Moon fallback invites a possible scene without an instruction-like tone preface", () => {
  const warm = warmReading();
  assert.doesNotMatch(warm.astroBody, /Taking this gently:|Observation:/);
  assert.match(warm.astroBody.split("\n\n")[0], /You might picture/);
  const plain = warmReading(bundle, { tone: "plain" });
  assert.equal(warm.headline, plain.headline);
  assert.equal(warm.prompt, plain.prompt);
  assert.equal(warm.confidence, plain.confidence);
  assert.deepEqual(warm.eligibleCycles, plain.eligibleCycles);
  assert.deepEqual(warm.editorial, plain.editorial);
});

test("an edited source condition is retained instead of applying the old warm composition", () => {
  for (const field of ["interpretation", "domain"]) {
    const changed = structuredClone(bundle);
    const condition = "This comparison applies only after the task has been named.";
    const item = changed.cycles.find((row) => row.key === "hard:saturn:moon");
    if (field === "interpretation") item.mechanism += ` ${condition}`;
    else changed.domains["inner-life"].hard += ` ${condition}`;
    const result = warmReading(changed);
    assert.ok(result.astroBody.includes(condition), field);
    assert.ok(result.astroBody.includes(item.mechanism), field);
    assert.ok(result.astroBody.includes(changed.domains["inner-life"].hard), field);
    assert.equal(h.gatewayRequests.length, 0);
    assert.equal(h.swissRequests.length, 0);
  }
});

test("warm Moon composition keeps technical timing and respects tone consent", () => {
  const standard = warmReading();
  const technical = warmReading(bundle, { depth: "technical" });
  assert.deepEqual(
    technical.astroBody.split("\n\n").slice(0, 2),
    standard.astroBody.split("\n\n").slice(0, 2),
  );
  assert.match(technical.astroBody, /Current orb at the reading's calculation time: 0\.42°\./);
  assert.match(technical.astroBody, /This reading falls in the middle part/);
  const denied = warmReading(bundle, { granted: new Set() });
  assert.equal(denied.astroBody, warmReading(bundle, { tone: "plain" }).astroBody);
  assert.doesNotMatch(denied.astroBody, /You might picture/);
});
