import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Run separately for each source checkout so Vite's module cache cannot mix versions.
// The production evaluator blocks all networking and supplies handwritten test JSON.
// This artifact retains only deterministic templates, never those replayed candidates.
const [sourceRoot, outputPath] = process.argv.slice(2);
if (!sourceRoot || !outputPath) {
  throw new Error("Usage: node capture-templates.mjs SOURCE_ROOT NEW_OUTPUT_JSON");
}
const root = resolve(sourceRoot);
const { evaluateReadings } = await import(
  pathToFileURL(resolve(root, "scripts/evaluate-readings.mjs")).href
);
const sourceFiles = [
  "src/lib/reading.server.ts",
  "src/lib/ai/diagnostics.ts",
  "src/lib/ai/daily-voice.ts",
  "src/lib/ai/language.server.ts",
  "src/lib/content/default-bundle.ts",
  "src/lib/content/natal-candidate-bundle.ts",
  "src/lib/content/natal-lens-catalogue.ts",
  "src/lib/content/transit-candidate-bundle.ts",
];
const hash = (text) => createHash("sha256").update(text).digest("hex");
const hashes = {};
for (const path of sourceFiles) hashes[path] = hash(await readFile(resolve(root, path)));
// The base revision predates this module; its absence must not block reproduction.
const composerPath = "src/lib/content/natal-template.ts";
try {
  hashes[composerPath] = hash(await readFile(resolve(root, composerPath)));
  for (const path of [
    "src/lib/pattern.server.ts",
    "src/lib/content/transit-story-storage.server.ts",
  ]) {
    hashes[path] = hash(await readFile(resolve(root, path)));
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const snapshots = [];
for (const bundleSource of ["builtin", "natal-candidate", "transit-candidate"]) {
  const report = await evaluateReadings({ bundleSource });
  snapshots.push({
    bundleSource,
    bundleVersion: report.bundleVersion,
    bundleHash: report.bundleHash,
    transitCopyHash: report.transitCopyHash,
    fixtureVersion: report.fixtureVersion,
    caseSetHash: report.caseSetHash,
    promptVersion: report.promptVersion,
    validatorVersion: report.validatorVersion,
    cases: report.cases.map((row) => ({
      id: row.id,
      configHash: row.configHash,
      tone: row.config.tone,
      depth: row.config.depth,
      lensRuleKey: row.natalLensPlan.lens?.ruleKey ?? null,
      storyStatus: row.transitStoryPlan.status,
      facts: row.facts,
      headline: row.output.headline,
      prompt: row.output.prompt,
      templateBody: row.template.body,
    })),
  });
}
await writeFile(
  resolve(outputPath),
  `${JSON.stringify(
    {
      artifactVersion: "natal-template-preview-1",
      kind: "offline-template-preview",
      network: "blocked; handwritten model fixtures replayed only by the capture harness",
      qualification: "unqualified; no actual model outputs or blinded scores in this artifact",
      sourceHashes: hashes,
      snapshots,
    },
    null,
    2,
  )}\n`,
  { flag: "wx" },
);
