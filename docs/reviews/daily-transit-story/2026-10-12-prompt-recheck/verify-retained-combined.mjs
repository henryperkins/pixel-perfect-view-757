import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", "src", "scripts", "package.json", "package-lock.json"], { cwd: ROOT, stdio: "pipe" });
const [capturePath, outputPath, reviewedTemplatesPath] = process.argv.slice(2);
assert.ok(capturePath && outputPath && reviewedTemplatesPath);
const reviewedTemplatesBytes = await readFile(reviewedTemplatesPath);
const reviewedTemplates = JSON.parse(reviewedTemplatesBytes);
const bytes = await readFile(capturePath);
const capture = JSON.parse(bytes);
const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_ENTERPRISE_API_KEY;
process.env.GEMINI_ENTERPRISE_API_KEY = "offline-replay-no-network";
let current = null;
let intercepts = 0;
globalThis.fetch = async (url, init) => {
  assert.ok(current, "No scheduled replay");
  assert.equal(
    String(url),
    "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent",
  );
  assert.equal(init?.method, "POST");
  intercepts += 1;
  return Response.json({
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify({ paragraphs: current.candidate.paragraphs }) }],
        },
      },
    ],
  });
};
const vite = await createServer({
  root: ROOT,
  configFile: false,
  envFile: false,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { runSyntheticEvaluationCase } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  );
  const { TRANSIT_CANDIDATE_BUNDLE } = await vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  const samples = [];
  const editorialFact = (f) => ({ id: f.id, statement: f.statement, ...(f.kind ? { kind: f.kind } : {}), ...(f.dependsOn ? { dependsOn: f.dependsOn } : {}) });
  for (const sample of capture.samples) {
    if (sample.caseId !== "arc-synthesis-natal-integration") continue;
    current = sample.result.case;
    if (!current.candidate?.captureLossless) continue;
    const before = intercepts;
    const result = await runSyntheticEvaluationCase(
      current.id,
      TRANSIT_CANDIDATE_BUNDLE,
      "gemini-enterprise",
    );
    assert.equal(intercepts, before + 1);
    const oldPhase = current.facts.find((f) => f.id === "P1").statement;
    const newPhase = result.case.facts.find((f) => f.id === "P1").statement;
    const expectedRequest = structuredClone(current.request);
    expectedRequest.messages.find((m) => m.role === "user").content = expectedRequest.messages.find((m) => m.role === "user").content.replace(oldPhase, newPhase);
    expectedRequest.messages.find((m) => m.role === "user").content = expectedRequest.messages.find((m) => m.role === "user").content.replace("Combine S1/N1/P2 naturally within the existing four-sentence paragraph limit", "Keep this integration within the existing four-sentence paragraph limit");
    assert.deepEqual(result.case.request, expectedRequest, "Unexpected change beyond optional P1 and arc integration guidance");
    const used = new Set(current.candidate.paragraphs.flatMap((p) => p.facts));
    assert.equal(used.has("P1"), false);
    assert.deepEqual(result.case.facts.filter((f) => used.has(f.id)).map(editorialFact), current.facts.filter((f) => used.has(f.id)).map(editorialFact), "A cited statement changed");
    assert.equal(result.case.template.body, reviewedTemplates.results.find((r) => r.case.id === current.id).case.template.body, "Retained combined template changed after its corrected review");
    assert.deepEqual(result.case.candidate, current.candidate, "Captured prose changed");
    samples.push({
      sampleId: sample.sampleId,
      caseId: current.id,
      originalOutcome: current.diagnostics.outcome,
      originalValidatorVersion: current.diagnostics.validatorVersion,
      outcome: result.case.diagnostics.outcome,
      code: result.case.diagnostics.code,
      validatorVersion: result.case.diagnostics.validatorVersion,
      requestUnchanged: false,
      requestChange: "Unused P1 editorial wording and the arc integration sentence; no new generation is claimed",
      allUsedEditorialStatementsUnchanged: true,
      rawDraftUnchanged: true,
    });
  }
  const output = {
    kind: "retained-combined-editorial-pass-compatibility",
    sourceRevision,
    modelGeneratingRevision: capture.sourceRevision,
    currentRequestGenerationEstablished: false,
    paidCaptureSha256: createHash("sha256").update(bytes).digest("hex"),
    reviewedTemplatesSha256: createHash("sha256").update(reviewedTemplatesBytes).digest("hex"),
    providerCallsMade: 0,
    interceptedRequests: intercepts,
    allRequestsUnchanged: samples.every((s) => s.requestUnchanged),
    allRawDraftsUnchanged: samples.every((s) => s.rawDraftUnchanged),
    allAccepted: samples.length === 1 && samples.every((s) => s.outcome === "accepted"),
    samples,
  };
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(
    JSON.stringify({ revalidated: samples.length, accepted: output.allAccepted, providerCalls: 0 }),
  );
} finally {
  current = null;
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GEMINI_ENTERPRISE_API_KEY;
  else process.env.GEMINI_ENTERPRISE_API_KEY = originalKey;
  await vite.close();
}
