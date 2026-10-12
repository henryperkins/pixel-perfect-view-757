import assert from "node:assert/strict";
import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [captureDirectory, templatesPath, collectionDirectory, contextId, revalidationPath] =
  process.argv.slice(2);
assert.match(contextId ?? "", /^[a-z0-9][a-z0-9-]{0,63}$/);
const here = dirname(fileURLToPath(import.meta.url));
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const captureBytes = await readFile(resolve(captureDirectory, "capture.json"));
const planBytes = await readFile(resolve(captureDirectory, "run-plan.json"));
const finishBytes = await readFile(resolve(captureDirectory, "run-finished.json"));
const templatesBytes = await readFile(templatesPath);
const revalidationBytes = await readFile(revalidationPath);
const revalidation = JSON.parse(revalidationBytes);
const capture = JSON.parse(captureBytes);
const plan = JSON.parse(planBytes);
const finish = JSON.parse(finishBytes);
const templates = JSON.parse(templatesBytes);
assert.equal(hash(captureBytes), finish.captureSha256);
assert.equal(capture.complete, true);
assert.equal(finish.status, "complete");
assert.equal(finish.sourceUnchangedThroughout, true);
assert.equal(finish.haltReason, null);
assert.equal(finish.unsettledSample, null);
assert.equal(finish.sourceRevision, capture.sourceRevision);
assert.equal(plan.sourceRevision, capture.sourceRevision);
assert.equal(finish.trackedSourceSha256, plan.trackedSourceSha256);
assert.equal(finish.modelAttempts, 7);
assert.equal(finish.settledSamples, 7);
assert.equal(finish.losslessRawDrafts, 7);
assert.equal(finish.retries, 0);
assert.equal(plan.schedule.length, 7);
assert.equal(new Set(plan.schedule.map((s) => s.caseId)).size, 7);
assert.deepEqual(
  capture.samples.map(({ sampleId, caseId, repetition }) => ({ sampleId, caseId, repetition })),
  plan.schedule,
);
assert.equal(revalidation.paidCaptureSha256, hash(captureBytes));
assert.equal(revalidation.sourceRevision, templates.sourceRevision);
assert.equal(revalidation.allRequestsUnchanged, true);
assert.equal(revalidation.allRawDraftsUnchanged, true);
assert.equal(plan.bundleSource, "transit-candidate");
assert.equal(plan.maximumModelAttempts, 7);
assert.equal(templates.providerCallsMade, 0);
const instructionBytes = await readFile(
  resolve(here, "../../daily-natal-lens/2026-10-12-qualification-round-3/reviewer-instructions.md"),
);
const entries = new Map();
const samples = [];
const unavailable = [];
function add(row, output, sampleId) {
  const paragraphs =
    output === "raw-model"
      ? row.candidate.paragraphs.map((p) => p.text)
      : row.template.body.split("\n\n");
  const content = {
    tone: row.config.tone,
    depth: row.config.depth,
    quiet: row.diagnostics.code === "no_cycle",
    facts: row.facts.map((f) => ({
      id: f.id,
      ...(f.kind ? { kind: f.kind } : {}),
      statement: f.statement,
      ...(f.dependsOn?.length ? { dependsOn: f.dependsOn } : {}),
    })),
    paragraphs: paragraphs.map((text, i) => ({ number: i + 1, text, facts: null })),
  };
  const key = JSON.stringify(content);
  const mapping = { sampleId, caseId: row.id, output };
  if (!entries.has(key)) entries.set(key, { content, mappings: [] });
  entries.get(key).mappings.push(mapping);
  samples.push({
    ...mapping,
    sourceSha256: hash(JSON.stringify(output === "raw-model" ? row.candidate : row.template)),
    structuralOutcome: row.diagnostics.outcome,
    structuralCode: row.diagnostics.code,
    key,
  });
}
for (const scheduled of plan.schedule) {
  const sample = capture.samples.find((s) => s.sampleId === scheduled.sampleId);
  const offline = templates.results.find((r) => r.case.id === scheduled.caseId)?.case;
  assert.ok(offline, `Missing template: ${scheduled.caseId}`);
  add(offline, "template", `${scheduled.sampleId}-template`);
  if (sample) {
    assert.deepEqual(sample.result.case.facts, offline.facts);
  }
  if (sample?.result.case.candidate?.captureLossless) {
    add(sample.result.case, "raw-model", scheduled.sampleId);
  } else {
    unavailable.push({ ...scheduled, code: sample?.result.case.diagnostics.code ?? "unattempted" });
  }
}
const quiet = templates.results.find((r) => r.case.id === "quiet-threshold")?.case;
assert.equal(quiet?.diagnostics.code, "no_cycle");
add(quiet, "template", "quiet-template");
const shuffle = (values) => {
  for (let i = values.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
};
const items = {};
const ids = new Map();
shuffle([...entries.keys()]).forEach((key, i) => {
  const itemId = `item-${String(i + 1).padStart(2, "0")}`;
  ids.set(key, itemId);
  const entry = entries.get(key);
  const has = (id) => !entry.content.quiet && entry.content.facts.some((f) => f.id === id);
  items[itemId] = {
    content: { itemId, ...entry.content },
    mappings: entry.mappings,
    applicable: {
      synthesisCoherence: has("S1"),
      lensIntegration: has("N1"),
      temporalCoherence: has("A1"),
      chapterIntegration: has("P2"),
    },
  };
});
const mapped = samples.map(({ key, ...s }) => ({ ...s, itemId: ids.get(key) }));
const contrastSets = shuffle(["raw-model", "template"]).flatMap((output, i) => {
  const selected = ["arc-opening-three", "arc-return-three", "arc-closing-three"].map(
    (caseId) => mapped.find((s) => s.caseId === caseId && s.output === output)?.itemId,
  );
  if (selected.some((id) => !id)) return [];
  return [{ setId: `contrast-${i + 1}`, itemIds: shuffle(selected) }];
});
const canonical = Object.values(items)
  .map((entry) => entry.content)
  .sort((a, b) => a.itemId.localeCompare(b.itemId));
const itemSetHash = hash(JSON.stringify(canonical));
const targetedScope = `This is a small transit writing review. Review every item independently using the embedded standards. Add temporalCoherence (score exactly when A1 is supplied) and chapterIntegration (score exactly when P2 is supplied), using the same score/reason object shape as other dimensions. Temporal coherence must separate calculated contacts from personal history, preserve uncertainty and avoid invented pass counts, finality or resolution. Chapter integration must develop P2's conditional practical distinction within I1's primary scene. Specificity, grounding, coherence and every applicable synthesis/lens/temporal/chapter dimension must reach 4/5; voice and repetition are recorded but do not gate alone. Quiet items have null scores for every dimension and a safety check. No substantive finding is allowed. Preserve each claim's own modality without adding uncertainty to supported categorical statements. For each contrastSet return contrastChecks: [{setId, supported: boolean, explanation: string, passages: [{itemId, paragraph, passage, factIds}]}], with at least one exact passage from each listed item. Decide whether the supplied chapter meanings produce distinct practical emphasis across opening, return and closing without inventing personal history. These labels describe calculated chapters only. The overall verdict must fail if any item fails or any contrast is unsupported. Return repetitionChecks: []. There is one reviewer and no baseline requirement for this targeted gate. Read only this packet and write only the assigned review.`;
const packet = {
  protocolVersion: "daily-writing-ai-review-1",
  kind: "packet",
  contextId,
  itemSetHash,
  instructionsSha256: hash(instructionBytes),
  instructions: instructionBytes.toString("utf8"),
  targetedScope,
  items: shuffle([...canonical]),
  contrastSets,
  repetitionSets: [],
};
const output = resolve(collectionDirectory);
await mkdir(output, { mode: 0o700 });
await mkdir(resolve(output, "blind", contextId), { recursive: true, mode: 0o700 });
await mkdir(resolve(output, "private"), { mode: 0o700 });
const packetBytes = json(packet);
const packetSha256 = hash(packetBytes);
const write = (path, value) => writeFile(path, json(value), { flag: "wx", mode: 0o600 });
await writeFile(resolve(output, "blind", contextId, "packet.json"), packetBytes, { flag: "wx" });
await write(resolve(output, "private", "assignment.json"), {
  kind: "targeted-transit-writing-assignment",
  itemSetHash,
  packets: { [contextId]: { sha256: packetSha256 } },
  items,
});
await write(resolve(output, "collection-manifest.json"), {
  kind: "targeted-transit-writing-collection",
  sourceRevision: templates.sourceRevision,
  modelGeneratingRevision: capture.sourceRevision,
  fullBenchmarkClaim: false,
  humanReviewCompleted: false,
  candidatesActivated: false,
  capturePath: resolve(captureDirectory, "capture.json"),
  captureSha256: hash(captureBytes),
  templatesPath: resolve(templatesPath),
  templatesSha256: hash(templatesBytes),
  revalidationPath: resolve(revalidationPath),
  revalidationSha256: hash(revalidationBytes),
  runPlanSha256: hash(planBytes),
  runFinishedSha256: hash(finishBytes),
  modelAttempts: finish.modelAttempts,
  expectedSamples: 15,
  packet: { contextId, sha256: packetSha256, itemSetHash, uniqueItems: canonical.length },
  samples: mapped,
  unavailable,
});
console.log(json({ packetSha256, itemSetHash, items: canonical.length, unavailable }));
