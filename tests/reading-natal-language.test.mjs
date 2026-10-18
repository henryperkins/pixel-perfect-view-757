import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples, natalCycle, natalContext } from "./helpers/natal-fixtures.mjs";
let h, assembled, facts, language, factsModule;
before(async () => {
  h = await createRecordsHarness();
  const chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  const reliability = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.ts");
  const { NATAL_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  const { assembleReading } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts");
  assembled = assembleReading(
    samples[1].chart,
    [natalCycle()],
    natalContext,
    NATAL_CANDIDATE_BUNDLE,
    reliability.assessNatalReliability(samples, "synthetic-fingerprint", "exact"),
  );
  factsModule = h.factsModule;
  facts = factsModule.readingFacts(samples[1].chart, assembled);
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
after(async () => h?.close());
const draft = (
  text = "Dependable structure can offer support for a manageable commitment. Useful support may differ from taking on every obligation.",
  ids = ["N1", "C1", "I1"],
) => ({
  paragraphs: [
    {
      text: "A responsibility can ask for more effort than its scope suggests. A clear boundary offers a comparison for this contact.",
      facts: ["C1", "I1"],
    },
    { text, facts: ids },
  ],
});
async function generate(candidate) {
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify(candidate) } }] }),
  );
  return language.generateReadingProse({
    facts,
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: { headline: assembled.headline, body: assembled.astroBody, prompt: assembled.prompt },
  });
}
test("natal_fact_has_published_copy_and_private_origin", () => {
  const fact = facts.find((f) => f.id === "N1");
  assert.ok(fact);
  assert.equal(
    fact.statement,
    `Published natal lens, an interpretive possibility: ${assembled.natalLensPlan.lens.mechanism}`,
  );
  assert.deepEqual(fact.dependsOn, ["C1", "I1"]);
  assert.equal(fact.natalEvidenceId, "NL1");
  assert.equal(fact.cycle, undefined);
  factsModule.assertNatalLensFact(facts, assembled.natalLensPlan);
});
test("natal_requires_first_two_paragraph_coverage", async () => {
  assert.equal((await generate(draft())).meta.mode, "model");
  const missing = draft();
  missing.paragraphs[1].facts = ["C1", "I1"];
  assert.equal((await generate(missing)).meta.diagnostics.code, "natal_coverage");
  assert.equal(
    (await generate(draft(undefined, ["N1", "C1"]))).meta.diagnostics.code,
    "dependencies",
  );
});
test("natal_does_not_expand_geometry_permission_and_claim_checks_are_bounded", async () => {
  for (const [text, code] of [
    ["Your Moon in Capricorn shapes your response.", "placement"],
    ["Your Moon trine Saturn offers structure.", "body"],
    ["Natal Saturn square natal Sun describes your response.", "placement"],
    ["Your nervous system is designed for responsibility.", "natal_claim"],
    ["You always carry every obligation.", "natal_claim"],
  ])
    assert.equal((await generate(draft(text))).meta.diagnostics.code, code);
  assert.equal(
    (
      await generate(
        draft(
          "If you recognize this response, a manageable commitment can offer a useful distinction.",
        ),
      )
    ).meta.mode,
    "model",
  );
});
test("natal_dependencies_and_release_fail_closed_before_provider_traffic", async () => {
  for (const change of [
    { releaseVersion: "wrong" },
    { natalEvidenceId: "NL2" },
    { dependsOn: ["C2", "I2"] },
    { id: "N2" },
    { cycle: facts[0].cycle },
  ]) {
    const malformed = facts.map((f) => (f.id === "N1" ? { ...f, ...change } : f));
    assert.throws(() => factsModule.assertNatalLensFact(malformed, assembled.natalLensPlan));
    assert.throws(() => factsModule.assertDailyFactGraph(malformed));
  }
});
test("complete_provider_request_contains_only_curated_natal_statement", async () => {
  await generate(draft());
  const request = JSON.stringify(h.gatewayRequests.at(-1));
  const lens = assembled.natalLensPlan.lens;
  assert.ok(request.includes(lens.mechanism));
  assert.equal(lens.ruleKey, "nl-sun-01");
  for (const secret of [
    lens.ruleKey,
    "nl-sun",
    "nl-moon",
    lens.evidence[0].sign,
    "Capricorn",
    lens.role,
    "emotional_reflex",
    "marginsDeg",
    "sampleEngines",
    "longitudes",
    "synthetic-fingerprint",
    "NL1",
    "natalEvidenceId",
  ])
    assert.ok(!request.includes(secret), secret);
  assert.match(h.gatewayRequests.at(-1).messages[1].content, /N1.*C1.*I1/);
});
test("rejection_uses_same_lens_aware_template_once", async () => {
  const before = h.gatewayRequests.length;
  const result = await generate({ paragraphs: [] });
  assert.equal(result.body, assembled.astroBody);
  assert.equal(result.prompt, assembled.prompt);
  assert.equal(h.gatewayRequests.length, before + 1);
});
test("captured prompt requires scene application and preserves directional conditions", async () => {
  await generate(draft());
  const [system, user] = h.gatewayRequests.at(-1).messages;
  assert.match(
    system.content,
    /same task, obligation, exchange or choice must carry both meanings/,
  );
  assert.match(system.content, /does not prove that a boundary is needed/);
  assert.match(user.content, /do not simply append N1 verbatim/);
  assert.doesNotMatch(user.content, /keeping its sentences in their published order/);
  assert.match(user.content, /Select and paraphrase the distinct detail N1 contributes/);
  assert.match(user.content, /Preserve the condition and claim strength of each claim you use/);
  assert.match(user.content, /do not merge different conditions or invent a causal bridge/);
  assert.match(user.content, /N1 distinction must not be made to cause or establish it/);
  assert.match(user.content, /retain that condition on reinforcement/);
  assert.match(user.content, /do not say the aim causes low friction/);
  assert.match(user.content, /conditional on action lining up with what matters/);
  assert.match(user.content, /returned attention does not therefore sharpen curiosity/);
  assert.match(user.content, /direction and qualification are explicit in the source/);
  // This is evidence of the delivered brief, not a semantic acceptance test.
  const diagnostics = (await generate(draft())).meta.diagnostics;
  assert.equal(diagnostics.promptVersion, "daily-astro-body-19");
  assert.equal(diagnostics.validatorVersion, "daily-reference-10");
});
test("request_without_a_lens_keeps_the_pre_lens_brief", async () => {
  const voice = await h.vite.ssrLoadModule("/src/lib/ai/daily-voice.ts");
  const plain = facts.filter((f) => f.id !== "N1");
  h.setGateway(() =>
    Response.json({
      choices: [{ message: { content: JSON.stringify(draft(undefined, ["C1", "I1"])) } }],
    }),
  );
  await language.generateReadingProse({
    facts: plain,
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: { headline: assembled.headline, body: assembled.astroBody, prompt: assembled.prompt },
  });
  const [system, user] = h.gatewayRequests.at(-1).messages;
  assert.equal(system.content, voice.DAILY_SYSTEM_VOICE);
  for (const text of [system.content, user.content])
    assert.ok(!/N1|natal lens|temperament/i.test(text), text);
  await generate(draft());
  const natal = h.gatewayRequests.at(-1).messages;
  assert.equal(natal[0].content, voice.dailySystemVoice(true));
  assert.ok(natal[0].content.startsWith(voice.DAILY_SYSTEM_VOICE));
  assert.match(natal[1].content, /N1/);
});
test("joint_synthesis_and_natal_lenses_can_share_paragraph_two", async () => {
  const { NATAL_CANDIDATE_BUNDLE: DEFAULT_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  const { assembleReading } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts");
  const chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  const screen = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.ts");
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  const combined = assembleReading(
    samples[1].chart,
    [
      natalCycle(),
      natalCycle({
        cycle_key: "jupiter_trine_mars",
        transit_body: "jupiter",
        natal_point: "mars",
        aspect: "trine",
        importance: 0.5,
      }),
    ],
    natalContext,
    DEFAULT_BUNDLE,
    screen.assessNatalReliability(samples, "synthetic-fingerprint", "exact"),
  );
  const inputFacts = factsModule.readingFacts(samples[1].chart, combined);
  const candidate = draft(
    "Giving a plan more scope can increase the structure needed to carry it. Useful dependable support may differ from taking on every obligation.",
    ["S1", "N1", "C1", "I1", "C2", "I2"],
  );
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify(candidate) } }] }),
  );
  const result = await language.generateReadingProse({
    facts: inputFacts,
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: { headline: combined.headline, body: combined.astroBody, prompt: combined.prompt },
  });
  assert.equal(result.meta.mode, "model", result.meta.reason);
});
