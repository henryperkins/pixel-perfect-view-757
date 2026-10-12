import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const originalFetch = globalThis.fetch;
const originalKey = process.env.LOVABLE_API_KEY;
let vite, runCase, natalBundle, report, draft, calls;
before(async () => {
  report = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-natal-lens/2026-10-12-qualification-round-2/natal-candidate-report.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  process.env.LOVABLE_API_KEY = "synthetic-claim-regression-no-network";
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
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
  ({ NATAL_CANDIDATE_BUNDLE: natalBundle } = await vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = originalKey;
  await vite?.close();
});

async function evaluate(id, paragraphs) {
  calls = 0;
  draft = { paragraphs: structuredClone(paragraphs) };
  const result = await runCase(id, natalBundle);
  assert.equal(calls, 1, "Rejected prose must not cause a retry");
  assert.equal(result.case.candidate.captureLossless, true);
  assert.deepEqual(result.case.candidate.paragraphs, draft.paragraphs);
  return result.case;
}
const captured = (id) => report.cases.find((row) => row.id === id).candidate.paragraphs;

for (const [id, code] of [
  ["natal-freedom-reflex", "editorial_claim"],
  ["natal-exact-house", "timing"],
  ["approximate-birth-time", "timing"],
  ["unknown-birth-time", "relation"],
]) {
  test(`observed ${id} unsupported claim rejects the whole draft and retains raw evidence`, async () => {
    const row = await evaluate(id, captured(id));
    assert.equal(row.diagnostics.code, code);
    assert.equal(row.diagnostics.outcome, "rejected");
    assert.equal(row.output.mode, "template");
    assert.equal(row.output.body, row.template.body);
  });
}

test("subjective ownership cannot become an objective allocation", async () => {
  const paragraphs = captured("mercury-conjunction-clinical");
  paragraphs[0] = {
    text: "A cycle of thought and communication resets with fresh curiosity. Mercury's conjunction with natal Mercury sharpens interest in new phrasing, questions, or ideas.",
    facts: ["C1", "I1"],
  };
  const bad = await evaluate("mercury-conjunction-clinical", paragraphs);
  assert.equal(bad.diagnostics.code, "editorial_claim");
  assert.equal(bad.diagnostics.outcome, "rejected");
  paragraphs[1].text =
    "Pace, scope, and the part of a task that feels like yours are separate pieces of working on something. An unfinished list or a draft with competing aims can be a place to notice friction between those pieces.";
  assert.equal(
    (await evaluate("mercury-conjunction-clinical", paragraphs)).diagnostics.outcome,
    "accepted",
  );
});

test("supported freedom condition can accompany the scene without making the scene its cause", async () => {
  const paragraphs = captured("natal-freedom-reflex");
  paragraphs[1].text =
    "If an ordinary obligation feels narrow, wanting room to move can be part of a response to pressure. Facing that responsibility, a useful distinction may be between the commitment itself and how much choice it leaves in carrying it out.";
  assert.equal(
    (await evaluate("natal-freedom-reflex", paragraphs)).diagnostics.outcome,
    "accepted",
  );
});

test("current window position and exact timing stay separate while all supplied detail survives", async () => {
  const paragraphs = captured("natal-exact-house");
  paragraphs[1].text =
    "The contact is in its approaching phase within the calculated window. This reading falls in the middle part of the calculated window. The current orb is 0.42 degrees. Calculated exact alignment occurs on 2026-10-14, which is in 3 days.";
  assert.equal((await evaluate("natal-exact-house", paragraphs)).diagnostics.outcome, "accepted");
});

test("a sky location for the transiting body preserves an explicitly natal target", async () => {
  const paragraphs = captured("unknown-birth-time");
  paragraphs[0].text =
    "An established role can feel demanding when its obligations require more deliberate effort than usual. In the sky, Saturn forms a square to natal Sun with an orb of 0.42 degrees.";
  paragraphs[2].text =
    "The contact is in its approaching phase within the calculated window. This reading falls in the middle part of the calculated window. The transit is calculated exact in 3 days on 2026-10-14.";
  assert.equal((await evaluate("unknown-birth-time", paragraphs)).diagnostics.outcome, "accepted");
});
