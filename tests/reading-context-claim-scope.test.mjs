import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, language, benchmarks, firstPilot;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  benchmarks = await readContextBenchmarks();
  firstPilot = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-context-writer/2026-10-17/provider-pilot/01-contact-only.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).case.candidate;
});
beforeEach(async () => h.reset());
after(async () => h?.close());

function reply(paragraphs) {
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] }),
  );
}

async function candidate(paragraphs, benchmark = benchmarks.cases[0]) {
  const { input } = await contextWritingFixture(h, benchmark);
  reply(paragraphs);
  return language.generateSyntheticReadingProse(input, "lovable", {}, benchmark);
}

// An opening "might" cannot qualify the separate unsupported recent-onset
// assertion captured in the first live pilot. Retain that exact failed draft.
test("first pilot recent-onset assertion rejects despite a preceding sentence's might; capture and full fallback survive one request", async () => {
  const paragraphs = structuredClone(firstPilot.paragraphs);
  assert.match(paragraphs[0].text, /^You might find/);
  assert.match(
    paragraphs[0].text,
    /\. Transit Saturn's square to your natal Sun highlights the places where expectations have begun to outpace your available capacity\./,
  );
  const result = await candidate(paragraphs);
  const benchmark = benchmarks.cases[0];
  assert.equal(result.prose.meta.mode, "template");
  assert.equal(result.prose.meta.diagnostics.outcome, "rejected");
  assert.equal(result.prose.meta.diagnostics.code, "editorial_claim");
  assert.equal(result.prose.meta.diagnostics.paragraph, 1);
  assert.equal(result.prose.meta.diagnostics.attempted, true);
  assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  assert.equal(result.prose.headline, benchmark.headline);
  assert.equal(result.prose.prompt, benchmark.reflection);
  assert.deepEqual(result.candidate, firstPilot);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("the same recent-onset wording remains allowed inside an explicit hypothetical", async () => {
  const paragraphs = structuredClone(firstPilot.paragraphs);
  paragraphs[0].text =
    "You might find that an established role feels particularly demanding right now, especially when familiar obligations ask for more deliberate effort than usual. If expectations have begun to outpace your available capacity, Saturn's square to your natal Sun offers a picture of that tension.";
  const result = await candidate(paragraphs);
  assert.equal(result.prose.meta.mode, "model");
  assert.equal(result.prose.meta.diagnostics.code, "accepted");
  assert.equal(result.prose.body, paragraphs.map((p) => p.text).join("\n\n"));
  assert.deepEqual(result.candidate.paragraphs, paragraphs);
  assert.equal(h.gatewayRequests.length, 1);
});

test("all five approved context benchmarks remain structurally accepted", async () => {
  for (const benchmark of benchmarks.cases) {
    const result = await candidate(structuredClone(benchmark.paragraphs), benchmark);
    assert.equal(result.prose.meta.mode, "model", benchmark.id);
    assert.equal(result.prose.meta.diagnostics.code, "accepted", benchmark.id);
    assert.equal(result.prose.body, benchmark.paragraphs.map((p) => p.text).join("\n\n"));
  }
  assert.equal(h.gatewayRequests.length, 5);
});

test("the bounded candidate guard does not change the normal member or synthetic route", async () => {
  const { input } = await contextWritingFixture(h, benchmarks.cases[0]);
  reply(firstPilot.paragraphs);
  const member = await language.generateReadingProse(input);
  assert.equal(member.meta.mode, "model");
  assert.equal(member.body, firstPilot.paragraphs.map((p) => p.text).join("\n\n"));
  const synthetic = await language.generateSyntheticReadingProse(input, "lovable");
  assert.equal(synthetic.prose.meta.mode, "model");
  assert.equal(synthetic.prose.body, member.body);
  assert.equal(h.gatewayRequests.length, 2);
});
