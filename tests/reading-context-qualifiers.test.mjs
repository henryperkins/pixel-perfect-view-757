import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, language, packet, captures;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  packet = await readContextBenchmarks();
  captures = await Promise.all(
    ["01-contact-only", "02-natal-only", "05-synthesis-natal-and-transit"].map(
      async (name) =>
        JSON.parse(
          await readFile(
            new URL(
              `../docs/reviews/daily-reading-context-writer/2026-10-17/provider-pilot-2/${name}.json`,
              import.meta.url,
            ),
            "utf8",
          ),
        ).case.candidate,
    ),
  );
});
beforeEach(async () => h.reset());
after(async () => h?.close());

async function generate(paragraphs, benchmark, context = true) {
  const { input } = await contextWritingFixture(h, benchmark);
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] }),
  );
  return language.generateSyntheticReadingProse(
    input,
    "lovable",
    {},
    context ? benchmark : undefined,
  );
}

function assertRejected(result, benchmark, captured) {
  assert.equal(result.prose.meta.mode, "template");
  assert.equal(result.prose.meta.diagnostics.code, "editorial_claim");
  assert.equal(result.prose.meta.diagnostics.outcome, "rejected");
  assert.equal(result.prose.meta.diagnostics.attempted, true);
  assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  assert.equal(result.prose.headline, benchmark.headline);
  assert.equal(result.prose.prompt, benchmark.reflection);
  assert.deepEqual(result.candidate.paragraphs, captured);
  assert.equal(result.candidate.captureLossless, true);
  assert.equal(h.gatewayRequests.length, 1, "reject once without another model request");
  assert.equal(h.geminiEnterpriseRequests.length, 0);
}

// Removing the candidate guard would again autoaccept all three exact paid captures.
for (const [capture, benchmarkId] of [
  [0, "contact-only"],
  [1, "natal-only"],
  [2, "synthesis-natal-and-transit"],
]) {
  test(`second pilot ${benchmarkId} amplification rejects losslessly with the full benchmark fallback`, async () => {
    const benchmark = packet.cases.find((b) => b.id === benchmarkId);
    const paragraphs = structuredClone(captures[capture].paragraphs);
    assertRejected(await generate(paragraphs, benchmark), benchmark, paragraphs);
  });
}

for (const name of ["03-transit-only", "04-natal-and-transit"]) {
  test(`source-clean second-pilot ${name} stays accepted`, async () => {
    const capture = JSON.parse(
      await readFile(
        new URL(
          `../docs/reviews/daily-reading-context-writer/2026-10-17/provider-pilot-2/${name}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const benchmark = packet.cases.find((b) => b.id === name.slice(3));
    const paragraphs = capture.case.candidate.paragraphs;
    const result = await generate(paragraphs, benchmark);
    assert.equal(result.prose.meta.mode, "model");
    assert.equal(result.prose.body, paragraphs.map((p) => p.text).join("\n\n"));
    assert.equal(h.gatewayRequests.length, 1);
  });
}

// A modal in another claim must never license the definite source claim after it.
for (const definite of [
  "Giving a plan more scope simply increases the structure needed to carry it.",
  "Giving a plan more scope often increases the structure needed to hold it.",
  "Giving a plan more scope increases steadily the structure needed to hold it.",
  "An obligation may ask for effort, and giving a plan more scope also increases the structure needed to carry it.",
  "An obligation might ask for effort; giving a plan more scope increases the structure needed to carry it.",
]) {
  test(`the source claim keeps its own qualifier: ${definite}`, async () => {
    const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
    const paragraphs = structuredClone(benchmark.paragraphs);
    paragraphs[1].text = `${definite} ${benchmark.chronology}`;
    assertRejected(await generate(paragraphs, benchmark), benchmark, paragraphs);
  });
}

for (const modal of ["can", "may", "could", "might"]) {
  test(`${modal} still qualifies its own claim across an intervening adverb`, async () => {
    const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
    const paragraphs = structuredClone(benchmark.paragraphs);
    paragraphs[1].text = `Giving a plan more scope ${modal} also increase the structure needed to carry it. ${benchmark.chronology}`;
    const result = await generate(paragraphs, benchmark);
    assert.equal(result.prose.meta.mode, "model");
    assert.equal(result.prose.meta.diagnostics.code, "accepted");
  });
}

test("a hypothetical scene does not authorize a new speed claim", async () => {
  const benchmark = packet.cases[0];
  const paragraphs = structuredClone(benchmark.paragraphs);
  paragraphs[0].text =
    "If an extra check is added beside the original task, its expectations may quickly exceed the capacity available.";
  assertRejected(await generate(paragraphs, benchmark), benchmark, paragraphs);
});

test("I2 ease remains allowed in its own supported claim", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const paragraphs = structuredClone(benchmark.paragraphs);
  paragraphs[0].text =
    "When an aim is well chosen, effort can easily move toward a larger piece of work. Giving a plan more scope can increase the structure needed to carry it.";
  const result = await generate(paragraphs, benchmark);
  assert.equal(result.prose.meta.mode, "model");
  assert.equal(result.prose.meta.diagnostics.code, "accepted");
});

test("ease tied directly to I2 effort and little friction stays accepted", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const paragraphs = structuredClone(benchmark.paragraphs);
  paragraphs[0].text =
    "When an aim is well chosen, effort can easily encounter little friction. Giving a plan more scope can increase the structure needed to carry it.";
  const result = await generate(paragraphs, benchmark);
  assert.equal(result.prose.meta.mode, "model");
});

test("citing I2 does not license ease for a different source's extra-check claim", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const paragraphs = structuredClone(benchmark.paragraphs);
  paragraphs[0].text =
    "If an extra check or another version is added, it can easily slip beside the original task. Giving a plan more scope can increase the structure needed to carry it.";
  assertRejected(await generate(paragraphs, benchmark), benchmark, paragraphs);
});

test("an I2 destination phrase cannot license the extra-check easily-slip claim", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const paragraphs = structuredClone(benchmark.paragraphs);
  paragraphs[0].text =
    "An extra check or another version can easily slip into the larger piece of work.";
  assertRejected(await generate(paragraphs, benchmark), benchmark, paragraphs);
});

test("a source anchor inside another subject does not license easily-slip", async () => {
  const benchmark = packet.cases.find((b) => b.id === "synthesis-natal-and-transit");
  const paragraphs = structuredClone(benchmark.paragraphs);
  paragraphs[0].text =
    "An extra check for this effort can easily slip into the larger piece of work.";
  assertRejected(await generate(paragraphs, benchmark), benchmark, paragraphs);
});

test("the unchanged approved benchmarks remain accepted", async () => {
  for (const benchmark of packet.cases) {
    const result = await generate(structuredClone(benchmark.paragraphs), benchmark);
    assert.equal(result.prose.meta.mode, "model", benchmark.id);
  }
  assert.equal(h.gatewayRequests.length, 5);
});

test("candidate-only checks leave normal member and synthetic behavior unchanged", async () => {
  const benchmark = packet.cases[0];
  const paragraphs = structuredClone(captures[0].paragraphs);
  const synthetic = await generate(paragraphs, benchmark, false);
  assert.equal(synthetic.prose.meta.mode, "model");
  const { input } = await contextWritingFixture(h, benchmark);
  const member = await language.generateReadingProse(input);
  assert.equal(member.meta.mode, "model");
  assert.equal(member.body, synthetic.prose.body);
  assert.equal(h.gatewayRequests.length, 2);
});
