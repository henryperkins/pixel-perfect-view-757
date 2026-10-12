/** Offline source/template checks and exact assembled requests. Never sends a provider request. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { BASELINE_RESPONSES } from "../../../../scripts/reading-eval-cases.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const [outputArg] = process.argv.slice(2);
assert.ok(outputArg, "Provide a new output directory");
const output = resolve(outputArg);
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", "src", "scripts"], { cwd: ROOT });
const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
const cases = ["arc-single-pass", "arc-opening-three", "arc-return-three", "arc-closing-three",
  "arc-between-passes", "arc-synthesis-natal-integration", "arc-truncated-scan", "quiet-threshold"];
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_ENTERPRISE_API_KEY;
process.env.GEMINI_ENTERPRISE_API_KEY = "offline-preflight-no-network";
let current, nativeRequest, intercepted = 0;
globalThis.fetch = async (url, init) => {
  assert.equal(String(url), "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent");
  assert.equal(init?.method, "POST");
  assert.ok(current && !nativeRequest, "Only one intercepted request per case");
  intercepted++;
  nativeRequest = JSON.parse(init.body);
  return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(BASELINE_RESPONSES[current]) }] } }] });
};
const vite = await createServer({ root: ROOT, configFile: false, envFile: false, appType: "custom",
  logLevel: "error", server: { middlewareMode: true, hmr: false, ws: false } });
try {
  const { runSyntheticEvaluationCase } = await vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  const { TRANSIT_CANDIDATE_BUNDLE: bundle } = await vite.ssrLoadModule("/src/lib/content/transit-candidate-bundle.ts");
  const { safetyPass } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const { validateContentGraph } = await vite.ssrLoadModule("/src/lib/content/schema.ts");
  validateContentGraph(bundle);
  await mkdir(output, { mode: 0o700 });
  const rows = [];
  for (const caseId of cases) {
    current = caseId;
    nativeRequest = null;
    const { case: row } = await runSyntheticEvaluationCase(caseId, bundle, "gemini-enterprise");
    assert.deepEqual(safetyPass(row.template.body).flagged, [], `${caseId} template`);
    for (const fact of row.facts)
      assert.deepEqual(safetyPass(fact.statement).flagged, [], `${caseId} ${fact.id}`);
    if (row.request) {
      const system = row.request.messages.find((m) => m.role === "system").content;
      const user = row.request.messages.find((m) => m.role === "user").content;
      assert.equal(nativeRequest.systemInstruction.parts[0].text, system);
      assert.equal(nativeRequest.contents[0].parts[0].text, user);
      assert.deepEqual(nativeRequest.generationConfig.responseJsonSchema, row.request.response_format.json_schema.schema);
      const arc = user.split("\n").find((line) => line.startsWith("Copy A1's chronology"));
      if (row.facts.some((f) => f.id === "A1")) {
        assert.ok(arc);
        assert.doesNotMatch(arc, /S1|N1/);
      } else assert.equal(arc, undefined);
      assert.equal(row.diagnostics.outcome, "accepted", `${caseId} hand-written positive control`);
      assert.equal(row.diagnostics.promptVersion, "daily-astro-body-13");
      assert.equal(row.diagnostics.validatorVersion, "daily-reference-10");
      if (caseId === "arc-opening-three") {
        const markdown = `# Opening request assembled offline\n\nSource: ${revision}. No provider call was made.\n\n## System\n\n\`\`\`text\n${system}\n\`\`\`\n\n## User\n\n\`\`\`text\n${user}\n\`\`\`\n\n## Response schema\n\n\`\`\`json\n${JSON.stringify(row.request.response_format.json_schema.schema, null, 2)}\n\`\`\`\n`;
        await writeFile(resolve(output, "opening-prompt.md"), markdown, { flag: "wx" });
        await writeFile(resolve(output, "opening-native-request.json"), json(nativeRequest), { flag: "wx" });
      }
    } else {
      assert.equal(row.diagnostics.code, "no_cycle");
      assert.equal(nativeRequest, null);
    }
    rows.push({ caseId, sourceFactsPass: true, templatePass: true,
      syntheticPositiveControlOutcome: row.diagnostics.outcome,
      facts: row.facts, template: row.template, request: row.request, nativeRequest });
  }
  assert.equal(intercepted, 7);
  const result = { kind: "offline-source-template-request-preflight", sourceRevision: revision,
    bundleSha256: hash(JSON.stringify(bundle)), providerCallsMade: 0, interceptedRequests: intercepted,
    modelGenerationEstablished: false,
    limitation: "Bounded imperative patterns and hand-written structural controls; independent writing review is still required.", rows };
  await writeFile(resolve(output, "preflight.json"), json(result), { flag: "wx" });
  console.log(json({ cases: rows.length, sourceAndTemplateChecksPassed: true, providerCalls: 0, interceptedRequests: intercepted }));
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GEMINI_ENTERPRISE_API_KEY;
  else process.env.GEMINI_ENTERPRISE_API_KEY = originalKey;
  await vite.close();
}
