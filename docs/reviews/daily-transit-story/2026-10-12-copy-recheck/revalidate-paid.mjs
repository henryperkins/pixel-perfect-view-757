import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", "src", "scripts", "package.json", "package-lock.json"], { cwd: ROOT, stdio: "pipe" });
const [capturePath, outputPath] = process.argv.slice(2);
assert.ok(capturePath && outputPath);
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
  for (const sample of capture.samples) {
    current = sample.result.case;
    if (!current.candidate?.captureLossless) continue;
    const before = intercepts;
    const result = await runSyntheticEvaluationCase(
      current.id,
      TRANSIT_CANDIDATE_BUNDLE,
      "gemini-enterprise",
    );
    assert.equal(intercepts, before + 1);
    assert.deepEqual(result.case.request, current.request, "A generating prompt changed");
    assert.deepEqual(result.case.facts, current.facts, "Supplied facts changed");
    assert.deepEqual(result.case.candidate, current.candidate, "Captured prose changed");
    samples.push({
      sampleId: sample.sampleId,
      caseId: current.id,
      originalOutcome: current.diagnostics.outcome,
      originalValidatorVersion: current.diagnostics.validatorVersion,
      outcome: result.case.diagnostics.outcome,
      code: result.case.diagnostics.code,
      validatorVersion: result.case.diagnostics.validatorVersion,
      requestUnchanged: true,
      rawDraftUnchanged: true,
    });
  }
  const output = {
    kind: "offline-revalidation-of-lossless-paid-drafts",
    sourceRevision,
    modelGeneratingRevision: capture.sourceRevision,
    paidCaptureSha256: createHash("sha256").update(bytes).digest("hex"),
    providerCallsMade: 0,
    interceptedRequests: intercepts,
    allRequestsUnchanged: samples.every((s) => s.requestUnchanged),
    allRawDraftsUnchanged: samples.every((s) => s.rawDraftUnchanged),
    allAccepted: samples.length === 6 && samples.every((s) => s.outcome === "accepted"),
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
