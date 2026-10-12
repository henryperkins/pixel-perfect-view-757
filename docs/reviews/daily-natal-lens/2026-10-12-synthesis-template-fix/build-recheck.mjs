import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Re-review of the natal synthesis template after its fix, under the lightweight gate:
// only the affected natal-candidate template bodies are reviewed. Reads the new offline
// capture and the unchanged round-3 reviewer instructions; writes one isolated packet, a
// private assignment and a manifest to a new directory. No model or network calls.
const [captureDirectory, roundDirectory, newDirectory, contextId] = process.argv.slice(2);
if (!contextId)
  throw new Error("Usage: node build-recheck.mjs CAPTURE_DIR ROUND3_DIR NEW_DIR CONTEXT_ID");
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(contextId)) throw new Error("Invalid context ID");

const SOURCE_REVISION = "9316cbf77e7ea51c47a48f3678bab6901f917093";
const INSTRUCTIONS_SHA256 = "822af5b1599feb0384768d857feabd89f63691fe806b203b16dffe084dd7a42b";
const PREVIOUS_TEMPLATES_SHA256 =
  "f2434374eeccae29c27fc02d1827ab8ca8002340d85c12934ce82f56c49e1254";
// The gate's failing template, plus the other natal-candidate body the fix changed.
const AFFECTED = [
  ["natal-synthesis-integration", "lightweight-subset"],
  ["arc-synthesis-natal-integration", "affected-outside-subset"],
];
const TARGETED_SCOPE = [
  "Targeted review scope. This packet holds 2 prose items. Apply the embedded instructions to every item.",
  "- Gate dimensions are specificity, grounding and coherence, plus lensIntegration when the item supplies N1 and synthesisCoherence when it supplies S1. Each must be at least 4. Any substantive finding fails the item, and so does an unresolved grounding doubt.",
  "- Voice and repetition are recorded with reasons and do not gate by themselves. Where a concrete wording change would make an item clearer or more useful to a reader, record it as a minor finding with that proposedCorrection.",
  "- Preserve conditional source wording. Keep each calculated contact's transiting body and natal point in their supplied roles, and keep the reading's own position in the calculated window distinct from the calculated exact date. Invented geometry, causal links that the supplied statements do not make, and clinical or biological claims are substantive findings.",
  "- This packet has no contrastSets or repetitionSets; write contrastChecks and repetitionChecks as empty arrays.",
].join("\n");

const hash = (value) => createHash("sha256").update(value).digest("hex");
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const receiptBytes = await readFile(resolve(captureDirectory, "template-capture-receipt.json"));
const receipt = JSON.parse(receiptBytes);
const files = {};
for (const name of ["templates.json", "case-contexts.json", "template-source-manifest.json"]) {
  files[name] = await readFile(resolve(captureDirectory, name));
  check(
    receipt.files.some((file) => file.path === name && file.sha256 === hash(files[name])),
    `${name} is not the receipt's captured file`,
  );
}
check(
  receipt.sourceIdentity.sourceRevision === SOURCE_REVISION &&
    receipt.previousTemplates.sha256 === PREVIOUS_TEMPLATES_SHA256 &&
    receipt.modelRequestsAttempted === 0 &&
    receipt.sourceUnchangedThroughoutCapture === true,
  "The capture is not the offline capture of the fixed source",
);
const instructionBytes = await readFile(resolve(roundDirectory, "reviewer-instructions.md"));
check(hash(instructionBytes) === INSTRUCTIONS_SHA256, "Reviewer instructions changed");
const previousBytes = await readFile(resolve(roundDirectory, "templates.json"));
check(hash(previousBytes) === PREVIOUS_TEMPLATES_SHA256, "Round-3 templates changed");
const instructions = instructionBytes.toString("utf8");
const templates = JSON.parse(files["templates.json"]);
const previous = JSON.parse(previousBytes);
const rowsFor = (artifact) =>
  new Map(
    artifact.snapshots
      .find((snapshot) => snapshot.bundleSource === "natal-candidate")
      .cases.map((row) => [row.id, row]),
  );
const rows = rowsFor(templates);
const before = rowsFor(previous);

const visibleFacts = (facts) =>
  facts.map((fact) => ({
    id: fact.id,
    ...(fact.kind ? { kind: fact.kind } : {}),
    statement: fact.statement,
    ...(fact.dependsOn?.length ? { dependsOn: [...fact.dependsOn] } : {}),
  }));
const entries = new Map();
const samples = [];
for (const [caseId, scope] of AFFECTED) {
  const row = rows.get(caseId);
  const old = before.get(caseId);
  check(row && old && row.lensRuleKey, `${caseId} is not a captured lens template`);
  check(row.templateBody !== old.templateBody, `${caseId} template did not change`);
  check(JSON.stringify(row.facts) === JSON.stringify(old.facts), `${caseId} facts changed`);
  const content = {
    tone: row.tone,
    depth: row.depth,
    quiet: false,
    facts: visibleFacts(row.facts),
    paragraphs: row.templateBody.split("\n\n").map((text, i) => ({
      number: i + 1,
      text,
      facts: null,
    })),
  };
  // Only identical complete visible contexts deduplicate.
  const key = JSON.stringify(content);
  if (!entries.has(key)) entries.set(key, { content, mappings: [] });
  entries.get(key).mappings.push({ caseId, scope, output: "template" });
  samples.push({
    caseId,
    scope,
    bundleSource: "natal-candidate",
    tone: row.tone,
    depth: row.depth,
    lensRuleKey: row.lensRuleKey,
    storyStatus: row.storyStatus,
    suppliedFactIds: row.facts.map((fact) => fact.id),
    factsSha256: hash(JSON.stringify(visibleFacts(row.facts))),
    bodySha256: hash(row.templateBody),
    previousBodySha256: hash(old.templateBody),
  });
}
const ids = new Map();
shuffle([...entries.keys()]).forEach((key, i) =>
  ids.set(key, `item-${String(i + 1).padStart(2, "0")}`),
);
const items = {};
for (const [key, entry] of entries) {
  const itemId = ids.get(key);
  const supplied = entry.content.facts.map((fact) => fact.id);
  items[itemId] = {
    content: { itemId, ...entry.content },
    mappings: entry.mappings,
    applicable: {
      synthesisCoherence: supplied.includes("S1"),
      lensIntegration: supplied.includes("N1"),
    },
  };
}
const canonical = Object.keys(items)
  .sort()
  .map((id) => items[id].content);
const itemSetHash = hash(JSON.stringify(canonical));
const packet = {
  protocolVersion: "daily-writing-ai-review-1",
  kind: "packet",
  contextId,
  itemSetHash,
  instructionsSha256: INSTRUCTIONS_SHA256,
  instructions,
  targetedScopeSha256: hash(TARGETED_SCOPE),
  targetedScope: TARGETED_SCOPE,
  items: shuffle(canonical),
  contrastSets: [],
  repetitionSets: [],
};
const packetBytes = json(packet);
const packetSha256 = hash(packetBytes);
const output = resolve(newDirectory);
await mkdir(output);
await mkdir(resolve(output, "blind", contextId), { recursive: true });
await mkdir(resolve(output, "private"));
await writeFile(resolve(output, "blind", contextId, "packet.json"), packetBytes, { flag: "wx" });
const cases = Object.fromEntries(
  Object.entries(items).flatMap(([itemId, entry]) =>
    entry.mappings.map((mapping) => [mapping.caseId, { template: itemId }]),
  ),
);
await writeFile(
  resolve(output, "private", "assignment.json"),
  json({
    protocolVersion: "daily-writing-ai-review-1",
    kind: "targeted-recheck-assignment",
    itemSetHash,
    packets: { [contextId]: { sha256: packetSha256 } },
    items,
    cases,
  }),
  { flag: "wx" },
);
await writeFile(
  resolve(output, "collection-manifest.json"),
  json({
    kind: "natal-synthesis-template-recheck",
    label: "Targeted re-review of the fixed natal synthesis template",
    policy: "../lightweight-readiness.md",
    fullBenchmarkClaim: false,
    newModelRequests: 0,
    humanReviewCompleted: false,
    candidatesActivated: false,
    sourceRevision: SOURCE_REVISION,
    capture: {
      receiptSha256: hash(receiptBytes),
      templatesSha256: hash(files["templates.json"]),
      changed: receipt.changed,
    },
    previousTemplatesSha256: PREVIOUS_TEMPLATES_SHA256,
    samples,
    unreviewedChanges: receipt.changed.filter((row) => row.bundleSource !== "natal-candidate"),
    packet: {
      contextId,
      sha256: packetSha256,
      itemSetHash,
      instructionsSha256: INSTRUCTIONS_SHA256,
      targetedScopeSha256: hash(TARGETED_SCOPE),
      uniqueItems: canonical.length,
    },
  }),
  { flag: "wx" },
);
console.log(json({ items: canonical.length, itemSetHash, packetSha256 }));
