#!/usr/bin/env node
/** Offline only: the records harness rejects every unconfigured external request. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRecordsHarness } from "../tests/helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "../tests/helpers/context-writing-fixture.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--out")
  throw Error("Usage: node scripts/validate-context-writing-candidate.mjs --out <new-directory>");
const output = resolve(args[1]);
await mkdir(output, { recursive: false });
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const packet = await readContextBenchmarks();
const sourceFiles = [
  "src/lib/ai/language.server.ts",
  "src/lib/ai/daily-context-writing.ts",
  "src/lib/ai/context-writing-material.json",
  "src/lib/ai/context-pilot-plan.server.ts",
  "src/lib/ai/daily-context-candidate.server.ts",
  "src/lib/ai/facts.ts",
  "src/lib/ai/transit-story-facts.ts",
  "src/lib/ai/daily-writing-quality.ts",
  "src/lib/ai/daily-modality.ts",
  "src/lib/content/natal-lens-policy.ts",
  "src/lib/reading.server.ts",
  "tests/helpers/context-writing-fixture.mjs",
  "scripts/validate-context-writing-candidate.mjs",
  "docs/reviews/daily-reading-context-writer/2026-10-17/benchmark-drafts.json",
  "docs/reviews/daily-reading-release/2026-10-17/bundle.json",
];
const runtime = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (path) => [path, sha256(await readFile(resolve(projectRoot, path)))]),
  ),
);
const h = await createRecordsHarness();
const results = [];
try {
  const language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  const briefModule = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  const { canonicalContentJson } = await h.vite.ssrLoadModule(
    "/src/lib/content/draft-comparison.ts",
  );
  for (const benchmark of packet.cases) {
    const fixed = await contextWritingFixture(h, benchmark);
    assert.equal(sha256(canonicalContentJson(fixed.bundle)), packet.sourceBundle.checksum);
    h.setGateway(() =>
      Response.json({
        choices: [{ message: { content: JSON.stringify({ paragraphs: benchmark.paragraphs }) } }],
      }),
    );
    const result = await language.generateSyntheticReadingProse(
      fixed.input,
      "lovable",
      {},
      benchmark,
    );
    assert.equal(
      result.prose.meta.mode,
      "model",
      `intercepted contract acceptance: ${benchmark.id}`,
    );
    assert.equal(result.prose.meta.diagnostics.promptVersion, "daily-context-body-2");
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
    assert.equal(result.prose.headline, benchmark.headline);
    assert.equal(result.prose.prompt, benchmark.reflection);
    assert.equal(result.prose.meta.writing.finalQuality.outcome === "reject", false);
    const before = h.gatewayRequests.length;
    h.setGateway(() => new Response(null, { status: 503 }));
    const unavailable = await language.generateSyntheticReadingProse(
      fixed.input,
      "lovable",
      {},
      benchmark,
    );
    assert.equal(unavailable.prose.meta.mode, "template");
    assert.equal(unavailable.prose.body, result.prose.body);
    assert.equal(h.gatewayRequests.length - before, 1);
    const firstTwo = new Set(result.prose.meta.citations.slice(0, 2).flatMap((p) => p.facts));
    for (const id of benchmark.requiredFacts) assert.ok(firstTwo.has(id));
    const capture = {
      id: benchmark.id,
      contextMode: benchmark.contextMode,
      fixture: benchmark.fixture,
      config: benchmark.config,
      sourceHash: benchmark.sourceHash,
      selectedSources: benchmark.selectedSources,
      brief: briefModule.toDailyContextBrief(fixed.facts, fixed.config.tone, fixed.config.depth),
      previousWriter: {
        headline: fixed.input.fallback.headline,
        body: fixed.input.fallback.body,
        reflection: fixed.input.fallback.prompt,
      },
      candidate: {
        headline: result.prose.headline,
        paragraphs: benchmark.paragraphs,
        reflection: result.prose.prompt,
      },
      validation: {
        transport: "offline-intercepted-response",
        liveProviderRequests: 0,
        sourceGraphBound: true,
        completeEarlyCoverage: true,
        chronologyOccurrences: benchmark.chronology
          ? result.prose.body.split(benchmark.chronology).length - 1
          : 0,
        authoredResponseAcceptedBySharedValidator: true,
        candidateFinalQuality: result.prose.meta.writing.finalQuality,
        completeFallbackAfterIntercepted503: true,
        fallbackDiagnostics: unavailable.prose.meta.diagnostics,
      },
      assembledRequest: result.request,
    };
    await writeFile(
      resolve(output, `${benchmark.id}.json`),
      JSON.stringify(capture, null, 2) + "\n",
    );
    results.push({
      id: benchmark.id,
      sourceHash: benchmark.sourceHash,
      contextMode: benchmark.contextMode,
      artifact: `${benchmark.id}.json`,
      wordCount: result.prose.body.split(/\s+/).length,
      validated: true,
    });
  }
  assert.equal(h.gatewayRequests.length, 10);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  const manifest = {
    version: "daily-context-candidate-validation-2",
    completedAt: new Date().toISOString(),
    gitHead: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8",
    }).trim(),
    identity:
      "source-file SHA256 hashes include uncommitted candidate implementation; gitHead alone does not identify this candidate",
    sourceFiles: runtime,
    evidence: {
      mode: "offline-authored-contract-validation",
      liveProviderRequests: 0,
      interceptedRequests: h.gatewayRequests.length,
      paidRequests: 0,
      memberRecordsWritten: 0,
      deployed: false,
      activated: false,
      humanReviewCompleted: false,
      warning:
        "Authored text was supplied through intercepted transport to exercise real request construction, whole-draft validation and fallback. This is not actual model output, provider qualification, production evidence or member research.",
    },
    cases: results,
  };
  await writeFile(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  process.stdout.write(
    `Validated ${results.length} source-bound authored cases and complete failure fallbacks; zero live provider requests. Artifacts: ${output}\n`,
  );
} finally {
  await h.close();
}
