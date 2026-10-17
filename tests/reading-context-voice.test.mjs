import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, brief, language, benchmarks, material;
before(async () => {
  h = await createRecordsHarness();
  brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  benchmarks = await readContextBenchmarks();
  material = JSON.parse(
    await readFile(new URL("../src/lib/ai/context-writing-material.json", import.meta.url), "utf8"),
  );
});
after(async () => h?.close());

// The fourth pilot's brief gave each source a role label, a summary, scenes, a
// distinction and a direction; the bodies restated the premise from each one.
test("the brief words each selected claim once and gives it one move in a single situation", async () => {
  for (const benchmark of benchmarks.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
    const ids = projected.claims.map(({ id }) => id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(projected.claims[0].move, "observe");
    for (const claim of projected.claims) {
      assert.ok(["observe", "explain", "distinguish", "choose", "chronology"].includes(claim.move));
      assert.ok(!claim.continues || ids.indexOf(claim.continues) < ids.indexOf(claim.id));
      for (const word of claim.keep ?? []) assert.match(claim.write, new RegExp(`\\b${word}\\b`));
    }
    const serialized = JSON.stringify(projected);
    for (const { text } of benchmark.paragraphs) assert.ok(!serialized.includes(text));
    projected.claims[0].move = "mutated";
    assert.ok(
      !JSON.stringify(brief.toDailyContextBrief(input.facts, "warm", "standard")).includes(
        "mutated",
      ),
    );
  }
});

// Source summaries, conditions and editing principles were sent as controls in
// the fourth pilot and worked as more drafting copy. They are now absent.
test("the brief carries no source summary, condition list, role map or editing principle", async () => {
  for (const benchmark of benchmarks.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const original = structuredClone(input.facts);
    const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
    assert.equal(projected.version, "daily-context-brief-5");
    assert.deepEqual(Object.keys(projected), [
      "version",
      "materialVersion",
      "claims",
      "references",
      "controls",
    ]);
    assert.deepEqual(Object.keys(projected.controls), [
      "voiceVersion",
      "tone",
      "depth",
      "technicalDetails",
      "natalConditional",
      "chronologyFirstTwo",
      "chronologyOnce",
    ]);
    const serialized = JSON.stringify(projected);
    for (const source of material.sources)
      for (const condition of [...source.limitations, ...source.claims.map((c) => c.qualifier)])
        assert.ok(!serialized.includes(condition));
    assert.deepEqual(input.facts, original);
  }
});

// Exercise the real provider seam, not just a formatting helper.
test("the real context request sends each claim wording once and keeps instructions free of it", async () => {
  const benchmark = benchmarks.cases.find((c) => c.id === "natal-only");
  const { input } = await contextWritingFixture(h, benchmark);
  h.setGateway(() =>
    Response.json({
      choices: [{ message: { content: JSON.stringify({ paragraphs: benchmark.paragraphs }) } }],
    }),
  );
  const result = await language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
  const system = result.request.messages.find((m) => m.role === "system").content;
  const user = result.request.messages.find((m) => m.role === "user").content;
  const projected = JSON.parse(user.split("\n").find((line) => line.startsWith('{"version":')));
  assert.equal(projected.version, "daily-context-brief-5");
  for (const { write } of projected.claims.filter((claim) => claim.write)) {
    assert.equal(user.split(write).length - 1, 1);
    assert.ok(!system.includes(write));
  }
  assert.equal(result.prose.meta.diagnostics.promptVersion, "daily-context-body-5");
  assert.equal(result.prose.meta.diagnostics.validatorVersion, "daily-context-reference-5");
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
