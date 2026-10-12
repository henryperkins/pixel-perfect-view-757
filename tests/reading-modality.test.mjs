import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const originalFetch = globalThis.fetch;
const originalKey = process.env.LOVABLE_API_KEY;
let vite, runCase, bundle, language, captured, responseDraft, calls;
before(async () => {
  const report = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-natal-lens/2026-10-12-qualification-round-3/natal-candidate-partial-report.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  captured = report.cases.find((row) => row.id === "natal-moon-fallback");
  process.env.LOVABLE_API_KEY = "synthetic-modality-no-network";
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ choices: [{ message: { content: JSON.stringify(responseDraft) } }] });
  };
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ runSyntheticEvaluationCase: runCase } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ NATAL_CANDIDATE_BUNDLE: bundle } = await vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
  language = await vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = originalKey;
  await vite?.close();
});

const source =
  "An unfinished reply can offer a place to notice the difference between useful preparation and waiting to have everything settled.";
async function generate(text, statement = source, sourceId = "N1") {
  calls = 0;
  responseDraft = {
    paragraphs: [
      { text, facts: ["C1", "I1", "N1", ...(sourceId === "P1" ? ["P1"] : [])] },
      {
        text: "A title rarely describes everything that holds your attention.",
        facts: ["C1", "D1"],
      },
    ],
  };
  const result = await language.generateReadingProse({
    facts: captured.facts.map((f) =>
      f.id === sourceId
        ? {
            ...f,
            statement:
              sourceId === "N1"
                ? `Published natal lens, an interpretive possibility: ${statement}`
                : `Published phase wording: ${statement}`,
          }
        : f,
    ),
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: { headline: "Fallback", body: "Safe deterministic body.", prompt: "A reflection?" },
  });
  assert.equal(calls, 1, "validation never requests another model draft");
  return result;
}

test("captured dropped qualifier rejects the entire draft but preserves lossless evidence", async () => {
  calls = 0;
  responseDraft = { paragraphs: structuredClone(captured.candidate.paragraphs) };
  const { case: row } = await runCase("natal-moon-fallback", bundle);
  assert.equal(row.diagnostics.outcome, "rejected");
  assert.equal(row.diagnostics.code, "editorial_claim");
  assert.equal(row.output.body, row.template.body);
  assert.equal(row.candidate.captureLossless, true);
  assert.deepEqual(row.candidate.paragraphs, responseDraft.paragraphs);
  assert.equal(calls, 1);
});

for (const modal of ["can", "may", "might"]) {
  test(`near-verbatim ${modal} offer cannot become offers`, async () => {
    const result = await generate(
      source.replace("can offer", "offers"),
      source.replace("can", modal),
    );
    assert.equal(result.meta.diagnostics.code, "editorial_claim");
    assert.equal(result.meta.mode, "template");
  });
  test(`${modal} remains a valid qualification of the same claim`, async () => {
    assert.equal(
      (await generate(source.replace("can", modal))).meta.diagnostics.outcome,
      "accepted",
    );
  });
}
test("another qualified claim cannot conceal a dropped qualifier in the same sentence", async () => {
  const result = await generate(
    "A responsibility can feel demanding, and an unfinished reply offers a place to notice the difference between useful preparation and waiting to have everything settled.",
  );
  assert.equal(result.meta.diagnostics.code, "editorial_claim");
});
test("published phase copy keeps its own can qualifier", async () => {
  const phase =
    "If a demand catches your attention, you can notice your response before deciding how to act.";
  assert.equal((await generate(phase, phase, "P1")).meta.diagnostics.outcome, "accepted");
  const dropped = await generate(phase.replace("can notice", "notice"), phase, "P1");
  assert.equal(dropped.meta.diagnostics.code, "editorial_claim");
  assert.equal(dropped.meta.mode, "template");
});
test("near-verbatim may be cannot become are", async () => {
  const statement = "Sampling a few and choosing one to pursue may be different stages.";
  assert.equal(
    (await generate(statement.replace("may be", "are"), statement)).meta.diagnostics.code,
    "editorial_claim",
  );
});
test("supported categorical wording remains categorical", async () => {
  const categorical = source.replace("can offer", "offers");
  assert.equal((await generate(categorical, categorical)).meta.diagnostics.outcome, "accepted");
});
test("an unchanged categorical sentence alongside a modal sentence stays valid", async () => {
  const categorical =
    "A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.";
  assert.equal(
    (await generate(categorical, `${source} ${categorical}`)).meta.diagnostics.outcome,
    "accepted",
  );
});
test("changed subject or meaning is outside this bounded near-verbatim guard", async () => {
  assert.equal(
    (
      await generate(
        "A practical comparison offers a place to notice the difference between useful preparation and waiting to have everything settled.",
      )
    ).meta.diagnostics.outcome,
    "accepted",
  );
  assert.equal(
    (await generate("An unfinished reply offers a different example in this passage.")).meta
      .diagnostics.outcome,
    "accepted",
  );
});
test("negation and a modal immediately attached to the claim do not look like a dropped modal", async () => {
  for (const text of [
    source.replace("can offer", "could offer"),
    source.replace("can offer", "may not offer"),
  ]) {
    assert.equal((await generate(text)).meta.diagnostics.outcome, "accepted");
  }
});
