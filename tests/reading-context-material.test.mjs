import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, brief, packet;
before(async () => {
  h = await createRecordsHarness();
  brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  packet = await readContextBenchmarks();
});
after(async () => h?.close());

// Replacing reviewed building blocks with legacy mechanism prose breaks this boundary.
test("the candidate supplies scene details and useful distinctions without competing source paragraphs", async () => {
  const benchmark = packet.cases.find((c) => c.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  const original = structuredClone(input.facts);
  const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
  assert.equal(projected.materialVersion, "daily-context-material-2");
  for (const material of projected.material) {
    const source = input.facts.find((f) => f.id === material.factId);
    assert.ok(material.sceneDetails.length > 0, material.factId);
    assert.ok(material.practicalDistinction.length > 25, material.factId);
    assert.ok(material.optionalDirections.length > 0, material.factId);
    assert.ok(
      !source.statement.endsWith(material.meaning),
      "do not supply a second legacy paragraph",
    );
    assert.equal(material.sourceFact, undefined, "source proof stays local");
    assert.equal(material.reviewSupport, undefined, "review annotations stay local");
    const condition = projected.controls.sourceConditions.find((c) => c.factId === material.factId);
    assert.ok(condition.conditions.length > 0, material.factId);
  }
  const natal = projected.material.find((m) => m.factId === "N1");
  assert.match(natal.practicalDistinction, /(?:explor|sampl|idea|interest)/i);
  const chapter = projected.material.find((m) => m.factId === "P2");
  assert.match(JSON.stringify(chapter), /(?:task|calendar|method|boundary)/i);
  assert.ok(!JSON.stringify(projected).includes(benchmark.headline));
  assert.ok(!JSON.stringify(projected).includes(benchmark.reflection));
  assert.deepEqual(input.facts, original);
  natal.sceneDetails.push("mutated projected detail");
  assert.ok(
    !JSON.stringify(brief.toDailyContextBrief(input.facts, "warm", "standard")).includes(
      "mutated projected detail",
    ),
  );
});

// A familiar key cannot authorize scenes after its published meaning or identity changes.
test("reviewed material fails closed on selected source drift", async () => {
  const { input } = await contextWritingFixture(h, packet.cases[3]);
  for (const mutate of [
    (facts) => {
      facts.find((f) => f.id === "I1").statement += " A different interpretation.";
    },
    (facts) => {
      facts.find((f) => f.id === "I1").releaseVersion = "0.9.1";
    },
    (facts) => {
      facts.find((f) => f.id === "N1").natalEvidenceId = "NL9";
    },
    (facts) => {
      facts.find((f) => f.id === "P2").storyChapter = "first";
    },
  ]) {
    const facts = structuredClone(input.facts);
    mutate(facts);
    assert.throws(
      () => brief.toDailyContextBrief(facts, "warm", "standard"),
      /(?:reviewed|material|fact graph)/i,
    );
  }
});

// Exact benchmark scenes may inspire cards; a full authored answer must remain outside the request.
test("all five briefs share reviewed source cards and preserve separate calculated chronology", async () => {
  for (const benchmark of packet.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
    assert.deepEqual(
      projected.material.map((m) => m.factId).sort(),
      benchmark.selectedSources
        .filter((f) => /^(I[12]|S1|N1|P2)$/.test(f.id))
        .map((f) => f.id)
        .sort(),
    );
    const serialized = JSON.stringify(projected);
    for (const paragraph of benchmark.paragraphs) assert.ok(!serialized.includes(paragraph.text));
    if (benchmark.chronology) assert.equal(serialized.split(benchmark.chronology).length - 1, 1);
    assert.equal(projected.controls.voiceVersion, brief.CONTEXT_DAILY_VOICE_VERSION);
  }
});
