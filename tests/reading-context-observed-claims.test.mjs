import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, language, claims, benchmarks, natal;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  claims = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-claims.ts");
  benchmarks = await readContextBenchmarks();
  natal = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-context-production/2026-10-17/pilot/02-natal-only.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).case.candidate;
});
beforeEach(async () => h.reset());
after(async () => h?.close());

async function candidate(paragraphs, benchmark) {
  const { input } = await contextWritingFixture(h, benchmark);
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] }),
  );
  return language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
}

function assertCapturedRejection(result, paragraphs, benchmark) {
  assert.equal(result.prose.meta.mode, "template");
  assert.equal(result.prose.meta.diagnostics.code, "editorial_claim");
  assert.equal(result.prose.meta.diagnostics.outcome, "rejected");
  assert.equal(result.prose.meta.diagnostics.attempted, true);
  assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  assert.deepEqual(result.candidate.paragraphs, paragraphs);
  assert.equal(result.candidate.captureLossless, true);
  assert.equal(h.gatewayRequests.length, 1, "reject without retrying the provider");
}

// Removing the already-detected easily leaves a second independent ease claim.
test("the observed extra-check simply-removal claim rejects even after easily is removed", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "natal-only");
  const paragraphs = structuredClone(natal.paragraphs);
  paragraphs[0].text = paragraphs[0].text.replace("can easily attach", "can attach");
  assertCapturedRejection(await candidate(paragraphs, benchmark), paragraphs, benchmark);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

// Neither an if condition nor a modal supplies a new effect of the scene image.
test("the observed notes-tab attention consequence rejects after both ease additions are removed", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "natal-only");
  const paragraphs = structuredClone(natal.paragraphs);
  paragraphs[0].text = paragraphs[0].text
    .replace("can easily attach", "can attach")
    .replace("could simply be left out", "could be left out");
  assertCapturedRejection(await candidate(paragraphs, benchmark), paragraphs, benchmark);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

// The full synthesis capture reaches an earlier safety guard. Exercise the real
// claim boundary directly so removing it cannot hide behind that other rejection.
test("I2 reciprocal reinforcement does not license initiative causing appeal", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const { facts } = await contextWritingFixture(h, benchmark);
  assert.ok(
    claims.dailyContextClaimProblem(
      [
        "When an aim is well chosen, practical initiative can make another piece of the same project start to look appealing to take up, though ease in starting isn't a guarantee about its result.",
      ],
      facts,
    ),
  );
});

test("the observed causal and ease predicates keep their boundaries across small wording changes", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const { facts } = await contextWritingFixture(h, benchmark);
  for (const sentence of [
    "If the original work fills the afternoon, another version could simply be omitted.",
    "A tab for another idea may blur where your attention belongs.",
    "When an aim is well chosen, initiative may cause a larger piece of work to seem appealing.",
  ]) {
    assert.ok(claims.dailyContextClaimProblem([sentence], facts), sentence);
  }
});

test("supported note and initiative uses do not become word bans or cross-clause matches", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const { facts } = await contextWritingFixture(h, benchmark);
  for (const sentence of [
    "If the original work fills the afternoon, the extra check could be left out; the note is simply a note, not a promise of those hours.",
    "When an aim is well chosen, enthusiasm and practical initiative can reinforce each other; another piece of the same project may start to look appealing.",
    "When an aim is well chosen, practical initiative and enthusiasm can reinforce one another, with less friction in taking up a larger piece of work.",
    "If several projects compete for the afternoon, a page of notes for one idea can sit beside a tab open for another.",
  ]) {
    assert.equal(claims.dailyContextClaimProblem([sentence], facts), null, sentence);
  }
});

test("the observed predicates are bound to their reviewed source keys and release", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const { facts } = await contextWritingFixture(h, benchmark);
  const sentence =
    "An extra check could simply be removed. A tab may blur where your attention belongs. Practical initiative can make another piece look appealing.";
  for (const other of [
    facts.map((fact) => ({ ...fact, sourceKey: `other:${fact.sourceKey}` })),
    facts.map((fact) => ({ ...fact, releaseVersion: "future-source-release" })),
  ]) {
    assert.equal(claims.dailyContextClaimProblem([sentence], other), null);
  }
});

test("repairing the three observed additions preserves the draft instead of rejecting its scene words", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "natal-only");
  const paragraphs = structuredClone(natal.paragraphs);
  paragraphs[0].text = paragraphs[0].text
    .replace("can easily attach", "can attach")
    .replace("could simply be left out", "could be left out");
  paragraphs[1].text = paragraphs[1].text.replace(
    "keeping a page of notes for one idea beside a tab open for another can blur where your attention belongs",
    "a page of notes for one idea can sit beside a tab open for another",
  );
  const result = await candidate(paragraphs, benchmark);
  assert.equal(result.prose.meta.mode, "model");
  assert.equal(result.prose.body, paragraphs.map((p) => p.text).join("\n\n"));
  assert.deepEqual(result.candidate.paragraphs, paragraphs);
  assert.equal(h.gatewayRequests.length, 1);
});

test("the new observed guards leave established member and synthetic routes unchanged", async () => {
  const benchmark = benchmarks.cases.find((b) => b.id === "natal-only");
  const { input } = await contextWritingFixture(h, benchmark);
  const paragraphs = structuredClone(natal.paragraphs);
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] }),
  );
  const synthetic = await language.generateSyntheticReadingProse(input, "lovable");
  const member = await language.generateReadingProse(input);
  assert.equal(synthetic.prose.meta.mode, "model");
  assert.equal(member.meta.mode, "model");
  assert.equal(member.body, paragraphs.map((p) => p.text).join("\n\n"));
  assert.equal(member.body, synthetic.prose.body);
  assert.equal(h.gatewayRequests.length, 2);
});
