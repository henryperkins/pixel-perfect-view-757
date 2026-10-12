import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", "src", "scripts", "package.json", "package-lock.json"], { cwd: ROOT, stdio: "pipe" });
const [outputPath, releasePath] = process.argv.slice(2);
assert.ok(outputPath && releasePath, "Provide new template and release artifact paths");
const CASES = [
  "arc-single-pass",
  "arc-opening-three",
  "arc-return-three",
  "arc-closing-three",
  "arc-between-passes",
  "arc-synthesis-natal-integration",
  "arc-truncated-scan",
  "quiet-threshold",
];
delete process.env.GEMINI_ENTERPRISE_API_KEY;
delete process.env.LOVABLE_API_KEY;
const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("All network requests blocked during offline capture");
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
  const { validateContentGraph } = await vite.ssrLoadModule("/src/lib/content/schema.ts");
  validateContentGraph(TRANSIT_CANDIDATE_BUNDLE);
  const results = [];
  for (const caseId of CASES) {
    const result = await runSyntheticEvaluationCase(
      caseId,
      TRANSIT_CANDIDATE_BUNDLE,
      "gemini-enterprise",
    );
    assert.equal(result.case.diagnostics.attempted, false);
    assert.equal(result.case.candidate, null);
    assert.equal(result.case.output.body, result.case.template.body);
    results.push(result);
  }
  assert.equal(fetchCalls, 0);
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  const release = { ...TRANSIT_CANDIDATE_BUNDLE, version: "0.7.0" };
  validateContentGraph(release);
  await writeFile(releasePath, json(release), { flag: "wx", mode: 0o600 });
  await writeFile(
    outputPath,
    json({
      kind: "offline-transit-template-capture",
      sourceRevision,
      providerCallsMade: 0,
      fetchCalls,
      candidateBundleSha256: createHash("sha256")
        .update(JSON.stringify(TRANSIT_CANDIDATE_BUNDLE))
        .digest("hex"),
      releaseArtifactSha256: createHash("sha256").update(json(release)).digest("hex"),
      releaseDifference: "Only version changes from builtin-0.7.0 to 0.7.0",
      results,
    }),
    { flag: "wx", mode: 0o600 },
  );
  console.log(JSON.stringify({ templates: results.length, providerCalls: 0, release: "0.7.0" }));
} finally {
  globalThis.fetch = originalFetch;
  await vite.close();
}
