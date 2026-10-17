import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, shared;
before(async () => {
  h = await createRecordsHarness();
  shared = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.shared.ts");
});
after(async () => h?.close());

test("context pilot accepts only its closed preview and source-pinned start contract", () => {
  const preview = { mode: "context-pilot" };
  const start = { ...preview, expectedPlanHash: "a".repeat(64) };
  assert.deepEqual(shared.readingEvaluationPreviewInputSchema.parse(preview), preview);
  assert.deepEqual(shared.readingEvaluationRunInputSchema.parse(start), start);
  for (const data of [
    preview,
    { ...start, expectedPlanHash: "bad" },
    { ...start, provider: "lovable" },
    { ...start, budget: 9999 },
    { ...start, caseIds: ["other"] },
  ])
    assert.equal(shared.readingEvaluationRunInputSchema.safeParse(data).success, false);
  for (const data of [
    { ...preview, caseIds: ["other"] },
    { ...preview, provider: "lovable" },
  ])
    assert.equal(shared.readingEvaluationPreviewInputSchema.safeParse(data).success, false);
});

test("partial context pilot scope never describes authored fields or fallback as generated success", () => {
  const scope = shared.readingEvaluationReportScope({
    status: "halted",
    total: 5,
    completed: 2,
    contextPilot: { version: "daily-context-pilot-1", benchmarkHash: "b".repeat(64) },
  });
  assert.match(scope, /context/i);
  assert.match(scope, /five|5/i);
  assert.match(scope, /headline.*reflection.*authored/i);
  assert.match(scope, /fallback/i);
});

// A fresh production-path campaign must keep the authored runtime fallback distinct
// from the original benchmark even when only a partial capture is available.
test("fourth context campaign reports independent runtime fallbacks for partial captures", () => {
  const scope = shared.readingEvaluationReportScope({
    status: "halted",
    total: 5,
    completed: 2,
    contextPilot: { version: "daily-context-pilot-4", benchmarkHash: "b".repeat(64) },
  });
  assert.match(scope, /runtime fallback bodies.*original review benchmarks.*separately/i);
  assert.match(scope, /partial captures cannot qualify/i);
});
