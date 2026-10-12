/** Offline integrity checks only. This never loads credentials or calls a provider. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareNatalReports } from "../../../../scripts/evaluate-readings.mjs";
import { pairedSchedule, runtimeDeadlineTransform } from "./run-model-pair.mjs";

const [runDirectory, newOutput, ...extra] = process.argv.slice(2);
assert(
  runDirectory && newOutput && extra.length === 0,
  "Usage: node verify-evidence.mjs RUN_DIR NEW_JSON",
);
try {
  await access(newOutput);
  throw new Error("Integrity output already exists; no overwrite is permitted");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const load = async (name) => {
  const bytes = await readFile(resolve(runDirectory, name));
  return { value: JSON.parse(bytes), sha256: hash(bytes) };
};
const gitBytes = (...args) =>
  execFileSync("git", args, {
    cwd: projectRoot,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
const [before, after, beforeIdentity, afterIdentity, source, plan, finish] = await Promise.all([
  load("builtin-report.json"),
  load("natal-candidate-report.json"),
  load("builtin-identity.json"),
  load("natal-candidate-identity.json"),
  load("source-manifest.json"),
  load("run-plan.json"),
  load("run-finished.json"),
]);
const frozen = source.value;
assert.match(frozen.sourceRevision, /^[a-f0-9]{40}$/);
assert(Array.isArray(frozen.trackedSourceFiles) && frozen.trackedSourceFiles.length > 0);
const paths = frozen.trackedSourceFiles.map((file) => file.path);
assert.deepEqual(paths, [...new Set(paths)].sort());
const scope = [
  "src",
  "scripts",
  "package.json",
  "bun.lock",
  "pnpm-lock.yaml",
  "package-lock.json",
  "tsconfig.json",
];
const gitPaths = gitBytes("ls-tree", "-r", "--name-only", frozen.sourceRevision, "--", ...scope)
  .toString("utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .sort();
assert.deepEqual(
  paths,
  gitPaths,
  "Source manifest must cover the entire frozen runtime source/dependency scope",
);
for (const file of frozen.trackedSourceFiles) {
  assert.match(file.sha256, /^[a-f0-9]{64}$/);
  assert.equal(
    hash(gitBytes("show", `${frozen.sourceRevision}:${file.path}`)),
    file.sha256,
    file.path,
  );
}
assert.equal(hash(json(frozen.trackedSourceFiles)), frozen.trackedSourceSha256);
assert.equal(
  hash(
    await readFile(
      join(
        projectRoot,
        "docs/reviews/daily-natal-lens/2026-10-12-qualification-round-3/run-model-pair.mjs",
      ),
    ),
  ),
  frozen.runnerSha256,
);
const diagnosticsPath = "src/lib/ai/diagnostics.ts";
const frozenDiagnostics = gitBytes("show", `${frozen.sourceRevision}:${diagnosticsPath}`).toString(
  "utf8",
);
assert(frozenDiagnostics.includes('export const DAILY_PROMPT_VERSION = "daily-astro-body-11";'));
assert(frozenDiagnostics.includes('export const DAILY_VALIDATOR_VERSION = "daily-reference-7";'));
assert(frozenDiagnostics.includes('"editorial_claim"'));
const expectedOverride = runtimeDeadlineTransform(frozenDiagnostics).record;
assert.equal(
  expectedOverride.originalModuleSha256,
  frozen.trackedSourceFiles.find((file) => file.path === diagnosticsPath).sha256,
);
assert.equal(expectedOverride.servingDeadlineMs, 60_000);
assert.equal(expectedOverride.runtimeDeadlineMs, 120_000);
assert.deepEqual(frozen.runtimePolicyOverride, expectedOverride);
const mainRevision = gitBytes("rev-parse", "main").toString("utf8").trim();
const mainDiagnostics = gitBytes("show", `${mainRevision}:${diagnosticsPath}`).toString("utf8");
assert.equal(
  mainDiagnostics.split("export const DAILY_GATEWAY_TIMEOUT_MS = 60_000;").length - 1,
  1,
);
const contexts = [
  plan.value.executionContext,
  finish.value.executionContext,
  beforeIdentity.value.build.executionContext,
  afterIdentity.value.build.executionContext,
];
for (const context of contexts) {
  assert.equal(context.kind, "local-extended-deadline-synthetic-capture");
  assert.equal(context.servingAvailabilityEstablished, false);
  assert.equal(context.hostedWorkflowExecuted, false);
  assert.equal(context.adminAuthenticationVerified, false);
  assert.equal(context.productionVerified, false);
  assert.equal(context.databaseOrReadingCacheAccessed, false);
  assert.equal(context.contentActivated, false);
  assert.deepEqual(context.runtimePolicyOverride, expectedOverride);
}
assert(contexts.every((context) => JSON.stringify(context) === JSON.stringify(contexts[0])));
for (const record of [
  frozen,
  plan.value,
  finish.value,
  beforeIdentity.value.build,
  afterIdentity.value.build,
]) {
  assert.equal(record.servingDeadlineMs, 60_000);
  assert.equal(record.runtimeDeadlineMs, 120_000);
  assert.deepEqual(record.runtimePolicyOverride, expectedOverride);
  assert.equal(record.sourceRevision, frozen.sourceRevision);
  assert.equal(record.trackedSourceSha256, frozen.trackedSourceSha256);
  // run-finished.json binds runtime policy/source; the plan and sidecars also bind runner bytes.
  if (record !== finish.value) assert.equal(record.runnerSha256, frozen.runnerSha256);
}
assert.equal(plan.value.mode, "--run");
assert.equal(plan.value.configured, true);
assert.equal(plan.value.provider, "gemini-enterprise");
assert.equal(plan.value.model, "gemini-enterprise/gemini-3.8-flash");
assert.deepEqual(plan.value.bundleSources, ["builtin", "natal-candidate"]);
assert.equal(plan.value.casesPerBundle, 38);
assert.equal(plan.value.fixtureVersion, "synthetic-daily-6");
assert.equal(plan.value.maximumModelAttempts, 74);
assert.equal(plan.value.retries, 0);
assert.equal(plan.value.resumeSupported, false);
assert.equal(plan.value.concurrency, 1);
assert.equal(plan.value.trackedSourceFiles, paths.length);
assert.equal(finish.value.status, "complete");
assert.equal(finish.value.haltReason, null);
assert.equal(finish.value.unsettledCase, null);
assert.equal(finish.value.retries, 0);
assert.equal(finish.value.resumeSupported, false);
assert.equal(finish.value.concurrency, 1);
assert.equal(finish.value.sourceUnchangedThroughout, true);
assert.equal(finish.value.transportAttempts, 74);
assert.equal(finish.value.startedModelCases, 74);
assert.deepEqual(finish.value.completedCases, { builtin: 38, "natal-candidate": 38 });
for (const [name, report, identity] of [
  ["builtin", before, beforeIdentity],
  ["natal-candidate", after, afterIdentity],
]) {
  assert.equal(report.value.partial, false);
  assert.equal(report.value.cases.length, 38);
  assert.equal(report.value.expectedCases, 38);
  assert.equal(report.value.summary.modelAttempts, 37);
  assert.equal(report.value.gatewayTimeoutMs, 120_000);
  assert.equal(report.value.promptVersion, "daily-astro-body-11");
  assert.equal(report.value.validatorVersion, "daily-reference-7");
  assert.equal(report.value.model, plan.value.model);
  assert.equal(report.value.bundleSource, name);
  assert(report.value.cases.every((row) => row.diagnostics.gatewayTimeoutMs === 120_000));
  assert(
    report.value.cases.every(
      (row) =>
        row.diagnostics.promptVersion === report.value.promptVersion &&
        row.diagnostics.validatorVersion === report.value.validatorVersion &&
        row.diagnostics.model === report.value.model,
    ),
  );
  assert(
    report.value.cases.every((row) =>
      Object.values(row.manualReview).every((value) => value === null),
    ),
  );
  assert(
    report.value.cases.every(
      (row) =>
        row.candidate === null ||
        (row.candidate.captureLossless === true && row.candidate.truncated === false),
    ),
  );
  assert.equal(identity.value.report.path, `${name}-report.json`);
  assert.equal(identity.value.report.sha256, report.sha256);
  assert.deepEqual(
    identity.value.report.recordedMetadata,
    Object.fromEntries(
      Object.entries(report.value).filter(([key]) => !["cases", "summary"].includes(key)),
    ),
  );
  assert.deepEqual(finish.value.completedReports[name], {
    path: `${name}-report.json`,
    sha256: report.sha256,
  });
}
const comparison = compareNatalReports(before.value, after.value, {
  beforeIdentity: beforeIdentity.value,
  afterIdentity: afterIdentity.value,
  beforeSha256: before.sha256,
  afterSha256: after.sha256,
});
assert.equal(comparison.identity.sourceRevisionMatch, true);
assert.deepEqual(comparison.qualificationGaps, []);
const visible = (fact) => ({
  id: fact.id,
  kind: fact.kind ?? null,
  statement: fact.statement,
  dependsOn: fact.dependsOn ?? [],
  ...(fact.cycle ? { cycle: fact.cycle } : {}),
});
const inputChecks = after.value.cases.map((row, index) => {
  const baseline = before.value.cases[index];
  assert.equal(row.id, baseline.id);
  assert.equal(row.configHash, baseline.configHash);
  assert.deepEqual(row.config, baseline.config);
  assert.deepEqual(row.natalReliability, baseline.natalReliability);
  assert.deepEqual(
    row.facts.filter((fact) => fact.id !== "N1").map(visible),
    baseline.facts.map(visible),
  );
  const natal = row.facts.find((fact) => fact.id === "N1");
  assert.equal(Boolean(natal), Boolean(row.natalLensPlan?.lens));
  const requestChanged = JSON.stringify(row.request) !== JSON.stringify(baseline.request);
  assert.equal(requestChanged, Boolean(natal));
  return {
    id: row.id,
    configurationMatches: true,
    reliabilityMatches: true,
    nonNatalFactsMatch: true,
    natalSupplied: Boolean(natal),
    requestChanged,
    templateChanged: row.template.body !== baseline.template.body,
    rawCaptureLossless: {
      before: baseline.candidate?.captureLossless ?? null,
      after: row.candidate?.captureLossless ?? null,
    },
  };
});
assert.equal(inputChecks.filter((row) => row.natalSupplied).length, 9);
assert.equal(inputChecks.filter((row) => row.requestChanged).length, 9);
const schedule = pairedSchedule(before.value.cases);
assert.deepEqual(plan.value.schedule, schedule);
assert.equal(plan.value.scheduleSha256, hash(json(schedule)));
const journalFiles = (await readdir(resolve(runDirectory, "journal"))).sort();
assert.equal(journalFiles.length, 228);
const reportRows = { builtin: before.value.cases, "natal-candidate": after.value.cases };
const metadata = {
  builtin: beforeIdentity.value.report.recordedMetadata,
  "natal-candidate": afterIdentity.value.report.recordedMetadata,
};
let attempts = 0;
let quietCases = 0;
for (const entry of schedule) {
  const { sequence, fixtureIndex, bundleSource, caseId } = entry;
  const stem = `${String(sequence).padStart(3, "0")}-${bundleSource}-${caseId}`;
  const [start, result, transport] = await Promise.all([
    load(`journal/${stem}-start.json`),
    load(`journal/${stem}-result.json`),
    load(`journal/${stem}-transport.json`),
  ]);
  const expectedModel = caseId !== "quiet-threshold";
  assert.equal(start.value.sequence, sequence);
  assert.equal(start.value.fixtureIndex, fixtureIndex);
  assert.equal(start.value.caseId, caseId);
  assert.equal(start.value.bundleSource, bundleSource);
  assert.equal(start.value.provider, plan.value.provider);
  assert.equal(start.value.expectedModel, expectedModel);
  assert.equal(start.value.noRetries, true);
  assert.equal(start.value.sourceRevision, frozen.sourceRevision);
  assert.equal(start.value.sourceSha256, frozen.trackedSourceSha256);
  assert.equal(start.value.servingDeadlineMs, 60_000);
  assert.equal(start.value.runtimeDeadlineMs, 120_000);
  assert.equal(start.value.runtimeOverrideSha256, hash(json(expectedOverride)));
  const row = reportRows[bundleSource][fixtureIndex];
  assert.equal(start.value.configHash, row.configHash);
  assert.deepEqual(result.value.case, row);
  assert.deepEqual(
    result.value.metadata,
    Object.fromEntries(
      Object.entries(metadata[bundleSource]).filter(
        ([key]) => !["partial", "expectedCases"].includes(key),
      ),
    ),
  );
  assert.equal(result.value.metadata.gatewayTimeoutMs, 120_000);
  assert.equal(result.value.case.diagnostics.gatewayTimeoutMs, 120_000);
  assert.equal(transport.value.sequence, sequence);
  assert.equal(transport.value.fixtureIndex, fixtureIndex);
  assert.equal(transport.value.bundleSource, bundleSource);
  assert.equal(transport.value.caseId, caseId);
  assert.deepEqual(transport.value.diagnostics, row.diagnostics);
  assert.equal(transport.value.transports.length, Number(expectedModel));
  assert.equal(row.diagnostics.attempted, expectedModel);
  if (!expectedModel) {
    quietCases += 1;
    assert.equal(row.diagnostics.code, "no_cycle");
    assert.equal(row.request, null);
    assert.equal(row.candidate, null);
  }
  attempts += transport.value.transports.length;
  const checkpoint = await load(
    `${bundleSource}-partial-${String(fixtureIndex + 1).padStart(2, "0")}.json`,
  );
  assert.equal(checkpoint.value.partial, true);
  assert.equal(checkpoint.value.gatewayTimeoutMs, 120_000);
  assert.deepEqual(checkpoint.value.cases, reportRows[bundleSource].slice(0, fixtureIndex + 1));
  assert(
    checkpoint.value.cases.every(
      (partialRow) => partialRow.diagnostics.gatewayTimeoutMs === 120_000,
    ),
  );
}
assert.equal(attempts, 74);
assert.equal(quietCases, 2);
const result = {
  kind: "fresh-natal-extended-runtime-pair-integrity",
  checkedAtUTC: new Date().toISOString(),
  sourceRevision: frozen.sourceRevision,
  sourceManifestSha256: source.sha256,
  reportHashes: { before: before.sha256, after: after.sha256 },
  comparison,
  inputChecks,
  runtimePolicyOverride: expectedOverride,
  sourceChecks: {
    trackedSourceFiles: paths.length,
    everyFileMatchesFrozenGitRevision: true,
    trackedSourceAggregateMatches: true,
    originalDiagnosticsMatchesManifest: true,
    transformedDiagnosticsMatchesExactSubstitution: true,
    runtimeSidecarsMatch: true,
    mainRevision,
    mainDiagnosticsSha256: hash(mainDiagnostics),
    mainServingDeadlineMs: 60_000,
  },
  transportChecks: {
    attempts,
    retries: 0,
    concurrency: 1,
    completeCases: 76,
    quietCases,
    journalFiles: journalFiles.length,
    matchedCheckpoints: 76,
    adjacentAlternatingPairs: true,
    runtimeDeadlineMs: 120_000,
  },
  limitations: [
    "Input identity and validator outcomes do not establish semantic writing quality.",
    "120-second runtime-only captures do not establish the serving path's 60-second availability.",
    "The local extended synthetic evaluator does not verify the hosted Workflow, admin authentication or member-serving gateway.",
    "Usage observations do not establish monetary cost; failed-request usage remains unknown unless actually observed.",
  ],
};
await writeFile(newOutput, json(result), { flag: "wx", mode: 0o600 });
console.log(
  JSON.stringify({
    sourceRevision: result.sourceRevision,
    matchedCases: inputChecks.length,
    natalCases: 9,
    changedRequests: 9,
    sourceRevisionMatch: true,
    qualificationGaps: [],
    runtimeDeadlineMs: 120_000,
    attempts,
    integrityPassed: true,
  }),
);
