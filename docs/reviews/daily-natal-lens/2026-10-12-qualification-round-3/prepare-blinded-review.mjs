import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prepareReview } from "../../../../scripts/reading-writing-review.mjs";

// Only reviewer-visible copies are transformed. Original model reports stay frozen.
// Citations are masked uniformly; structural validation is reported separately.
const [beforePath, afterPath, instructionsPath, newDirectory] = process.argv.slice(2);
if (!newDirectory) {
  throw new Error("Usage: node prepare-blinded-review.mjs BEFORE AFTER INSTRUCTIONS NEW_DIR");
}
const hash = (value) => createHash("sha256").update(value).digest("hex");
const shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const [beforeBytes, afterBytes, instructions] = await Promise.all([
  readFile(beforePath),
  readFile(afterPath),
  readFile(instructionsPath, "utf8"),
]);
const prepared = prepareReview({
  before: { report: JSON.parse(beforeBytes), sha256: hash(beforeBytes) },
  after: { report: JSON.parse(afterBytes), sha256: hash(afterBytes) },
  instructions,
  contexts: ["natal-round3-a", "natal-round3-b"],
});

const grouped = new Map();
for (const [oldId, entry] of Object.entries(prepared.assignment.items)) {
  const { itemId: ignored, ...context } = entry.content;
  const content = {
    ...context,
    paragraphs: context.paragraphs.map((p) => ({ ...p, facts: null })),
  };
  const key = JSON.stringify(content);
  if (!grouped.has(key)) grouped.set(key, { content, oldIds: [], mappings: [] });
  const group = grouped.get(key);
  group.oldIds.push(oldId);
  group.mappings.push(...entry.mappings);
}
const items = {};
const remap = new Map();
for (const [index, entry] of shuffle([...grouped.values()]).entries()) {
  const itemId = `item-${String(index + 1).padStart(3, "0")}`;
  for (const oldId of entry.oldIds) remap.set(oldId, itemId);
  const supplied = entry.content.facts.map((fact) => fact.id);
  items[itemId] = {
    content: { itemId, ...entry.content },
    mappings: entry.mappings,
    applicable: {
      synthesisCoherence: !entry.content.quiet && supplied.includes("S1"),
      lensIntegration: !entry.content.quiet && supplied.includes("N1"),
    },
  };
}
const cases = structuredClone(prepared.assignment.cases);
for (const run of Object.values(cases)) {
  for (const row of Object.values(run)) {
    for (const lane of ["candidate", "displayed", "template"]) {
      if (row[lane]) row[lane] = remap.get(row[lane]);
    }
  }
}

const contrastSets = [];
const repetitionSets = [];
const setAssignments = {};
for (const run of ["before", "after"]) {
  for (const lane of ["candidate", "template"]) {
    const setId = `contrast-${hash(`${run}:${lane}:${randomInt(2 ** 32)}`).slice(0, 10)}`;
    const itemIds = ["natal-duty-reflex", "natal-freedom-reflex"].map((id) => cases[run][id][lane]);
    if (itemIds.every(Boolean)) {
      contrastSets.push({
        setId,
        itemIds,
        question:
          "Do these samples offer distinct practical choices supported by their respective supplied facts? Absence of N1 does not require invented variation.",
      });
      setAssignments[setId] = { kind: "contrast", run, lane, itemIds };
    }
    for (const [name, ids] of [
      [
        "moon",
        [
          "natal-duty-reflex",
          "natal-service-aspect",
          "natal-exact-house",
          "natal-moon-fallback",
          "natal-mixed-source",
        ],
      ],
      ["own", ["natal-own-target", "natal-synthesis-integration"]],
    ]) {
      const repetitionId = `reuse-${hash(`${run}:${lane}:${name}:${randomInt(2 ** 32)}`).slice(0, 10)}`;
      const members = ids.map((id) => cases[run][id][lane]).filter(Boolean);
      repetitionSets.push({
        setId: repetitionId,
        itemIds: members,
        occurrences: members.map((itemId, index) => ({
          occurrenceId: `sample-${index + 1}`,
          itemId,
        })),
        question:
          "Assess likely reuse across these scenarios (1 stock phrasing dominates, 5 relevant supported variation). This is not an observed chronological week; identical source meanings cannot support invented variation.",
      });
      setAssignments[repetitionId] = {
        kind: "repetition",
        run,
        lane,
        group: name,
        itemIds: members,
      };
    }
  }
}
const canonical = Object.keys(items)
  .sort()
  .map((id) => items[id].content);
const itemSetHash = hash(JSON.stringify(canonical));
const instructionsSha256 = hash(instructions);
const output = resolve(newDirectory);
await mkdir(output);
const packetHashes = {};
for (const contextId of ["natal-round3-a", "natal-round3-b"]) {
  const directory = resolve(output, contextId);
  await mkdir(directory);
  const packet = {
    protocolVersion: prepared.assignment.protocolVersion,
    kind: "packet",
    contextId,
    itemSetHash,
    instructionsSha256,
    instructions,
    items: shuffle(canonical),
    contrastSets: shuffle(contrastSets),
    repetitionSets: shuffle(repetitionSets),
  };
  const bytes = `${JSON.stringify(packet, null, 2)}\n`;
  await writeFile(resolve(directory, "packet.json"), bytes, { flag: "wx" });
  packetHashes[contextId] = { sha256: hash(bytes) };
}
const assignment = {
  ...prepared.assignment,
  itemSetHash,
  instructionsSha256,
  packets: packetHashes,
  items,
  cases,
  setAssignments,
  masking:
    "All paragraph citation arrays masked uniformly. Only identical full visible facts/tone/depth/quiet/text contexts deduplicate. Original reports and citations unchanged.",
};
await writeFile(
  resolve(output, "assignment-private.json"),
  `${JSON.stringify(assignment, null, 2)}\n`,
  { flag: "wx" },
);
console.log(
  JSON.stringify(
    {
      items: canonical.length,
      itemSetHash,
      packets: packetHashes,
      contrastSets: contrastSets.length,
      repetitionSets: repetitionSets.length,
      uncovered: assignment.uncovered,
    },
    null,
    2,
  ),
);
