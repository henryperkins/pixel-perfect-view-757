import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, candidate, prepare, language;
before(async () => {
  h = await createRecordsHarness();
  ({ EDITORIAL_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/editorial-candidate-bundle.ts",
  ));
  ({ prepareSyntheticEvaluationCase: prepare } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
after(async () => h?.close());
beforeEach(async () => h.reset());

const input = (id = "writing-reply-scene", version = "0.9.0") =>
  prepare(id, { ...structuredClone(candidate), version }, undefined, "daily-editorial-1").input;
const draft = (value) => ({
  paragraphs: value.writing.plan.editorial.entry.fallbackParagraphs.map((text) => ({
    text,
    facts: value.writing.plan.editorial.requiredFacts,
    scenes: [],
  })),
});
const lovableResponse = (value) =>
  Response.json({ choices: [{ message: { content: JSON.stringify(draft(value)) } }] });
const enterpriseResponse = (value) =>
  Response.json({
    candidates: [
      {
        content: { role: "model", parts: [{ text: JSON.stringify(draft(value)) }] },
        finishReason: "STOP",
      },
    ],
    modelVersion: "gemini-4-argon",
  });
const contacts = [
  "writing-reply-scene",
  "venus-opposition-venus",
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
];
const quiet = [
  "quiet-threshold",
  "editorial-quiet-2026-10-12",
  "editorial-quiet-2026-10-13",
  "editorial-quiet-2026-10-14",
];

test("every 0.9.x editorial contact requests new member prose from either provider", async () => {
  for (const provider of ["lovable", "gemini-enterprise"]) {
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = provider;
    for (const version of ["0.9.0", "0.9.1", "0.9.2"])
      for (const id of contacts) {
        const value = input(id, version);
        h.setGateway(() => lovableResponse(value));
        h.setGeminiEnterprise(() => enterpriseResponse(value));
        const requests = h.gatewayRequests.length + h.geminiEnterpriseRequests.length;
        const result = await language.generateReadingProse(value);
        const label = `${provider} ${version}: ${id}`;
        assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, requests + 1);
        assert.equal(result.meta.mode, "model", label);
        assert.equal(result.meta.diagnostics.code, "accepted", label);
        assert.equal(result.meta.diagnostics.attempted, true, label);
      }
  }
  assert.equal(h.gatewayRequests.length, 15);
  assert.equal(h.geminiEnterpriseRequests.length, 15);
});

test("quiet editorial days keep their dated copy because no contact is written about", async () => {
  h.setGateway(() => new Response(null, { status: 503 }));
  for (const id of quiet) {
    const value = input(id);
    const result = await language.generateReadingProse(value);
    assert.equal(result.body, value.fallback.body, id);
    assert.equal(result.meta.mode, "template", id);
    assert.equal(result.meta.diagnostics.code, "no_cycle", id);
    assert.equal(result.meta.diagnostics.attempted, false, id);
  }
  assert.equal(h.gatewayRequests.length, 0);
});

test("0.9.0 synthetic evaluation still requests and validates model prose", async () => {
  const value = input();
  h.setGateway(() => lovableResponse(value));
  const result = await language.generateSyntheticReadingProse(value);
  assert.equal(result.prose.meta.mode, "model");
  assert.equal(result.prose.meta.diagnostics.code, "accepted");
  assert.equal(result.prose.meta.diagnostics.attempted, true);
  assert.ok(result.request);
  assert.ok(result.candidate);
  assert.equal(h.gatewayRequests.length, 1);
});
