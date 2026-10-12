import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compareNatalReports } from "../../../../scripts/evaluate-readings.mjs";

const [runDirectory, newOutput] = process.argv.slice(2);
if (!newOutput) throw new Error("Usage: node verify-evidence.mjs RUN_DIR NEW_JSON");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const load = async (name) => {
  const bytes = await readFile(resolve(runDirectory, name));
  return { value: JSON.parse(bytes), sha256: hash(bytes) };
};
const [before, after, beforeIdentity, afterIdentity, source, finish] = await Promise.all([
  load("builtin-report.json"),
  load("natal-candidate-report.json"),
  load("builtin-identity.json"),
  load("natal-candidate-identity.json"),
  load("source-manifest.json"),
  load("run-finished.json"),
]);
assert.equal(finish.value.status, "complete");
assert.equal(finish.value.retries, 0);
assert.equal(finish.value.sourceUnchangedThroughout, true);
assert.equal(finish.value.transportAttempts, 74);
for (const report of [before.value, after.value]) {
  assert.equal(report.partial, false);
  assert.equal(report.cases.length, 38);
  assert.equal(report.summary.modelAttempts, 37);
  assert(report.cases.every((row) => Object.values(row.manualReview).every((v) => v === null)));
}
for (const identity of [beforeIdentity.value, afterIdentity.value]) {
  assert.equal(identity.build.sourceRevision, source.value.sourceRevision);
  assert.equal(identity.build.trackedSourceSha256, source.value.trackedSourceSha256);
  assert.equal(identity.build.runnerSha256, source.value.runnerSha256);
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
    row.facts.filter((f) => f.id !== "N1").map(visible),
    baseline.facts.map(visible),
  );
  const natal = row.facts.find((f) => f.id === "N1");
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
const result = {
  kind: "fresh-natal-pair-integrity",
  checkedAtUTC: new Date().toISOString(),
  sourceRevision: source.value.sourceRevision,
  reportHashes: { before: before.sha256, after: after.sha256 },
  comparison,
  inputChecks,
  limitations: [
    "Input identity and validator outcomes do not establish semantic writing quality.",
    "The local production-module evaluator does not verify the hosted Workflow, admin authentication or member-serving gateway.",
  ],
};
await writeFile(newOutput, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
console.log(
  JSON.stringify({
    sourceRevision: result.sourceRevision,
    matchedCases: inputChecks.length,
    natalCases: inputChecks.filter((r) => r.natalSupplied).length,
    sourceRevisionMatch: true,
    qualificationGaps: [],
  }),
);
