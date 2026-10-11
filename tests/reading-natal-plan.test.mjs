import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples, natalCycle, natalContext } from "./helpers/natal-fixtures.mjs";
let h, chartModule, bundle, reliability, readingModule;
before(async () => {
  h = await createRecordsHarness();
  chartModule = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  ({ NATAL_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
  reliability = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.ts");
  readingModule = await h.vite.ssrLoadModule("/src/lib/reading.server.ts");
});
after(async () => h?.close());
function reading(options = {}, content = bundle, cycles = [natalCycle()]) {
  const samples = syntheticNatalSamples(chartModule, h.ephemerisModule, options);
  return readingModule.assembleReading(
    samples[1].chart,
    cycles,
    natalContext,
    content,
    reliability.assessNatalReliability(
      samples,
      "synthetic-fingerprint",
      options.accuracy ?? "exact",
    ),
  );
}
const moonContact = () =>
  natalCycle({
    natal_point: "moon",
    cycle_key: "saturn_square_moon",
    label: "Saturn square Moon",
    domain: "inner-life",
  });
test("transited_body_sign_leads_over_every_moon_rule", () => {
  // Aries Sun, Capricorn Moon trine Saturn and an exact Placidus house all qualify.
  const result = reading();
  assert.equal(result.natalLensPlan.version, "daily-natal-lens-2");
  assert.equal(result.natalLensPlan.lens.ruleKey, "nl-sun-01");
  assert.deepEqual(result.natalLensPlan.lens.dependsOn, ["C1", "I1"]);
  assert.equal(result.astroBody.split(result.natalLensPlan.lens.mechanism).length, 2);
  assert.deepEqual(
    result.natalLensPlan.lens.evidence.map((e) => `${e.kind}:${e.body}`),
    ["sign:sun"],
  );
});
test("moon_contact_uses_the_most_specific_moon_rule", () => {
  assert.equal(
    reading({}, bundle, [moonContact()]).natalLensPlan.lens.ruleKey,
    "nl-moon-10-aspect-01",
  );
  assert.equal(
    reading({ aspects: false }, bundle, [moonContact()]).natalLensPlan.lens.ruleKey,
    "nl-moon-10-house-01",
  );
  assert.equal(
    reading({ accuracy: "hour", aspects: false }, bundle, [moonContact()]).natalLensPlan.lens
      .ruleKey,
    "nl-moon-10",
  );
});
test("unscreened_target_sign_falls_back_to_the_specific_moon_rule", () => {
  const sun = [29.5, 15, 15];
  assert.equal(reading({ sun }).natalLensPlan.lens.ruleKey, "nl-moon-10-aspect-01");
  assert.equal(
    reading({ sun, accuracy: "near", aspects: false }).natalLensPlan.lens.ruleKey,
    "nl-moon-10",
  );
  const withoutSunCopy = {
    ...bundle,
    natalLenses: bundle.natalLenses.filter((rule) => rule.key !== "nl-sun-01"),
  };
  assert.equal(reading({}, withoutSunCopy).natalLensPlan.lens.ruleKey, "nl-moon-10-aspect-01");
});
test("unscreened_moon_never_blocks_the_target_sign", () => {
  assert.equal(
    reading({ moon: [0.999, 15, 15], accuracy: "near", aspects: false }).natalLensPlan.lens.ruleKey,
    "nl-sun-01",
  );
});
test("target_compound_rule_is_eligible_and_leads_its_own_sign", () => {
  const compound = {
    key: "sun-aries-house-9",
    role: "self_direction",
    anchorNatalPoints: ["sun"],
    selectors: [
      { kind: "sign", body: "sun", sign: "Aries" },
      { kind: "house", body: "sun", house: 9 },
    ],
    mechanism:
      "Starting something yourself can offer a wider sense of direction. If a plan has stalled, a first step may differ from settling its whole route.",
  };
  const content = { ...bundle, natalLenses: [...bundle.natalLenses, compound] };
  const result = reading({}, content);
  assert.equal(result.natalLensPlan.lens.ruleKey, "sun-aries-house-9");
  assert.deepEqual(
    result.natalLensPlan.lens.evidence.map((e) => e.kind),
    ["sign", "house"],
  );
  const samples = syntheticNatalSamples(chartModule, h.ephemerisModule);
  h.factsModule.assertNatalLensFact(
    h.factsModule.readingFacts(samples[1].chart, result),
    result.natalLensPlan,
  );
});
test("missing_copy_never_infers_a_lens", () => {
  assert.equal(reading({}, { ...bundle, natalLenses: [] }).natalLensPlan.status, "unmatched");
  assert.equal(reading({}, { ...bundle, cycles: [] }).natalLensPlan.status, "no_interpretation");
});
test("quiet_or_unsupported_target_has_no_lens", () => {
  assert.equal(reading({}, bundle, []).natalLensPlan.status, "no_cycle");
  assert.equal(
    reading({}, bundle, [natalCycle({ natal_point: "saturn", cycle_key: "saturn_square_saturn" })])
      .natalLensPlan.status,
    "unsupported_anchor",
  );
  assert.equal(reading({ accuracy: "unknown" }).natalLensPlan.status, "unreliable");
});
test("raw_orb_bound_and_fixed_codepoint_ties_are_deterministic", () => {
  assert.equal(
    reading({ saturn: [168.004, 168.004, 168.004], accuracy: "near" }, bundle, [moonContact()])
      .natalLensPlan.lens.ruleKey,
    "nl-moon-10",
  );
  const extra = {
    ...bundle.natalLenses.find((r) => r.key === "nl-moon-10-aspect-01"),
    key: "A-first",
  };
  const shuffled = { ...bundle, natalLenses: [extra, ...[...bundle.natalLenses].reverse()] };
  assert.equal(reading({}, shuffled, [moonContact()]).natalLensPlan.lens.ruleKey, "A-first");
});
test("joint_synthesis_natal_plan_preserves_primary_question_and_no_lens_output", () => {
  const cycles = [
    natalCycle(),
    natalCycle({
      transit_body: "jupiter",
      aspect: "trine",
      natal_point: "mars",
      cycle_key: "jupiter_trine_mars",
      importance: 0.5,
    }),
  ];
  const result = reading({}, bundle, cycles);
  assert.equal(result.interpretationPlan.pairStatus, "selected");
  assert.equal(result.natalLensPlan.status, "selected");
  const samples = syntheticNatalSamples(chartModule, h.ephemerisModule);
  const legacy = readingModule.assembleReading(samples[1].chart, cycles, natalContext, bundle);
  assert.equal(result.prompt, legacy.prompt);
  assert.equal(result.headline, legacy.headline);
  assert.equal(result.confidence, legacy.confidence);
  assert.equal(reading({}, { ...bundle, natalLenses: [] }, cycles).body, legacy.body);
});
