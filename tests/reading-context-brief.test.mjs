import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, candidate, prepare, brief;
before(async () => {
  h = await createRecordsHarness();
  ({ default: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/context-pilot-bundle.json",
  ));
  ({ prepareSyntheticEvaluationCase: prepare } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
});
after(async () => h?.close());

const prepared = (id = "arc-synthesis-natal-integration") =>
  prepare(id, structuredClone(candidate));
const ids = (facts) => facts.map((fact) => fact.id);

test("combined context retains its complete meaning graph and drops competing optional copy", () => {
  const { facts } = prepared();
  const selected = brief.selectDailyContextFacts(facts);
  assert.deepEqual(ids(selected), ["C1", "I1", "C2", "I2", "S1", "N1", "A1", "P2"]);
  assert.ok(
    facts.some((fact) => fact.id === "D1"),
    "fixture contains excluded legacy framing",
  );
  assert.ok(
    facts.some((fact) => fact.id === "U1"),
    "full validator facts remain available",
  );
  for (const id of ["D1", "P1", "T1", "E1", "U1", "U2", "I3", "C3"])
    assert.ok(!ids(selected).includes(id), id);
});

test("natal-only and transit-only briefs preserve their respective sources and every parent", () => {
  const natal = prepared("natal-synthesis-integration").facts;
  assert.deepEqual(ids(brief.selectDailyContextFacts(natal)), ["C1", "I1", "C2", "I2", "S1", "N1"]);
  const transit = prepared().facts.filter((fact) => fact.id !== "N1");
  assert.deepEqual(ids(brief.selectDailyContextFacts(transit)), [
    "C1",
    "I1",
    "C2",
    "I2",
    "S1",
    "A1",
    "P2",
  ]);
});

test("drafted claims cite every parent they use while structural references contain no prose", () => {
  const { facts } = prepared();
  const result = brief.toDailyContextBrief(facts, "warm", "standard");
  const cited = new Set(result.claims.flatMap((claim) => claim.cite));
  assert.deepEqual([...cited].sort(), ["A1", "C1", "C2", "I1", "I2", "N1", "P2", "S1"]);
  const firstCiting = (id) => result.claims.find((claim) => claim.cite.includes(id));
  assert.deepEqual(firstCiting("S1").cite, ["S1", "C1", "I1", "C2", "I2"]);
  assert.deepEqual(firstCiting("N1").cite.slice(0, 3), ["N1", "C1", "I1"]);
  assert.deepEqual(firstCiting("P2").cite.slice(0, 4), ["P2", "C1", "I1", "A1"]);
  for (const claim of result.claims) {
    assert.deepEqual(
      Object.keys(claim).filter(
        (key) =>
          !["id", "move", "write", "copy", "cite", "keep", "continues", "byParagraph"].includes(
            key,
          ),
      ),
      [],
      "source proof and carried-claim bookkeeping stay local",
    );
    if (claim.write) {
      assert.ok(!claim.write.startsWith("Published "));
      for (const fact of facts.filter((item) => item.statement.length > 40))
        assert.ok(!claim.write.includes(fact.statement), "legacy prose must not compete");
    }
  }
  for (const reference of result.references) {
    assert.equal(reference.statement, undefined);
    assert.equal(reference.meaning, undefined);
    if (/^(I1|I2|S1|N1|P2)$/.test(reference.id)) {
      const fact = facts.find((item) => item.id === reference.id);
      assert.equal(reference.sourceKey, fact.sourceKey);
      assert.equal(reference.releaseVersion, fact.releaseVersion);
      assert.deepEqual(reference.dependsOn, fact.dependsOn);
    }
  }
  assert.equal(result.references.find((reference) => reference.id === "N1").natalEvidenceId, "NL1");
});

test("standard hides optional geometry but preserves the immutable transit chronology exactly once", () => {
  const { facts } = prepared();
  const arc = facts.find((fact) => fact.id === "A1");
  const result = brief.toDailyContextBrief(facts, "plain", "standard");
  assert.deepEqual(result.references.find((reference) => reference.id === "C1").cycle, {
    transitBody: "saturn",
    natalPoint: "sun",
    aspect: "square",
  });
  assert.equal(
    result.references.find((reference) => reference.id === "A1").chronologySentence,
    arc.statement,
  );
  assert.equal(JSON.stringify(result).split(arc.statement).length - 1, 1);
  assert.equal(result.references.find((reference) => reference.id === "A1").arc, undefined);
  assert.equal(result.controls.chronologyFirstTwo, true);
  assert.equal(result.controls.chronologyOnce, true);
  assert.equal(result.controls.technicalDetails, false);
  const technical = brief.toDailyContextBrief(facts, "plain", "technical");
  assert.deepEqual(
    technical.references.find((reference) => reference.id === "C1").cycle,
    facts.find((fact) => fact.id === "C1").cycle,
  );
  assert.equal(technical.controls.technicalDetails, true);
});

test("projecting a brief cannot mutate validation facts or retain hidden personal context", () => {
  const { facts } = prepared();
  const unsafe = structuredClone(facts);
  unsafe.push({
    id: "L1",
    statement: "PRIVATE prior reading body and journal event",
    personalHistory: "PRIVATE history",
  });
  unsafe.find((fact) => fact.id === "I1").recentBodies = ["PRIVATE prior prose"];
  unsafe.find((fact) => fact.id === "C1").cycle.personalHistory = "PRIVATE nested history";
  const original = structuredClone(unsafe);
  const result = brief.toDailyContextBrief(unsafe, "warm", "standard");
  assert.deepEqual(unsafe, original);
  assert.ok(!JSON.stringify(result).includes("PRIVATE"));
  const selected = brief.selectDailyContextFacts(unsafe);
  assert.equal(selected.find((fact) => fact.id === "I1").recentBodies, undefined);
  assert.equal(selected.find((fact) => fact.id === "C1").cycle.personalHistory, undefined);
  selected[0].cycle.transitBody = "mutated";
  selected.find((fact) => fact.id === "S1").dependsOn.pop();
  selected.find((fact) => fact.id === "A1").arc.dates[0].eventId = "changed";
  assert.deepEqual(unsafe, original, "projection must clone nested validation metadata");
});

test("candidate projection rejects missing primary or source parents before dropping unsupported facts", () => {
  const { facts } = prepared();
  for (const missing of ["C1", "I1", "C2", "I2", "A1", "P2"]) {
    assert.throws(
      () => brief.selectDailyContextFacts(facts.filter((fact) => fact.id !== missing)),
      /Invalid daily fact graph/,
      missing,
    );
  }
  assert.throws(() => brief.selectDailyContextFacts([]), /Invalid daily fact graph/);
  assert.throws(
    () =>
      brief.toDailyContextBrief(
        [
          { id: "C1", statement: "legacy contact" },
          { id: "I1", statement: "legacy prose" },
        ],
        "plain",
        "standard",
      ),
    /Invalid daily fact graph/,
  );
});

test("a selected primary without synthesis excludes unjoined supporting interpretations", () => {
  const { facts } = prepared();
  const withoutSynthesis = facts.filter((fact) => fact.id !== "S1");
  assert.deepEqual(ids(brief.selectDailyContextFacts(withoutSynthesis)), [
    "C1",
    "I1",
    "N1",
    "A1",
    "P2",
  ]);
});

test("all tone and depth preferences share the observational policy without a warm-only gate", () => {
  const { facts } = prepared();
  for (const tone of ["plain", "warm", "clinical"]) {
    for (const depth of ["standard", "technical"]) {
      const result = brief.toDailyContextBrief(facts, tone, depth);
      assert.equal(result.controls.tone, tone);
      assert.equal(result.controls.depth, depth);
      assert.equal(result.controls.natalConditional, true);
      assert.equal(result.controls.voiceVersion, brief.CONTEXT_DAILY_VOICE_VERSION);
      const voice = brief.dailyContextVoice(tone, depth);
      assert.match(voice, new RegExp(`Tone: ${tone}`));
      assert.match(voice, new RegExp(`Depth: ${depth}`));
      assert.ok(!voice.includes("EX-"));
      assert.ok(!voice.includes("A pause can stay with you"));
      assert.ok(!voice.includes("new project would take the last open space"));
    }
  }
  const fallback = brief.toDailyContextBrief(facts, "unknown", "unknown");
  assert.equal(fallback.controls.tone, "plain");
  assert.equal(fallback.controls.depth, "standard");
  assert.equal(brief.dailyContextSystemVoice(false).includes("N1"), false);
  assert.match(brief.dailyContextSystemVoice(true), /N1/);
});

test("changing a source meaning cannot silently reuse reviewed material", () => {
  const { facts } = prepared();
  const primary = facts.find((fact) => fact.id === "I1");
  primary.statement = `Published interpretation ${primary.sourceKey}: The words Published interpretation belong to this exact supplied distinction.`;
  assert.throws(
    () => brief.toDailyContextBrief(facts, "warm", "standard"),
    /reviewed context material/,
  );
});
