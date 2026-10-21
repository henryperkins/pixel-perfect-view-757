import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "--write";
assert.ok(["--write", "--verify", "--revise"].includes(mode));
assert.ok(process.argv.length <= 3);
const read = (name) => readFile(new URL(name, import.meta.url), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const baseline = JSON.parse(await read("baseline.json"));
const drafts = JSON.parse(await read("drafts.json"));
const notes = await read("author-notes.md");
const standard = await read("editorial-standard.md");
const sourceProposals = JSON.parse(await read("source-proposals.json"));
assert.equal(baseline.provider, "none");
assert.equal(baseline.networkAttempts, 0);
assert.equal(drafts.provider, "none");
assert.equal(baseline.cases.length, 6);
assert.deepEqual(drafts.cases.map((c) => c.id), baseline.cases.map((c) => c.id));
assert.deepEqual(sourceProposals.cases.map((c) => c.id), baseline.cases.map((c) => c.id));
for (let i = 0; i < baseline.cases.length; i++) {
  const proposal = sourceProposals.cases[i];
  assert.deepEqual(proposal.selectedSourceKeys, baseline.cases[i].selectedSourceKeys);
  assert.ok(proposal.writingMaterial.meaning && proposal.writingMaterial.scene && proposal.writingMaterial.direction);
  assert.ok(Array.isArray(proposal.constraints) && proposal.constraints.length && proposal.evidence.rationale);
}
const words = (value) => value.trim().split(/\s+/).length;
const reading = (c) => ({ headline: c.headline, body: c.body ?? c.paragraphs.join("\n\n"), prompt: c.prompt });
const markdown = (c) => `#### ${c.headline}\n\n${c.body}\n\n**Reflection:** ${c.prompt}`;
const texts = [];
const pairs = baseline.cases.map((entry, index) => {
  const draft = drafts.cases[index];
  const before = reading(entry.reading);
  const after = reading(draft);
  assert.equal(entry.reading.paragraphs.join("\n\n"), before.body);
  assert.ok(draft.revision >= 1 && Number.isInteger(draft.revision));
  assert.ok(words(after.headline) >= 3 && words(after.headline) <= 9);
  assert.ok(draft.paragraphs.length >= 2 && draft.paragraphs.length <= 4);
  assert.ok(!after.body.includes("?"));
  assert.ok(after.prompt.length <= 220 && /^.*\?$/.test(after.prompt));
  assert.equal((after.prompt.match(/\?/g) ?? []).length, 1);
  const [min, max] = entry.id === "quiet-threshold" ? [60, 110] : [130, 200];
  const withinLengthGuidance = words(after.body) >= min && words(after.body) <= max;
  if (!withinLengthGuidance) {
    assert.ok(typeof draft.lengthException === "string" && draft.lengthException.length > 30, entry.id);
  } else assert.ok(!draft.lengthException, "Remove obsolete length exception");
  for (const [variant, text, revision] of [["baseline", before, null], ["target", after, draft.revision]])
    texts.push({ caseId: entry.id, variant, revision, text, textSha256: sha(JSON.stringify(text)) });
  return `## Case ${index + 1} — ${entry.topic}\n\nScenario: ${entry.originalFixture.config.day} ${entry.originalFixture.config.timeZone}. Fixture: \`${entry.id}\`.\n\n### Before — recomputed template baseline using saved content\n\n${markdown(before)}\n\n### After — editorial target draft, revision ${draft.revision}\n\n${markdown(after)}\n\n_Draft body: ${words(after.body)} words; reflection: ${after.prompt.length} characters. Authored sample, not model output._${draft.lengthException ? `\n\n**Length exception:** ${draft.lengthException}` : ""}`;
});

// Stable shuffle from opaque hashes; no baseline/target labels enter the reader packet.
texts.sort((a, b) => sha(`pattern-editorial-2026-10-15:${a.caseId}:${a.variant}`).localeCompare(sha(`pattern-editorial-2026-10-15:${b.caseId}:${b.variant}`)));
const assignments = texts.map((entry, index) => ({ item: `Item ${String(index + 1).padStart(2, "0")}`, ...entry }));
const packet = `# Readings for editorial review\n\nPlease assess each reading against the accompanying editorial standard. Items are presented without source notes or production context. Score each independently and then consider repetition across the set.\n\n${assignments.map((entry) => `## ${entry.item}\n\n${markdown(entry.text)}`).join("\n\n---\n\n")}\n`;
const sample = `# Pattern daily readings — six editorial comparisons\n\nThese six original target drafts explore the approved reader-centered direction. Each is paired with an unchanged **recomputed template baseline using saved content**. This is a comparison of deterministic templates and authored editorial targets, not two live generation systems.\n\nAll inputs are fixed historical synthetic scenarios; no member data or provider requests were used. The saved baseline is version 0.7.1, schema 4, from the frozen pair recorded in [baseline.json](baseline.json). It is not a freshly verified active release. Both sides use warm/standard presentation. New source meanings, including self-worth and Neptune–Mercury uncertainty, are proposals documented after the readings.\n\nRead the pairs first, then the source notes. Human approval of each exact target revision is pending in [decision.md](decision.md). The [standard](editorial-standard.md) defines the intended experience; the [reader review](reader-review.md) and [source review](source-review.md) record separate internal assessments.\n\n${pairs.join("\n\n---\n\n")}\n\n---\n\n${notes.replace(/^# Source and policy notes/, "## Source and policy notes")}\n`;

let vite;
let networkAttempts = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { networkAttempts++; throw new Error("Network forbidden in offline editorial validation"); };
let checks;
try {
  const { createServer } = await import("vite");
  vite = await createServer({ root: fileURLToPath(new URL("../../../../", import.meta.url)), configFile: false, envFile: false, appType: "custom", logLevel: "error", server: { middlewareMode: true, hmr: false, ws: false } });
  const { safetyPass } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const { dailyQuestionProblem } = await vite.ssrLoadModule("/src/lib/content/daily-reflection.ts");
  const { completeDailySentences } = await vite.ssrLoadModule("/src/lib/content/daily-writing.ts");
  checks = drafts.cases.map((draft) => {
    const fieldChecks = [ ["headline", draft.headline], ...draft.paragraphs.map((value, index) => [`paragraph${index + 1}`, value]), ["reflection", draft.prompt] ].map(([field, value]) => ({ field, safetyFlags: safetyPass(value).flagged }));
    const questionProblem = dailyQuestionProblem(draft.prompt);
    assert.equal(questionProblem, null, draft.id);
    const sentenceCounts = draft.paragraphs.map((p) => completeDailySentences(p).length);
    assert.ok(sentenceCounts.every((count) => count >= 1 && count <= 4));
    assert.ok(draft.paragraphs.every((p) => words(p) <= 200 && p.length <= 1600));
    return { caseId: draft.id, revision: draft.revision, bodyWords: words(draft.paragraphs.join(" ")), lengthException: draft.lengthException ?? null, reflectionCharacters: draft.prompt.length, paragraphSentenceCounts: sentenceCounts, questionProblem, fieldChecks };
  });
  assert.equal(networkAttempts, 0);
} finally {
  await vite?.close();
  globalThis.fetch = originalFetch;
}
const outputs = {
  "sample-pack.md": sample,
  "reader-packet.md": packet,
  "reader-assignment.json": `${JSON.stringify({ version: "editorial-reader-assignment-1", shuffle: "ascending SHA-256 of fixed namespace, caseId, variant", packetSha256: sha(packet), standardSha256: sha(standard), entries: assignments.map(({ text, ...identity }) => identity), reviewLimit: "Reviewer sees only packet and standard; content differences may reveal authorship or variant. Not empirically blinded human research." }, null, 2)}\n`,
  "validation.json": `${JSON.stringify({ version: "editorial-artifact-validation-2", sourceCommit: baseline.sourceCommit, networkAttempts, provider: "none", baselinePairCount: baseline.cases.length, targetCount: drafts.cases.length, baselineExactTextPreserved: true, draftFileSha256: sha(await read("drafts.json")), sourceProposalFileSha256: sha(await read("source-proposals.json")), sourceSeparation: "Documentation-only writing material, constraints and provenance; no runtime schema or prompt integration", samplePackSha256: sha(sample), readerPacketSha256: sha(packet), checks, policyLimit: "Shape and bounded safety checks only. No citation compatibility claimed for source proposals. Optional guidance, imagery and reassurance remain unresolved under current writing policy; zero flags is not qualification." }, null, 2)}\n`,
};
for (const [name, content] of Object.entries(outputs)) {
  if (mode === "--verify") assert.equal(await read(name), content, name);
  else await writeFile(new URL(name, import.meta.url), content, { flag: mode === "--revise" ? "w" : "wx" });
}
console.log(`PACK_${mode === "--verify" ? "VERIFIED" : "WRITTEN"}: six exact pairs, twelve neutral items, six valid reflections, zero network attempts.`);
for (const check of checks) console.log(`${check.caseId}: ${check.bodyWords} body words, ${check.fieldChecks.reduce((n, field) => n + field.safetyFlags.length, 0)} bounded safety flags`);
