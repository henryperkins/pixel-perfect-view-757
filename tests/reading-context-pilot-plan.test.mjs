import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const ordered = (facts) => [...facts].sort((a, b) => a.id.localeCompare(b.id));
const IDS = [
  "contact-only",
  "natal-only",
  "transit-only",
  "natal-and-transit",
  "synthesis-natal-and-transit",
];
let h, sets, evaluation, packet;
before(async () => {
  h = await createRecordsHarness();
  sets = await h.vite.ssrLoadModule("/src/lib/ai/evaluation-case-sets.ts");
  evaluation = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  packet = await readContextBenchmarks();
});
beforeEach(async () => h.reset());
after(async () => h?.close());
const pilot = () => h.vite.ssrLoadModule("/src/lib/ai/context-pilot-plan.server.ts");

// Removing the new manifest, any case, or either explicit context switch fails this contract.
test("closed context case set reconstructs the five reviewed context combinations", () => {
  let manifest;
  assert.doesNotThrow(() => {
    manifest = sets.getEvaluationCaseSet("daily-context-1");
  });
  assert.deepEqual(
    manifest.cases.map((item) => item.id),
    IDS,
  );
  assert.equal(manifest.caseSetHash, digest(manifest.cases));
  assert.deepEqual(
    manifest.cases.map((item) => !!item.natalWindowSamples),
    [false, true, false, true, true],
  );
  assert.deepEqual(
    manifest.cases.map((item) => !!item.transitEpisodeScan && !!item.transitAnchor),
    [false, false, true, true, true],
  );
  assert.deepEqual(
    manifest.cases.map((item) => item.cycles.length),
    [1, 1, 1, 1, 2],
  );
  manifest.cases[0].config.tone = "clinical";
  assert.equal(sets.getEvaluationCaseSet("daily-context-1").cases[0].config.tone, "warm");
});

test("frozen application inputs preserve the reviewed benchmark and bundle bytes", async () => {
  for (const [source, frozen] of [
    [
      "../docs/reviews/daily-reading-context-writer/2026-10-17/benchmark-drafts.json",
      "../src/lib/ai/context-writing-benchmarks.json",
    ],
    [
      "../docs/reviews/daily-reading-release/2026-10-17/bundle.json",
      "../src/lib/content/context-pilot-bundle.json",
    ],
  ])
    assert.deepEqual(
      await readFile(new URL(frozen, import.meta.url)),
      await readFile(new URL(source, import.meta.url)),
    );
});

test("context plan pins one provider, five attempts, source identity and a five-dollar ceiling before transport", async () => {
  const { createContextPilotPlan, revalidateContextPilotPlan } = await pilot();
  const plan = createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  assert.equal(plan.attemptLimit, 5);
  assert.deepEqual(
    plan.cases.map((item) => item.id),
    IDS,
  );
  assert.ok(plan.cases.every((item) => item.expectsModel));
  assert.equal(plan.contextPilot.provider, "gemini-enterprise");
  assert.equal(plan.contextPilot.dollarCeilingMicros, 5_000_000);
  assert.equal(plan.contextPilot.reviewReserveMicros, 0);
  assert.equal(plan.contextPilot.candidate.version, "0.9.0");
  assert.equal(
    plan.contextPilot.benchmarkHash,
    "825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024",
  );
  assert.equal(
    plan.contextPilot.candidateCanonicalHash,
    "d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f",
  );
  assert.deepEqual(plan.contextPilot.benchmarks, packet);
  assert.equal(plan.metadata.promptVersion, "daily-context-body-5");
  assert.equal(plan.metadata.validatorVersion, "daily-context-reference-5");
  assert.equal(plan.metadata.voiceExamplesVersion, "daily-context-voice-5");
  assert.equal(plan.metadata.gatewayTimeoutMs, 60_000);
  assert.equal(plan.metadata.maxOutputTokens, 65_536);
  assert.equal(plan.cases[3].writingBrief.version, "daily-context-brief-5");
  assert.equal(
    revalidateContextPilotPlan(plan, "b".repeat(40), "gemini-enterprise").hash,
    plan.hash,
  );
  assert.equal(
    h.gatewayRequests.length + h.geminiEnterpriseRequests.length + h.swissRequests.length,
    0,
  );
});

// Without the independent material pin, source prose can drift under an unchanged benchmark hash.
test("production context campaign freezes the exact reviewed material independently of unchanged benchmarks", async () => {
  const { createContextPilotPlan, revalidateContextPilotPlan } = await pilot();
  const plan = createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  assert.equal(plan.contextPilot.version, "daily-context-pilot-5");
  const bytes = await readFile(
    new URL("../src/lib/ai/context-writing-material.json", import.meta.url),
  );
  assert.equal(plan.contextPilot.materialHash, createHash("sha256").update(bytes).digest("hex"));
  assert.deepEqual(plan.contextPilot.materials, JSON.parse(bytes));
  assert.equal(plan.contextPilot.materialVersion, "daily-context-material-5");
  assert.equal(
    plan.contextPilot.benchmarkHash,
    "825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024",
  );
  assert.equal(
    plan.contextPilot.caseManifest.caseSetHash,
    "93855b484ef95b1b950fc229633d4467215ff0cd2c6d6ce1eb1445ba3375f5c4",
  );
  const changed = structuredClone(plan);
  changed.contextPilot.materials.compositions[0].entries[0].write = "Unreviewed new direction.";
  assert.throws(
    () => revalidateContextPilotPlan(changed, "b".repeat(40), "gemini-enterprise"),
    /integrity/,
  );
  const { hash: _previous, ...changedPayload } = changed;
  changed.hash = digest(changedPayload);
  assert.throws(
    () => revalidateContextPilotPlan(changed, "b".repeat(40), "gemini-enterprise"),
    /runtime, candidate, fixture or policy/,
  );
  const historical = structuredClone(plan);
  historical.contextPilot.version = "daily-context-pilot-1";
  assert.throws(
    () => revalidateContextPilotPlan(historical, "b".repeat(40), "gemini-enterprise"),
    /source or provider/,
  );
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});

test("context plan refuses missing source identity, another provider and stored source or benchmark drift", async () => {
  const { createContextPilotPlan, revalidateContextPilotPlan } = await pilot();
  assert.throws(() => createContextPilotPlan(null, "gemini-enterprise"), /source SHA/i);
  assert.throws(() => createContextPilotPlan("a".repeat(40), "lovable"), /Gemini Enterprise/);
  const plan = createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  assert.throws(
    () => revalidateContextPilotPlan(plan, "a".repeat(40), "gemini-enterprise"),
    /source or provider/,
  );
  assert.throws(
    () => revalidateContextPilotPlan(plan, "b".repeat(40), "lovable"),
    /source or provider/,
  );
  const changed = structuredClone(plan);
  changed.contextPilot.benchmarks.cases[1].selectedSources[0].statement += " Changed.";
  assert.throws(
    () => revalidateContextPilotPlan(changed, "b".repeat(40), "gemini-enterprise"),
    /integrity/,
  );
  const { hash: _hash, ...payload } = changed;
  changed.hash = digest(payload);
  assert.throws(
    () => revalidateContextPilotPlan(changed, "b".repeat(40), "gemini-enterprise"),
    /runtime, candidate, fixture or policy/,
  );
});

test("production preparation rebuilds exact selected source graphs and authored fallback fields", async () => {
  const { createContextPilotPlan } = await pilot();
  const plan = createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  for (const benchmark of packet.cases) {
    const actual = evaluation.prepareSyntheticEvaluationCase(
      benchmark.id,
      plan.contextPilot.candidate,
      undefined,
      "daily-context-1",
    );
    const independent = await contextWritingFixture(h, benchmark);
    assert.deepEqual(ordered(actual.facts), ordered(benchmark.selectedSources), benchmark.id);
    assert.equal(digest(actual.contextBenchmark.selectedSources), benchmark.sourceHash);
    assert.deepEqual(actual.contextBenchmark, benchmark);
    assert.equal(actual.input.fallback.headline, benchmark.headline);
    assert.equal(actual.input.fallback.prompt, benchmark.reflection);
    assert.equal(actual.assembled.headline, benchmark.headline);
    assert.equal(
      actual.assembled.astroBody,
      plan.cases.find((item) => item.id === benchmark.id).template.body,
    );
    assert.equal(
      actual.assembled.writingPlan.theme.sourceKey,
      actual.input.writing.plan.theme.sourceKey,
    );
    assert.deepEqual(actual.assembled.natalLensPlan, independent.assembled.natalLensPlan);
    assert.deepEqual(actual.assembled.transitStoryPlan, independent.assembled.transitStoryPlan);
    const frozen = plan.cases.find((item) => item.id === benchmark.id);
    assert.deepEqual(frozen.facts, actual.facts);
    assert.deepEqual(frozen.writingPlan, actual.input.writing.plan);
    assert.equal(frozen.template.prompt, benchmark.reflection);
  }
  const changed = structuredClone(plan.contextPilot.candidate);
  changed.cycles.find((item) => item.key === "square:saturn:sun").mechanism += " Changed meaning.";
  assert.throws(
    () =>
      evaluation.prepareSyntheticEvaluationCase(
        "contact-only",
        changed,
        undefined,
        "daily-context-1",
      ),
    /source graph/,
  );
});

test("server synthetic runner requests the shared member voice and captures its selected sources truthfully", async () => {
  const { createContextPilotPlan } = await pilot();
  const plan = createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  for (const benchmark of packet.cases) {
    h.setGeminiEnterprise(() =>
      Response.json({
        modelVersion: "gemini-3.8-flash-20260902",
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ text: JSON.stringify({ paragraphs: benchmark.paragraphs }) }] },
          },
        ],
      }),
    );
    const result = await evaluation.runSyntheticEvaluationCase(
      benchmark.id,
      plan.contextPilot.candidate,
      "gemini-enterprise",
      undefined,
      { boundedQualification: true },
      "daily-context-1",
    );
    assert.equal(
      result.case.output.mode,
      "model",
      `${benchmark.id}: ${result.case.diagnostics.code}`,
    );
    assert.deepEqual(ordered(result.case.facts), ordered(benchmark.selectedSources));
    assert.equal(result.metadata.promptVersion, "daily-context-body-5");
    assert.equal(result.metadata.validatorVersion, "daily-context-reference-5");
    assert.equal(result.metadata.voiceExamplesVersion, "daily-context-voice-5");
    assert.ok(result.case.request);
    assert.equal(result.case.output.headline, benchmark.headline);
    assert.equal(result.case.output.prompt, benchmark.reflection);
    assert.deepEqual(
      result.case.writingPlan,
      plan.cases.find((item) => item.id === benchmark.id).writingPlan,
    );
    assert.equal(
      result.case.template.body,
      plan.cases.find((item) => item.id === benchmark.id).template.body,
    );
  }
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  assert.equal(h.gatewayRequests.length, 0);
});

test("server synthetic runner keeps the authored runtime fallback after one failed provider attempt", async () => {
  const { createContextPilotPlan } = await pilot();
  const plan = createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  const result = await evaluation.runSyntheticEvaluationCase(
    "natal-and-transit",
    plan.contextPilot.candidate,
    "gemini-enterprise",
    undefined,
    { boundedQualification: true },
    "daily-context-1",
  );
  const benchmark = packet.cases.find((item) => item.id === "natal-and-transit");
  assert.equal(result.case.output.mode, "template");
  assert.equal(result.case.diagnostics.attempted, true);
  assert.equal(
    result.case.output.body,
    plan.cases.find((item) => item.id === "natal-and-transit").template.body,
  );
  assert.equal(result.case.output.prompt, benchmark.reflection);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("new context manifest preserves every historical case inventory hash", () => {
  assert.equal(
    sets.getEvaluationCaseSet("synthetic-daily-7").caseSetHash,
    "245cd4480c6b11cf15d703915bf49af4785744fdf998115e00341b20a51b0bfa",
  );
  assert.equal(
    sets.getEvaluationCaseSet("daily-editorial-1").caseSetHash,
    "21d23904d7966433d58419261da78a64d5f1434421d4104306c194f225a75eb2",
  );
});
