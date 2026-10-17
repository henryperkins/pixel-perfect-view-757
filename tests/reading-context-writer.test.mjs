import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, language, packet;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  packet = await readContextBenchmarks();
});
beforeEach(async () => h.reset());
after(async () => h?.close());

const gatewayResponse = (paragraphs) =>
  Response.json({
    choices: [{ message: { content: JSON.stringify({ paragraphs }) } }],
  });
async function run(benchmark, mutate = () => {}, overrides = {}, provider = "lovable") {
  const { input } = await contextWritingFixture(h, benchmark, overrides);
  const paragraphs = structuredClone(benchmark.paragraphs);
  mutate(paragraphs);
  h.setGateway(() => gatewayResponse(paragraphs));
  h.setGeminiEnterprise(() =>
    Response.json({
      candidates: [
        { content: { parts: [{ text: JSON.stringify({ paragraphs }) }] }, finishReason: "STOP" },
      ],
    }),
  );
  return language.generateSyntheticReadingProse(input, provider, {}, benchmark);
}

// Catches choosing the legacy writer or filtering away selected natal/story facts.
test("candidate composes all five complete source graphs and keeps their independent headline/reflection", async () => {
  for (const benchmark of packet.cases) {
    const result = await run(benchmark);
    assert.equal(result.prose.meta.mode, "model", benchmark.id);
    assert.equal(result.prose.meta.diagnostics.promptVersion, "daily-context-body-1", benchmark.id);
    assert.equal(result.prose.meta.diagnostics.validatorVersion, "daily-context-reference-1");
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
    assert.equal(result.prose.headline, benchmark.headline);
    assert.equal(result.prose.prompt, benchmark.reflection);
    assert.equal(result.prose.meta.diagnostics.attempted, true);
    const cited = new Set(result.prose.meta.citations.slice(0, 2).flatMap((p) => p.facts));
    for (const id of benchmark.requiredFacts) assert.ok(cited.has(id), `${benchmark.id}: ${id}`);
  }
  assert.equal(h.gatewayRequests.length, 5);
});

// Catches passing full legacy/private/audit prose alongside the sole writing brief.
test("candidate provider boundary has one complete brief and excludes audit copy, headlines, reflection and history", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  input.facts.push({ id: "X1", statement: "PRIVATE LOCAL NOTE MUST STAY LOCAL" });
  input.fallback.body = "LEGACY FALLBACK MUST STAY LOCAL";
  input.writing = {
    recent: [
      {
        day: "2026-12-16",
        paragraphs: ["PRIVATE RECENT READING MUST STAY LOCAL"],
        requiredLiteralSentences: [],
      },
    ],
  };
  const original = structuredClone(input);
  h.setGateway(() => gatewayResponse(benchmark.paragraphs));
  const result = await language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
  const prompt = result.request.messages.find((message) => message.role === "user").content;
  assert.doesNotMatch(
    prompt,
    /PRIVATE LOCAL|PRIVATE RECENT|LEGACY FALLBACK|Published interpretation|Published natal lens|Published transit chapter|EX-C1|0\.00 degrees/,
  );
  assert.ok(!prompt.includes(benchmark.headline));
  assert.ok(!prompt.includes(benchmark.reflection));
  const brief = JSON.parse(prompt.split("\n").find((line) => line.startsWith('{"version":')));
  assert.deepEqual(brief.material.map((m) => m.factId).sort(), ["I1", "I2", "N1", "P2", "S1"]);
  assert.ok(
    brief.references.some(
      (ref) => ref.id === "A1" && ref.chronologySentence === benchmark.chronology,
    ),
  );
  for (const material of brief.material) assert.equal(prompt.split(material.meaning).length - 1, 1);
  assert.deepEqual(input, original);
});

// Catches silently accepting dropped context and serving the older fallback after rejection.
test("lost natal or transit coverage rejects once and restores the complete authored candidate fallback", async () => {
  const benchmark = packet.cases.find((b) => b.id === "natal-and-transit");
  for (const [remove, code] of [
    ["N1", "natal_coverage"],
    ["P2", "arc_coverage"],
  ]) {
    const before = h.gatewayRequests.length;
    const result = await run(benchmark, (paragraphs) => {
      for (const p of paragraphs) p.facts = p.facts.filter((id) => id !== remove);
    });
    assert.equal(result.prose.meta.mode, "template");
    assert.equal(result.prose.meta.diagnostics.code, code);
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
    assert.equal(result.prose.headline, benchmark.headline);
    assert.equal(result.prose.prompt, benchmark.reflection);
    assert.equal(h.gatewayRequests.length - before, 1);
  }
});

// Catches chronology changes, missing parents and unsupported natal certainty.
test("context candidate retains chronology, parent, source-strength and astronomy rejection checks", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const replaceOpening = (paragraphs, text) => {
    const rest = [
      ...new Intl.Segmenter("en", { granularity: "sentence" }).segment(paragraphs[0].text),
    ]
      .slice(1)
      .map((item) => item.segment)
      .join("");
    paragraphs[0].text = `${text} ${rest}`;
  };
  for (const [mutate, code] of [
    [
      (p) => {
        p[1].text = p[1].text.replace(benchmark.chronology, "").trim();
      },
      "arc_chronology",
    ],
    [
      (p) => {
        p[1].facts = p[1].facts.filter((id) => id !== "A1");
      },
      "arc_dependencies",
    ],
    [
      (p) => {
        p[0].facts = p[0].facts.filter((id) => id !== "C2");
      },
      "dependencies",
    ],
    [
      (p) => {
        p[1].text = "Your natal Sun in Gemini defines your personality. " + p[1].text;
      },
      "placement",
    ],
    [
      (p) => {
        p[1].text = "You are fundamentally defined by this reading. " + p[1].text;
      },
      "natal_claim",
    ],
    [(p) => replaceOpening(p, "Saturn is trine your natal Sun."), "relation"],
    [
      (p) => replaceOpening(p, "Saturn's trine to your natal Sun is a picture of expectations."),
      "relation",
    ],
    [
      (p) => replaceOpening(p, "Saturn’s trine to your natal Sun is a picture of expectations."),
      "relation",
    ],
    [(p) => replaceOpening(p, "You ignored that project yesterday."), "editorial_claim"],
    [
      (p) =>
        replaceOpening(
          p,
          "Following more than one line of curiosity helps a direction take shape.",
        ),
      "editorial_claim",
    ],
  ]) {
    const result = await run(benchmark, mutate);
    assert.equal(result.prose.meta.mode, "template");
    assert.equal(result.prose.meta.diagnostics.code, code);
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  }
});

// Catches coupling the shared style to Warm/Standard and accepting measurement clutter in Standard.
test("candidate supports each tone/depth while standard allows only its required chronology detail", async () => {
  const benchmark = packet.cases.find((b) => b.id === "natal-and-transit");
  for (const tone of ["plain", "warm", "clinical"]) {
    for (const depth of ["standard", "technical"]) {
      const result = await run(benchmark, () => {}, { tone, depth });
      assert.equal(result.prose.meta.mode, "model", `${tone}/${depth}`);
      assert.equal(result.prose.meta.diagnostics.promptVersion, "daily-context-body-1");
    }
  }
  const detail = (p) =>
    p.push({
      text: "Saturn's square to natal Sun has a current orb of 0 degrees.",
      facts: ["C1"],
      scenes: [],
    });
  const standard = await run(benchmark, detail);
  assert.equal(standard.prose.meta.diagnostics.code, "editorial_detail");
  const technical = await run(benchmark, detail, { depth: "technical" });
  assert.equal(technical.prose.meta.mode, "model");
});

// Catches requesting paid output before discovering a corrupt source or unusable fallback.
test("source mismatch and invalid independent fields or fallback reject before any provider attempt", async () => {
  const benchmark = packet.cases.find((b) => b.id === "natal-and-transit");
  for (const mutate of [
    (b) => {
      b.selectedSources.find((f) => f.id === "N1").statement += " Another meaning.";
    },
    (b) => {
      b.headline = "";
    },
    (b) => {
      b.reflection = "Reflection: what matters?";
    },
    (b) => {
      for (const p of b.paragraphs) p.facts = p.facts.filter((id) => id !== "N1");
    },
    (b) => {
      b.paragraphs[1].text = b.paragraphs[1].text.replace(b.chronology, "").trim();
    },
  ]) {
    const changed = structuredClone(benchmark);
    mutate(changed);
    const { input } = await contextWritingFixture(h, benchmark);
    await assert.rejects(
      language.generateSyntheticReadingProse(input, "lovable", {}, changed),
      /[Cc]andidate|[Bb]enchmark|[Rr]equired template/,
    );
  }
  assert.equal(h.gatewayRequests.length, 0);
});

// Catches a second provider being attempted after one provider fails.
test("each provider failure keeps the whole candidate fallback and never retries through another provider", async () => {
  const benchmark = packet.cases.find((b) => b.id === "natal-and-transit");
  for (const provider of ["lovable", "gemini-enterprise"]) {
    const { input } = await contextWritingFixture(h, benchmark);
    h.setGateway(() => new Response(null, { status: 503 }));
    h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
    const result = await language.generateSyntheticReadingProse(input, provider, {}, benchmark);
    assert.equal(result.prose.meta.mode, "template");
    assert.equal(result.prose.meta.diagnostics.code, "http");
    assert.equal(result.prose.meta.diagnostics.attempted, true);
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  }
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});

// Catches bypassing the full reference validator when a new style is selected.
test("candidate respects angle and house suppression while retaining the reviewed context fallback", async () => {
  const benchmark = packet.cases.find((b) => b.id === "natal-and-transit");
  for (const forbidden of [
    "Your Ascendant has a special meaning.",
    "Your fourth house describes this task.",
  ]) {
    const { input } = await contextWritingFixture(h, benchmark);
    input.suppression = { angles: true, houses: true };
    const paragraphs = structuredClone(benchmark.paragraphs);
    paragraphs[1].text = `${forbidden} ${paragraphs[1].text}`;
    h.setGateway(() => gatewayResponse(paragraphs));
    const result = await language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
    assert.equal(result.prose.meta.mode, "template");
    assert.equal(result.prose.meta.diagnostics.code, "suppression");
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  }
});
