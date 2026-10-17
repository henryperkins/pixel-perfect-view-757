import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, brief, language, benchmarks, cards;
before(async () => {
  h = await createRecordsHarness();
  brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  benchmarks = await readContextBenchmarks();
  cards = JSON.parse(
    await readFile(new URL("../src/lib/ai/context-writing-material.json", import.meta.url), "utf8"),
  ).cards;
});
after(async () => h?.close());

// The rejected pilot joined one mini-reading per source, then repeated the
// calendar distinction for the return chapter. Give each selected meaning one
// job inside a shared situation without supplying another authored body.
test("the brief gives every selected meaning one distinct job in the central situation", async () => {
  for (const benchmark of benchmarks.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
    const selected = projected.material.map(({ factId }) => factId);
    assert.equal(projected.development.centralSituationFact, "I1");
    assert.deepEqual(
      projected.development.sourceRoles.map(({ factId }) => factId).sort(),
      [...selected].sort(),
      "every selected source has a role, and unselected sources have none",
    );
    assert.equal(
      new Set(projected.development.sourceRoles.map(({ role }) => role)).size,
      selected.length,
      "additional context develops a different part of the same decision",
    );
    const serialized = JSON.stringify(projected.development);
    for (const { text } of benchmark.paragraphs) assert.ok(!serialized.includes(text));
    for (const { meaning } of projected.controls.sourceMeanings)
      assert.ok(!serialized.includes(meaning), "planning roles do not duplicate source prose");
    projected.development.sourceRoles[0].role = "mutated";
    assert.ok(
      !JSON.stringify(
        brief.toDailyContextBrief(input.facts, "warm", "standard").development,
      ).includes("mutated"),
    );
  }
});

// Source summaries in the drafting field caused the observed abstract openings.
// Keep their authority while preventing a second paragraph of competing copy.
test("draftable material starts with scenes while interpretation summaries are separate constraints", async () => {
  for (const benchmark of benchmarks.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const original = structuredClone(input.facts);
    const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
    assert.equal(projected.version, "daily-context-brief-4");
    assert.deepEqual(projected.controls.draftFrom, [
      "sceneDetails",
      "practicalDistinction",
      "optionalDirections",
    ]);
    for (const material of projected.material) {
      assert.equal(material.meaning, undefined, "abstract source summary is not drafting copy");
      assert.ok(material.sceneDetails.length);
      const control = projected.controls.sourceMeanings.find((m) => m.factId === material.factId);
      assert.equal(control.meaning, cards.find((c) => c.factId === material.factId).meaning);
      assert.deepEqual(control.requiredFacts, material.requiredFacts);
      assert.ok(projected.controls.sourceConditions.some((m) => m.factId === material.factId));
    }
    assert.deepEqual(input.facts, original);
    projected.controls.sourceMeanings[0].meaning = "mutated summary";
    assert.ok(
      !JSON.stringify(brief.toDailyContextBrief(input.facts, "warm", "standard")).includes(
        "mutated summary",
      ),
    );
  }
});

// Exercise the real provider seam, not just a formatting helper.
test("the real context request uses the scene-first brief and retains each source meaning once", async () => {
  const benchmark = benchmarks.cases.find((c) => c.id === "natal-only");
  const { input } = await contextWritingFixture(h, benchmark);
  h.setGateway(() =>
    Response.json({
      choices: [{ message: { content: JSON.stringify({ paragraphs: benchmark.paragraphs }) } }],
    }),
  );
  const result = await language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
  const user = result.request.messages.find((m) => m.role === "user").content;
  const projected = JSON.parse(user.split("\n").find((line) => line.startsWith('{"version":')));
  assert.equal(projected.version, "daily-context-brief-4");
  assert.ok(projected.material.every((m) => m.meaning === undefined));
  for (const { meaning } of projected.controls.sourceMeanings)
    assert.equal(user.split(meaning).length - 1, 1);
  assert.equal(result.prose.meta.diagnostics.promptVersion, "daily-context-body-4");
  assert.equal(result.prose.meta.diagnostics.validatorVersion, "daily-context-reference-4");
  assert.ok(!user.includes(benchmark.headline));
  assert.ok(!user.includes(benchmark.reflection));
  for (const paragraph of benchmark.paragraphs) assert.ok(!user.includes(paragraph.text));
  assert.equal(result.prose.meta.mode, "model", "intercepted authored control remains valid");
  assert.equal(h.gatewayRequests.length, 1);
});

test("both reviewed edits are accepted without replacing the original benchmark or fallback", async () => {
  const revisions = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-context-writer/2026-10-17/voice-qualifiers-3/revised-readings.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const revision of revisions.cases) {
    const benchmark = benchmarks.cases.find((item) => item.id === revision.id);
    assert.ok(benchmark);
    assert.deepEqual(revision.selectedSources, benchmark.selectedSources);
    const { input } = await contextWritingFixture(h, benchmark);
    const attemptsBefore = h.gatewayRequests.length;
    h.setGateway(() =>
      Response.json({
        choices: [{ message: { content: JSON.stringify({ paragraphs: revision.paragraphs }) } }],
      }),
    );
    const result = await language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
    assert.equal(result.prose.meta.mode, "model", revision.id);
    assert.equal(result.prose.body, revision.paragraphs.map((p) => p.text).join("\n\n"));
    assert.deepEqual(
      result.prose.meta.citations,
      revision.paragraphs.map(({ facts }, index) => ({ paragraph: index + 1, facts })),
    );
    assert.equal(h.gatewayRequests.length - attemptsBefore, 1);
    h.setGateway(() => new Response(null, { status: 503 }));
    const failed = await language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
    assert.equal(failed.prose.meta.mode, "template");
    assert.equal(failed.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
    assert.equal(failed.prose.headline, benchmark.headline);
    assert.equal(failed.prose.prompt, benchmark.reflection);
    assert.equal(h.gatewayRequests.length - attemptsBefore, 2);
  }
});
