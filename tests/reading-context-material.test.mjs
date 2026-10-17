import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, brief, packet, material;
before(async () => {
  h = await createRecordsHarness();
  brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  packet = await readContextBenchmarks();
  material = JSON.parse(
    await readFile(new URL("../src/lib/ai/context-writing-material.json", import.meta.url), "utf8"),
  );
});
after(async () => h?.close());

// Replacing worded claims with legacy mechanism prose, or sending the local proof,
// would hand the writer a second expression of the same source meaning.
test("the candidate supplies one worded claim per source claim and keeps source proof local", async () => {
  const benchmark = packet.cases.find((c) => c.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  const original = structuredClone(input.facts);
  const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
  assert.equal(projected.materialVersion, "daily-context-material-5");
  const serialized = JSON.stringify(projected);
  for (const source of material.sources) {
    assert.ok(!serialized.includes(source.sourceFact.statement), source.factId);
    for (const claim of source.claims) {
      // A claim drafted in its source's own words appears once, as that drafted claim.
      const uses = serialized.split(claim.meaning).length - 1;
      assert.ok(
        uses === 0 || (uses === 1 && projected.claims.some((c) => c.write === claim.meaning)),
        claim.id,
      );
      assert.ok(!serialized.includes(claim.qualifier), claim.id);
    }
    for (const limitation of source.limitations) assert.ok(!serialized.includes(limitation));
  }
  assert.doesNotMatch(
    serialized,
    /"(?:carries|sourceFact|sourceMeaning|meaning|qualifier|limitations|sceneDetails|practicalDistinction|optionalDirections|sourceMeanings|sourceConditions|editingPrinciples)"/,
  );
  const writes = projected.claims.filter((claim) => claim.write).map((claim) => claim.write);
  assert.equal(new Set(writes).size, writes.length);
  const natal = projected.claims.filter((claim) => claim.cite.includes("N1")).map((c) => c.write);
  // One wording carries both N1 claims: not deciding yet, and curiosity shaping a direction.
  assert.ok(
    natal.some((write) =>
      /may not need to decide between them.*curiosity can help a direction take shape/.test(write),
    ),
  );
  const chapter = projected.claims.find((claim) => claim.cite[0] === "P2");
  assert.match(
    chapter.write,
    /^If an earlier way of handling the task no longer fits, you could use this return to try one smaller change/,
  );
  assert.ok(!serialized.includes(benchmark.headline));
  assert.ok(!serialized.includes(benchmark.reflection));
  assert.deepEqual(input.facts, original);
  projected.claims[0].write = "mutated projected claim";
  assert.ok(
    !JSON.stringify(brief.toDailyContextBrief(input.facts, "warm", "standard")).includes(
      "mutated projected claim",
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

// Exact benchmark scenes may inspire claims; a full authored answer must remain outside the request.
test("all five briefs cite exactly their selected sources and preserve separate calculated chronology", async () => {
  for (const benchmark of packet.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const projected = brief.toDailyContextBrief(input.facts, "warm", "standard");
    assert.deepEqual(
      [...new Set(projected.claims.flatMap((claim) => claim.cite))].sort(),
      benchmark.selectedSources.map((f) => f.id).sort(),
    );
    assert.equal(projected.claims[0].move, "observe");
    const serialized = JSON.stringify(projected);
    for (const paragraph of benchmark.paragraphs) assert.ok(!serialized.includes(paragraph.text));
    if (benchmark.chronology) {
      assert.equal(serialized.split(benchmark.chronology).length - 1, 1);
      assert.deepEqual(
        projected.claims.filter((claim) => claim.move === "chronology"),
        [
          {
            id: "A1.1",
            move: "chronology",
            copy: "A1.chronologySentence",
            cite: ["A1", "C1"],
            continues: "I1.3",
            byParagraph: 2,
          },
        ],
      );
    } else assert.ok(!projected.claims.some((claim) => claim.move === "chronology"));
    assert.equal(projected.controls.voiceVersion, brief.CONTEXT_DAILY_VOICE_VERSION);
  }
});
