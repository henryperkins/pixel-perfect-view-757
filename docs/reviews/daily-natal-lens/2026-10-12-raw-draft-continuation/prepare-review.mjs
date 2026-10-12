import assert from "node:assert/strict";
import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [captureDirectory, collectionDirectory, contextId] = process.argv.slice(2);
assert.match(contextId ?? "", /^[a-z0-9][a-z0-9-]{0,63}$/);
const here = dirname(fileURLToPath(import.meta.url));
const json = (v) => `${JSON.stringify(v, null, 2)}\n`;
const hash = (v) => createHash("sha256").update(v).digest("hex");
const captureBytes = await readFile(resolve(captureDirectory, "capture.json"));
const finishBytes = await readFile(resolve(captureDirectory, "run-finished.json"));
const planBytes = await readFile(resolve(captureDirectory, "run-plan.json"));
const capture = JSON.parse(captureBytes),
  finish = JSON.parse(finishBytes),
  plan = JSON.parse(planBytes);
assert.equal(hash(captureBytes), finish.captureSha256);
assert.equal(capture.sourceRevision, plan.sourceRevision);
assert.equal(plan.requestedDrafts ?? plan.maximumModelAttempts, 4);
assert.equal(plan.model, "gemini-enterprise/gemini-3.8-flash");
assert.equal(plan.promptVersion, "daily-astro-body-12");
assert.equal(plan.validatorVersion, "daily-reference-8");
const instructionBytes = await readFile(
  resolve(here, "../2026-10-12-qualification-round-3/reviewer-instructions.md"),
);
assert.equal(
  hash(instructionBytes),
  "822af5b1599feb0384768d857feabd89f63691fe806b203b16dffe084dd7a42b",
);
const entries = new Map();
const samples = [];
const unavailable = [];
for (const scheduled of plan.schedule) {
  const sample = capture.samples.find((s) => s.sampleId === scheduled.sampleId);
  if (!sample?.result.case.candidate?.captureLossless) {
    unavailable.push({ ...scheduled, code: sample?.result.case.diagnostics.code ?? "unattempted" });
    continue;
  }
  const row = sample.result.case;
  assert.equal(sample.caseId, scheduled.caseId);
  assert.equal(row.id, scheduled.caseId);
  assert.equal(row.diagnostics.model, plan.model);
  assert.equal(row.diagnostics.promptVersion, plan.promptVersion);
  assert.equal(row.diagnostics.validatorVersion, plan.validatorVersion);
  assert.ok(row.candidate.paragraphs.length > 0);
  const content = {
    tone: row.config.tone,
    depth: row.config.depth,
    quiet: false,
    facts: row.facts.map((f) => ({
      id: f.id,
      ...(f.kind ? { kind: f.kind } : {}),
      statement: f.statement,
      ...(f.dependsOn?.length ? { dependsOn: [...f.dependsOn] } : {}),
    })),
    paragraphs: row.candidate.paragraphs.map((p, i) => ({
      number: i + 1,
      text: p.text,
      facts: null,
    })),
  };
  const key = JSON.stringify(content);
  if (!entries.has(key)) entries.set(key, { content, mappings: [] });
  entries.get(key).mappings.push({ ...scheduled, output: "raw-model" });
  samples.push({
    ...scheduled,
    candidateSha256: hash(JSON.stringify(row.candidate)),
    factsSha256: hash(JSON.stringify(content.facts)),
    diagnostics: row.diagnostics,
    key,
  });
}
const shuffle = (values) => {
  for (let i = values.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
};
const items = {},
  ids = new Map();
shuffle([...entries.keys()]).forEach((key, i) => {
  const itemId = `item-${String(i + 1).padStart(2, "0")}`;
  const entry = entries.get(key);
  ids.set(key, itemId);
  items[itemId] = {
    content: { itemId, ...entry.content },
    mappings: entry.mappings,
    applicable: {
      synthesisCoherence: entry.content.facts.some((f) => f.id === "S1"),
      lensIntegration: entry.content.facts.some((f) => f.id === "N1"),
    },
  };
});
assert.ok(Object.keys(items).length, "No lossless raw drafts to review");
const canonical = Object.keys(items)
  .sort()
  .map((id) => items[id].content);
const itemSetHash = hash(JSON.stringify(canonical));
const targetedScope = `Review all ${canonical.length} supplied items independently. Specificity, grounding, coherence, and applicable lensIntegration and synthesisCoherence must each reach 4/5, with no substantive finding. Voice and repetition are recorded but do not gate alone. Preserve supported categorical statements and conditional statements at their supplied strength. There are no contrastSets or repetitionSets; return empty arrays for their checks. Read only the assigned packet and write only the assigned review.`;
const packet = {
  protocolVersion: "daily-writing-ai-review-1",
  kind: "packet",
  contextId,
  itemSetHash,
  instructionsSha256: hash(instructionBytes),
  instructions: instructionBytes.toString("utf8"),
  targetedScope,
  items: shuffle([...canonical]),
  contrastSets: [],
  repetitionSets: [],
};
const packetBytes = json(packet),
  packetSha256 = hash(packetBytes);
const output = resolve(collectionDirectory);
await mkdir(output, { mode: 0o700 });
await mkdir(resolve(output, "blind", contextId), { recursive: true, mode: 0o700 });
await mkdir(resolve(output, "private"), { mode: 0o700 });
await writeFile(resolve(output, "blind", contextId, "packet.json"), packetBytes, { flag: "wx" });
await writeFile(
  resolve(output, "private", "assignment.json"),
  json({
    kind: "targeted-raw-draft-assignment",
    itemSetHash,
    packets: { [contextId]: { sha256: packetSha256 } },
    items,
  }),
  { flag: "wx" },
);
await writeFile(
  resolve(output, "collection-manifest.json"),
  json({
    kind: "targeted-natal-raw-draft-continuation",
    fullBenchmarkClaim: false,
    humanReviewCompleted: false,
    candidatesActivated: false,
    sourceRevision: capture.sourceRevision,
    capturePath: resolve(captureDirectory, "capture.json"),
    captureSha256: hash(captureBytes),
    runPlanSha256: hash(planBytes),
    runFinishedSha256: hash(finishBytes),
    modelAttempts: finish.modelAttempts,
    packet: {
      contextId,
      sha256: packetSha256,
      itemSetHash,
      uniqueItems: canonical.length,
      instructionsSha256: hash(instructionBytes),
    },
    samples: samples.map(({ key, ...sample }) => ({ ...sample, itemId: ids.get(key) })),
    unavailable,
  }),
  { flag: "wx" },
);
console.log(
  json({
    packetSha256,
    itemSetHash,
    items: canonical.length,
    drafts: samples.length,
    unavailable: unavailable.length,
  }),
);
