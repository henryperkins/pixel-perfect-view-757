import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, candidate, prepare, language, diagnostics;
before(async () => {
  h = await createRecordsHarness();
  ({ EDITORIAL_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/editorial-candidate-bundle.ts",
  ));
  ({ prepareSyntheticEvaluationCase: prepare } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  diagnostics = await h.vite.ssrLoadModule("/src/lib/ai/diagnostics.ts");
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
const gateway = (value) =>
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify(draft(value)) } }] }),
  );
const ids = [
  "writing-reply-scene",
  "venus-opposition-venus",
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
  "quiet-threshold",
  "editorial-quiet-2026-10-12",
  "editorial-quiet-2026-10-13",
  "editorial-quiet-2026-10-14",
];

test("all nine 0.9.0 member selections use exact authored copy with honest no-request metadata", async () => {
  h.setGateway(() => new Response(null, { status: 503 }));
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  for (const provider of ["lovable", "gemini-enterprise"]) {
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = provider;
    for (const id of ids) {
      const value = input(id);
      const result = await language.generateReadingProse(value);
      assert.equal(result.body, value.fallback.body, id);
      assert.equal(result.headline, value.fallback.headline, id);
      assert.equal(result.prompt, value.fallback.prompt, id);
      assert.equal(result.meta.mode, "template", id);
      assert.equal(result.meta.model, null, id);
      assert.equal(result.meta.reason, "Published authored editorial reading", id);
      assert.equal(result.meta.diagnostics.code, "authored_editorial", id);
      assert.equal(result.meta.diagnostics.outcome, "skipped", id);
      assert.equal(result.meta.diagnostics.attempted, false, id);
      assert.equal(result.meta.diagnostics.durationMs, null, id);
      assert.equal(result.meta.writing.candidateQuality.outcome, "not_evaluated", id);
      assert.equal(result.meta.writing.finalQuality.outcome, "pass", id);
      assert.deepEqual(
        diagnostics.readDailyDiagnostics(result.meta.diagnostics),
        result.meta.diagnostics,
        "authored diagnostics survive saved-record decoding",
      );
    }
  }
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("0.9.0 synthetic evaluation still requests and validates model prose", async () => {
  const value = input();
  gateway(value);
  const result = await language.generateSyntheticReadingProse(value);
  assert.equal(result.prose.meta.mode, "model");
  assert.equal(result.prose.meta.diagnostics.code, "accepted");
  assert.equal(result.prose.meta.diagnostics.attempted, true);
  assert.ok(result.request);
  assert.ok(result.candidate);
  assert.equal(h.gatewayRequests.length, 1);
});

test("0.9.1 preserves authored delivery for the unchanged editorial catalogue", async () => {
  h.setGateway(() => new Response(null, { status: 503 }));
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  for (const provider of ["lovable", "gemini-enterprise"]) {
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = provider;
    for (const id of ids) {
      const value = input(id, "0.9.1");
      const result = await language.generateReadingProse(value);
      assert.equal(result.body, value.fallback.body, id);
      assert.equal(result.meta.diagnostics.code, "authored_editorial", id);
      assert.equal(result.meta.diagnostics.attempted, false, id);
      assert.equal(result.meta.model, null, id);
    }
  }
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("another editorial release retains member model generation", async () => {
  const value = input("writing-reply-scene", "0.9.1-editorial-candidate");
  gateway(value);
  const result = await language.generateReadingProse(value);
  assert.equal(result.meta.mode, "model");
  assert.equal(result.meta.diagnostics.code, "accepted");
  assert.equal(h.gatewayRequests.length, 1);
});

test("authored member copy retains fact validation without requesting a repair", async () => {
  const value = input();
  value.writing.template.paragraphs[0].facts = ["C1"];
  h.setGateway(() => new Response(null, { status: 503 }));
  await assert.rejects(language.generateReadingProse(value), /Required template source failed/);
  assert.equal(h.gatewayRequests.length, 0);
});

test("authored diagnostics cannot claim a model attempt, acceptance or rejection", async () => {
  const result = await language.generateReadingProse(input());
  const d = result.meta.diagnostics;
  assert.equal(d.code, "authored_editorial");
  for (const change of [
    { attempted: true, durationMs: 1 },
    { outcome: "accepted", attempted: true, durationMs: 1 },
    { outcome: "rejected", attempted: true, durationMs: 1 },
  ])
    assert.equal(diagnostics.readDailyDiagnostics({ ...d, ...change }), null);
});
