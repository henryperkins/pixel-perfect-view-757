import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { analyticEpisode } from "./fixtures/transit-episodes/analytic.mjs";
import { syntheticNatalSamples, natalContext } from "./helpers/natal-fixtures.mjs";
import { transitImperatives } from "./fixtures/transit-imperatives.mjs";
let h, m, a, f, l, b, chart;
before(async () => {
  h = await createRecordsHarness();
  m = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.ts");
  a = await h.vite.ssrLoadModule("/src/lib/reading.server.ts");
  f = await h.vite.ssrLoadModule("/src/lib/ai/facts.ts");
  l = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  b = (await h.vite.ssrLoadModule("/src/lib/content/transit-candidate-bundle.ts"))
    .TRANSIT_CANDIDATE_BUNDLE;
  chart = syntheticNatalSamples(
    await h.vite.ssrLoadModule("/src/lib/astro/chart.ts"),
    h.ephemerisModule,
  )[1].chart;
});
after(async () => h?.close());
function setup(options = {}) {
  const x = analyticEpisode(options),
    cal = m.resolveDailyTransitCalculation(x.scan, x.anchor, x.primary, x.day, x.timezone),
    assembled = a.assembleReading(chart, [x.primary], natalContext, b, null, cal);
  return { assembled, facts: f.readingFacts(chart, assembled), cal };
}
async function generate(s, paragraphs) {
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] }),
  );
  return l.generateReadingProse({
    facts: s.facts,
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: { headline: "test", body: s.assembled.astroBody, prompt: "Reflect?" },
  });
}
const candidate = (s) => [
  {
    text: `A responsibility can need clearer limits. ${s.assembled.transitStoryPlan.chronologySentence}`,
    facts: ["C1", "I1", "A1"],
  },
  { text: s.assembled.transitStoryPlan.copy.mechanism, facts: ["C1", "I1", "A1", "P2"] },
];
test("arc_payload_contains_no_scan_or_birth_data_and_requires_exact_parents", () => {
  const s = setup(),
    a1 = s.facts.find((f) => f.id === "A1");
  assert.ok(a1);
  assert.deepEqual(a1.dependsOn, ["C1"]);
  assert.deepEqual(s.facts.find((f) => f.id === "P2").dependsOn, ["C1", "I1", "A1"]);
  const raw = JSON.stringify(s.facts);
  for (const privateText of [
    "analytic-private",
    "native-private",
    "component-private",
    "unwrappedLongitude",
    "sampleOffsetsMinutes",
    "returnedFlags",
  ])
    assert.ok(!raw.includes(privateText));
  assert.ok(raw.includes("pass-1"));
  const broken = structuredClone(s.facts);
  broken.find((f) => f.id === "P2").dependsOn = ["C1"];
  assert.throws(() => f.assertDailyFactGraph(broken));
});
test("chronology_is_copied_once_in_first_two_paragraphs", async () => {
  const s = setup();
  assert.equal((await generate(s, candidate(s))).meta.mode, "model");
  for (const mutate of [
    (p) => (p[0].text = p[0].text.replace("second", "third")),
    (p) => (p[1].text += " " + s.assembled.transitStoryPlan.chronologySentence),
    (p) => (p[0].facts = ["C1", "I1"]),
  ]) {
    const p = candidate(s);
    mutate(p);
    assert.equal((await generate(s, p)).meta.mode, "template");
  }
});
test("historical transit imperatives reject the entire draft and use the safe template", async () => {
  const s = setup();
  for (const text of transitImperatives) {
    const paragraphs = candidate(s);
    paragraphs[1].text = text;
    const output = await generate(s, paragraphs);
    assert.equal(output.meta.diagnostics.code, "safety", text);
    assert.equal(output.meta.mode, "template", text);
    assert.equal(output.body, s.assembled.astroBody);
    assert.ok(!output.body.includes("[removed:"));
  }
});
test("extra_counts_dates_biography_and_promised_resolution_fall_back_as_a_whole", async () => {
  const s = setup({ count: 5, index: 3 });
  for (const extra of [
    "This is the second of three contacts.",
    "The last pass guarantees resolution.",
    "Your relationship ended in May 2025.",
    "The station was exact on 2026-01-01.",
  ]) {
    const p = candidate(s);
    p[1].text += " " + extra;
    assert.equal((await generate(s, p)).meta.mode, "template");
  }
});
test("omitted_arc_cannot_invent_passes", async () => {
  const s = setup();
  s.facts = s.facts.filter((f) => !["A1", "P2"].includes(f.id));
  const p = [
    { text: "This is the second of three calculated contacts.", facts: ["C1", "I1"] },
    { text: "A responsibility can have a clearer scope.", facts: ["C1", "I1"] },
  ];
  assert.equal((await generate(s, p)).meta.diagnostics.code, "arc_claim");
});
test("return_and_passage_counts_fail_with_selected_or_omitted_story", async () => {
  const selected = setup(),
    omitted = setup();
  omitted.facts = omitted.facts.filter((f) => !["A1", "P2"].includes(f.id));
  for (const text of [
    "This is the third return of this transit.",
    "This is the final return of this transit.",
    "This is the final calculated passage.",
    "There are three returns in this transit.",
  ]) {
    for (const [state, paragraphs] of [
      [
        omitted,
        [
          { text: "A responsibility can need clearer limits.", facts: ["C1", "I1"] },
          { text, facts: ["C1", "I1"] },
        ],
      ],
      [
        selected,
        [
          candidate(selected)[0],
          { text: stateText(selected, text), facts: ["C1", "I1", "A1", "P2"] },
        ],
      ],
    ]) {
      const out = await generate(state, paragraphs);
      assert.equal(out.meta.mode, "template", text);
      assert.equal(out.meta.diagnostics.code, "arc_claim");
    }
  }
  function stateText(s, text) {
    return `${s.assembled.transitStoryPlan.copy.mechanism} ${text}`;
  }
});
