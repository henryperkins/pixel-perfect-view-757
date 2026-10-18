import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, assemble, readingFacts, language, compose, candidate, fixed;
before(async () => {
  h = await createRecordsHarness();
  ({ assembleReading: assemble } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts } = await h.vite.ssrLoadModule("/src/lib/ai/facts.ts"));
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  ({ composeDailyWritingTemplate: compose } = await h.vite.ssrLoadModule(
    "/src/lib/content/daily-writing-template.ts",
  ));
  ({ SYNTHESIS_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/synthesis-candidate-bundle.ts",
  ));
  const f = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.fixtures.mjs");
  fixed = f.READING_EVAL_CASES.find((c) => c.id === "mercury-conjunction-clinical");
});
after(async () => h?.close());
beforeEach(async () => h.reset());
const sourceBundle = () => ({
  ...structuredClone(candidate),
  version: "0.8.0-writing-test",
  schemaVersion: 5,
  natalLenses: [],
  transitChapters: [],
  dailyWritingFrames: [
    {
      key: "reply-frame",
      source: { kind: "interpretation", key: "conjunction:mercury:mercury" },
      templateSentenceIndex: 0,
      scenes: [
        {
          key: "reply",
          situation: "If a reply remains unfinished, its point can need clearer wording.",
          focus: "The comparison concerns the wording of one reply.",
          cues: { objects: ["reply"], actions: ["wording"] },
        },
      ],
      reflection: {
        standard: "Which point would you like to articulate more clearly?",
        highStress: "Which point could be described simply?",
      },
    },
  ],
});
function input(context = {}) {
  const ctx = {
    granted: new Set(["USR-01", "USR-02", "WEL-03"]),
    tone: "plain",
    depth: "standard",
    localBucket: null,
    checkIn: null,
    wellness: null,
    ...context,
  };
  const assembled = assemble(fixed.chart, fixed.cycles, ctx, sourceBundle());
  return {
    facts: readingFacts(fixed.chart, assembled),
    hasEligibleCycles: true,
    tone: ctx.tone,
    depth: ctx.depth,
    suppression: { angles: false, houses: false },
    fallback: { headline: assembled.headline, body: assembled.astroBody, prompt: assembled.prompt },
    writing: {
      plan: assembled.writingPlan,
      template: assembled.writingTemplate,
      minimalTemplate: compose(
        assembled.writingPlan,
        assembled.natalLensPlan,
        assembled.transitStoryPlan,
        true,
      ),
      recent: [],
    },
  };
}
const draft = (
  second = "If a reply remains unfinished, its point can need clearer wording. The comparison concerns the wording of one reply.",
) => ({
  paragraphs: [
    {
      text: "Curiosity about a topic can bring phrasing, questions or ideas into view.",
      facts: ["C1", "I1"],
      scenes: [],
    },
    { text: second, facts: ["C1", "I1"], scenes: ["SC1"] },
  ],
});
test("schema-5 model requests use the complete example and scene schema once, keeping private reflection and history local", async () => {
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify(draft()) } }] }),
  );
  const plain = input();
  const result = await language.generateReadingProse(plain);
  assert.equal(result.meta.mode, "model");
  assert.equal(result.meta.diagnostics.promptVersion, "daily-concrete-body-18");
  assert.equal(result.meta.diagnostics.gatewayTimeoutMs, 60000);
  assert.deepEqual(result.meta.writing.sceneUse, [{ id: "SC1", paragraph: 2 }]);
  const request = structuredClone(h.gatewayRequests[0]);
  assert.ok(request.messages[1].content.includes("EX-SC1"));
  assert.ok(!JSON.stringify(request).includes("Which point could be described simply?"));
  assert.ok(
    request.response_format.json_schema.schema.properties.paragraphs.items.required.includes(
      "scenes",
    ),
  );
  const privateInput = input({ wellness: { stress: 5, sleep: null } });
  privateInput.writing.recent = [
    { day: "2026-10-11", paragraphs: ["Private history sentinel."], requiredLiteralSentences: [] },
  ];
  await language.generateReadingProse(privateInput);
  assert.deepEqual(h.gatewayRequests[1], request);
  assert.ok(!JSON.stringify(request).includes("Private history"));
  assert.notEqual(privateInput.fallback.prompt, plain.fallback.prompt);
});
test("a rejected personal event keeps its code-only report and uses the original valid scene template without a retry", async () => {
  h.setGateway(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify(
              draft("You ignored the reply this morning while its wording stayed unfinished."),
            ),
          },
        },
      ],
    }),
  );
  const result = await language.generateReadingProse(input());
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(result.meta.mode, "template");
  assert.equal(result.meta.diagnostics.code, "writing_quality");
  assert.equal(result.meta.writing.candidateQuality.outcome, "reject");
  assert.notEqual(result.meta.writing.finalQuality.outcome, "reject");
  assert.ok(result.body.includes("If a reply"));
  assert.ok(!JSON.stringify(result.meta).includes("ignored the reply"));
});
test("an earlier reference failure is not recorded as an editorial pass and missing scene fields reject as writing quality", async () => {
  h.setGateway(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              paragraphs: [
                { text: "A point can need words.", facts: ["EX-I1"], scenes: ["EX-SC1"] },
                draft().paragraphs[1],
              ],
            }),
          },
        },
      ],
    }),
  );
  let result = await language.generateReadingProse(input());
  assert.equal(result.meta.diagnostics.code, "id");
  assert.equal(result.meta.writing.candidateQuality.outcome, "not_evaluated");
  h.setGateway(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              paragraphs: draft().paragraphs.map(({ scenes, ...p }) => p),
            }),
          },
        },
      ],
    }),
  );
  result = await language.generateReadingProse(input());
  assert.equal(result.meta.diagnostics.code, "writing_quality");
});
test("a defective optional illustration uses a marked minimal source fallback while preserving the ready plan", async () => {
  const value = input();
  value.writing.template.paragraphs.at(-1).text =
    "You ignored the reply this morning while its wording stayed unfinished.";
  const result = await language.generateReadingProse(value);
  assert.equal(result.meta.mode, "template");
  assert.equal(result.meta.writing.renderMode, "minimal");
  assert.equal(result.meta.writing.reason, "template_editorial_failure");
  assert.deepEqual(result.meta.writing.sceneUse, []);
  assert.equal(value.writing.plan.status, "ready");
  assert.equal(result.meta.writing.finalQuality.outcome, "warning");
  assert.equal(h.gatewayRequests.length, 0);
});
