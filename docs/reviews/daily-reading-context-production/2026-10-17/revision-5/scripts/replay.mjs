// Replays authored or saved paragraphs as the intercepted provider response through
// the frozen pilot path. Usage: node replay.mjs <worktree>
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const [root] = process.argv.slice(2);
process.env.PATTERN_TEST_PROJECT_ROOT = root;
const { createRecordsHarness } = await import(pathToFileURL(`${root}/tests/helpers/records-harness.mjs`).href);
const h = await createRecordsHarness();
const dir = `${root}/docs/reviews/daily-reading-context-production/2026-10-17`;
try {
  const plans = await h.vite.ssrLoadModule("/src/lib/ai/context-pilot-plan.server.ts");
  const evaluation = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  const plan = plans.createContextPilotPlan("0".repeat(40), "gemini-enterprise");
  const refs = JSON.parse(await readFile(`${dir}/revision-5/reference-readings.json`, "utf8")).cases;
  const edits = JSON.parse(await readFile(`${dir}/revision-5/edited-failures.json`, "utf8")).cases;
  const sets = [
    ...refs.map((r) => ({ label: `reference ${r.id}`, id: r.id, paragraphs: r.paragraphs })),
    ...edits.map((e) => ({ label: `edited ${e.blindLabel} ${e.id}`, id: e.id, paragraphs: e.edited.paragraphs })),
    ...edits.map((e) => ({ label: `original ${e.blindLabel} ${e.id}`, id: e.id, paragraphs: e.original.paragraphs.map((p) => ({ ...p, scenes: [] })) })),
  ];
  for (const set of sets) {
    h.setGeminiEnterprise(() =>
      Response.json({
        modelVersion: "gemini-3.8-flash",
        candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ paragraphs: set.paragraphs }) }] } }],
      }),
    );
    const result = await evaluation.runSyntheticEvaluationCase(set.id, plan.contextPilot.candidate, "gemini-enterprise", undefined, { boundedQualification: true }, "daily-context-1");
    const body = set.paragraphs.map((p) => p.text).join("\n\n");
    console.log(`${set.label.padEnd(48)} mode=${result.case.output.mode} code=${result.case.diagnostics.code} p=${result.case.diagnostics.paragraph} exactBody=${result.case.output.body === body} quality=${result.case.writing?.candidateQuality?.outcome}`);
  }
  console.log("intercepted provider requests:", h.geminiEnterpriseRequests.length, "lovable:", h.gatewayRequests.length);
} finally {
  await h.close();
}
