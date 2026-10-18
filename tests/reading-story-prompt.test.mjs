import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, language, input;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  const { prepareSyntheticEvaluationCase } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  );
  const { TRANSIT_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  ({ input } = prepareSyntheticEvaluationCase("arc-opening-three", TRANSIT_CANDIDATE_BUNDLE));
  assert.equal(input.tone, "plain");
  assert.equal(input.depth, "standard");
  assert.equal(input.writing, undefined);
});
beforeEach(async () => h.reset());
after(async () => h?.close());

function candidate() {
  const chronology = input.facts.find((fact) => fact.id === "A1").arc.chronologySentence;
  const meaning = input.facts
    .find((fact) => fact.id === "P2")
    .statement.replace("Published transit chapter: ", "");
  return {
    paragraphs: [
      {
        text: `A responsibility can need clearer limits. ${chronology}`,
        facts: ["C1", "I1", "A1"],
      },
      { text: meaning, facts: ["C1", "I1", "A1", "P2"] },
    ],
  };
}
async function generate(draft) {
  h.setGateway(() => Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] }));
  return language.generateReadingProse(input);
}

test("story instructions give paragraph-local JSON citation examples without duplicating chronology", async () => {
  const result = await generate(candidate());
  const prompt = h.gatewayRequests[0].messages[1].content;
  assert.ok(prompt.includes('"facts": ["C1", "A1"]'));
  assert.ok(prompt.includes('"facts": ["C1", "I1", "A1", "P2"]'));
  assert.match(
    prompt,
    /Every paragraph using P2 must include all four IDs in that same paragraph's facts array/,
  );
  assert.match(
    prompt,
    /Include A1 when citing P2 even if the chronology sentence appears in another paragraph/,
  );
  assert.match(prompt, /without repeating the chronology sentence/);
  assert.equal(result.meta.diagnostics.promptVersion, "daily-astro-body-18");
  assert.equal(result.meta.diagnostics.validatorVersion, "daily-reference-10");
});

test("chronology in paragraph one and P2 in paragraph two pass with all local parents", async () => {
  const draft = candidate();
  const result = await generate(draft);
  assert.equal(result.meta.mode, "model");
  assert.equal(result.meta.diagnostics.code, "accepted");
  assert.deepEqual(
    result.meta.citations,
    draft.paragraphs.map((p, index) => ({ paragraph: index + 1, facts: p.facts })),
  );
  assert.equal(h.gatewayRequests.length, 1);
});

for (const missing of ["C1", "I1", "A1"]) {
  test(`a P2 paragraph missing ${missing} still fails closed despite parents in paragraph one`, async () => {
    const draft = candidate();
    draft.paragraphs[1].facts = draft.paragraphs[1].facts.filter((id) => id !== missing);
    const result = await generate(draft);
    assert.equal(result.meta.mode, "template");
    assert.equal(result.meta.diagnostics.code, "arc_dependencies");
    assert.equal(result.meta.diagnostics.paragraph, 2);
    assert.equal(result.body, input.fallback.body);
    assert.equal(h.gatewayRequests.length, 1);
  });
}

test("the chronology paragraph still requires its own A1 citation", async () => {
  const draft = candidate();
  draft.paragraphs[0].facts = ["C1", "I1"];
  const result = await generate(draft);
  assert.equal(result.meta.diagnostics.code, "arc_dependencies");
  assert.equal(result.meta.diagnostics.paragraph, 1);
  assert.equal(result.meta.mode, "template");
});
