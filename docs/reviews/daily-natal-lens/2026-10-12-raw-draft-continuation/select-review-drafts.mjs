import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const base =
  "/home/ubuntu/.local/state/pixel-perfect-view-757/natal-qualification/20261012-step3-continuation";
const json = (x) => JSON.stringify(x, null, 2) + "\n";
const hash = (x) => createHash("sha256").update(x).digest("hex");
const read = async (path) => {
  const bytes = await readFile(path);
  return { value: JSON.parse(bytes), sha256: hash(bytes) };
};
const normal = await read(`${base}/paid-run/capture.json`),
  recovery = await read(`${base}/synthesis-recovery/capture.json`);
const initialPlan = await read(`${base}/paid-run/run-plan.json`);
const m1 = await read(`${base}/paid-run/source-manifest.json`),
  m2 = await read(`${base}/synthesis-recovery/source-manifest.json`);
assert.equal(m1.value.trackedSourceSha256, m2.value.trackedSourceSha256);
assert.equal(normal.value.samples.length, 4);
assert.equal(normal.value.samples[3].result.case.diagnostics.code, "timeout");
assert.equal(recovery.value.samples.length, 1);
const recovered = recovery.value.samples[0];
assert.equal(recovered.caseId, "natal-synthesis-integration");
assert.equal(recovered.repetition, 2);
const chosen = [
  ...normal.value.samples
    .slice(0, 3)
    .map((s) => ({
      ...s,
      provenance: {
        sourceRun: "paid-run",
        sourceSampleId: s.sampleId,
        sourceCaptureSha256: normal.sha256,
      },
    })),
  {
    ...recovered,
    sampleId: "sample-4",
    provenance: {
      sourceRun: "synthesis-recovery",
      sourceSampleId: recovered.sampleId,
      sourceCaptureSha256: recovery.sha256,
    },
  },
];
const capture = {
  kind: "derived-review-selection-from-two-preserved-runs",
  sourceRevision: normal.value.sourceRevision,
  complete: chosen.every((s) => s.result.case.candidate?.captureLossless),
  fullBenchmarkClaim: false,
  samples: chosen,
  excludedAttempt: {
    sourceRun: "paid-run",
    sampleId: "sample-4",
    code: "timeout",
    noRawDraft: true,
  },
  sources: [
    { path: "../paid-run/capture.json", sha256: normal.sha256 },
    { path: "../synthesis-recovery/capture.json", sha256: recovery.sha256 },
  ],
};
const out = `${base}/review-selection`;
await mkdir(out);
await writeFile(`${out}/capture.json`, json(capture), { flag: "wx" });
const { maximumModelAttempts, ...plan } = initialPlan.value;
await writeFile(
  `${out}/run-plan.json`,
  json({
    ...plan,
    kind: "derived-review-selection-plan",
    requestedDrafts: 4,
    actualModelAttempts: 5,
    runtimeDeadlineMs: null,
    runtimePolicyOverride: null,
    captureDeadlinesMs: [120000, 180000],
    note: "Selection only, not a provider run. Both original captures and the timeout are retained.",
  }),
  { flag: "wx" },
);
await writeFile(
  `${out}/run-finished.json`,
  json({
    kind: "derived-review-selection-receipt",
    captureSha256: hash(json(capture)),
    modelAttempts: 5,
    selectedDrafts: chosen.filter((s) => s.result.case.candidate?.captureLossless).length,
    originalCapturesUnchanged: true,
  }),
  { flag: "wx" },
);
console.log(
  json({
    selectedDrafts: chosen.filter((s) => s.result.case.candidate?.captureLossless).length,
    actualModelAttempts: 5,
    timeoutRetained: true,
  }),
);
