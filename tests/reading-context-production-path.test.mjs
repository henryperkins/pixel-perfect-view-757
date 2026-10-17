import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
let h, plans;
before(async () => {
  h = await createRecordsHarness();
  plans = await h.vite.ssrLoadModule("/src/lib/ai/context-pilot-plan.server.ts");
});
beforeEach(async () => h.reset());
after(async () => h?.close());

// A plan that reuses the consumed campaign or freezes only synthetic benchmark material
// must fail before any provider request is permitted.
test("production pilot freezes a fresh campaign and the actual runtime adapter and fallback bytes", async () => {
  const plan = plans.createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  assert.equal(plan.contextPilot.version, "daily-context-pilot-4");
  assert.equal(plan.contextPilot.runtimePath, "member-production-context");
  assert.equal(plan.contextPilot.memberAdapterVersion, "daily-member-context-1");
  assert.equal(plan.contextPilot.runtimeFallbackVersion, "daily-member-context-fallbacks-1");
  const adapterBytes = await readFile(
    new URL("../src/lib/ai/member-context-reading.ts", import.meta.url),
  );
  const fallbackBytes = await readFile(
    new URL("../src/lib/ai/member-context-readings.json", import.meta.url),
  );
  assert.equal(plan.contextPilot.memberAdapterHash, sha256(adapterBytes));
  assert.equal(plan.contextPilot.runtimeFallbackHash, sha256(fallbackBytes));
  assert.deepEqual(plan.contextPilot.runtimeFallbacks, JSON.parse(fallbackBytes));
  assert.equal(
    plan.contextPilot.benchmarkHash,
    "825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024",
  );
  for (const field of ["memberAdapterHash", "runtimeFallbackHash", "memberAdapterVersion"]) {
    const altered = structuredClone(plan);
    altered.contextPilot[field] = "unreviewed-change";
    const { hash: _previous, ...payload } = altered;
    altered.hash = sha256(JSON.stringify(payload));
    assert.throws(
      () => plans.revalidateContextPilotPlan(altered, "b".repeat(40), "gemini-enterprise"),
      /runtime, candidate, fixture or policy/,
    );
  }
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});

// Replacing the shared member adapter with synthetic benchmark injection would restore
// the two superseded fallback bodies and hide the runtime/benchmark distinction.
test("production dry cases use edited runtime fallback bodies while preserving original review benchmarks", async () => {
  const plan = plans.createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  const revised = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-context-writer/2026-10-17/voice-qualifiers-3/revised-readings.json",
        import.meta.url,
      ),
    ),
  );
  for (const id of ["contact-only", "natal-only"]) {
    const actual = plan.cases.find((item) => item.id === id);
    const benchmark = plan.contextPilot.benchmarks.cases.find((item) => item.id === id);
    const edited = revised.cases.find((item) => item.id === id);
    assert.equal(actual.template.body, edited.paragraphs.map((item) => item.text).join("\n\n"));
    assert.notEqual(
      actual.template.body,
      benchmark.paragraphs.map((item) => item.text).join("\n\n"),
    );
    assert.equal(actual.template.headline, benchmark.headline);
    assert.equal(actual.template.prompt, benchmark.reflection);
    assert.equal(actual.contextSourceHash, benchmark.sourceHash);
  }
  assert.deepEqual(
    plan.cases.map((item) => item.id),
    [
      "contact-only",
      "natal-only",
      "transit-only",
      "natal-and-transit",
      "synthesis-natal-and-transit",
    ],
  );
  assert.equal(plan.attemptLimit, 5);
  assert.equal(plan.contextPilot.dollarCeilingMicros, 5_000_000);
});

// Losing the runtime identity or replacing rejected fallback with the review benchmark
// would make saved captures misrepresent what a member would receive.
test("saved context output distinguishes member runtime fallback from the unchanged review standard", async () => {
  const plan = plans.createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  const evaluation = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  const result = await evaluation.runSyntheticEvaluationCase(
    "contact-only",
    plan.contextPilot.candidate,
    "gemini-enterprise",
    undefined,
    { boundedQualification: true },
    "daily-context-1",
  );
  const frozen = plan.cases.find((item) => item.id === "contact-only");
  const benchmark = plan.contextPilot.benchmarks.cases.find((item) => item.id === "contact-only");
  assert.equal(result.case.output.mode, "template");
  assert.equal(result.case.output.body, frozen.template.body);
  assert.notEqual(
    result.case.output.body,
    benchmark.paragraphs.map((item) => item.text).join("\n\n"),
  );
  assert.deepEqual(result.metadata.contextRuntime, {
    path: "member-production-context",
    memberAdapterVersion: "daily-member-context-1",
  });
  assert.deepEqual(result.case.contextRuntime, {
    mode: "contact-only",
    benchmarkSourceHash: "9d9512094268684f5ebeef23fcdde6d1bc07d7750c94c034bae4e61121a2e656",
    fallbackBodyHash: sha256(frozen.template.body),
    benchmarkBodyHash: sha256(benchmark.paragraphs.map((item) => item.text).join("\n\n")),
  });
  assert.match(result.metadata.warning, /runtime fallback.*original review benchmarks/i);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

// A combined report must not promote its first case's identity to all five cases.
test("combining all five production contexts retains each source and fallback identity on its own case", async () => {
  const plan = plans.createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  const evaluation = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  const shared = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.shared.ts");
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  const results = [];
  for (const frozen of plan.cases)
    results.push(
      await evaluation.runSyntheticEvaluationCase(
        frozen.id,
        plan.contextPilot.candidate,
        "gemini-enterprise",
        undefined,
        { boundedQualification: true },
        "daily-context-1",
      ),
    );
  const combined = shared.combineReadingEvaluationResults(results);
  assert.deepEqual(combined.contextRuntime, {
    path: "member-production-context",
    memberAdapterVersion: "daily-member-context-1",
  });
  assert.equal(combined.cases.length, 5);
  for (const [index, actual] of combined.cases.entries()) {
    const frozen = plan.cases[index];
    const benchmark = plan.contextPilot.benchmarks.cases[index];
    assert.equal(actual.id, frozen.id);
    assert.deepEqual(actual.contextRuntime, {
      mode: frozen.id,
      benchmarkSourceHash: benchmark.sourceHash,
      fallbackBodyHash: sha256(frozen.template.body),
      benchmarkBodyHash: sha256(benchmark.paragraphs.map((item) => item.text).join("\n\n")),
    });
    assert.equal(actual.output.body, frozen.template.body);
  }
  const mixedAdapters = structuredClone(results);
  mixedAdapters[1].metadata.contextRuntime.memberAdapterVersion = "daily-member-context-unreviewed";
  assert.throws(
    () => shared.combineReadingEvaluationResults(mixedAdapters),
    /configuration changed/,
  );
  assert.equal(h.geminiEnterpriseRequests.length, 5);
  assert.equal(h.gatewayRequests.length, 0);
});
