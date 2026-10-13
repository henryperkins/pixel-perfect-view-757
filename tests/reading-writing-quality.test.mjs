import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let vite, quality, voice;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  quality = await vite.ssrLoadModule("/src/lib/ai/daily-writing-quality.ts");
  voice = await vite.ssrLoadModule("/src/lib/ai/daily-voice.ts");
});
after(async () => await vite?.close());
const scene = {
  id: "SC1",
  key: "reply",
  situation: "If a reply stays unfinished, its point can need clearer wording.",
  focus: "The comparison concerns the wording of a reply.",
  cues: { objects: ["reply"], actions: ["wording"] },
};
const plan = {
  version: "daily-concrete-writing-1",
  status: "ready",
  releaseVersion: "0.8.0",
  theme: { factId: "I1", sourceKey: "reply", relationship: null, requiredFacts: ["C1", "I1"] },
  frame: {},
  scenes: [scene],
  templateSources: [],
};
const paragraph = (text) => ({ text, facts: ["C1", "I1"], scenes: ["SC1"] });
const check = (paragraphs, overrides = {}) =>
  quality.checkDailyWritingQuality({
    paragraphs,
    plan,
    renderMode: "framed",
    recent: [],
    requiredLiteralSentences: [],
    sourceTexts: [],
    example: null,
    ...overrides,
  });
const has = (report, code, severity) =>
  report.issues.some((i) => i.code === code && (!severity || i.severity === severity));
test("declared scenes need exact identities and central parents, and cannot be reused", () => {
  assert.equal(
    check([paragraph("If a reply needs clearer wording, its point can remain the same.")]).outcome,
    "pass",
  );
  assert.ok(
    has(
      check([{ ...paragraph("A reply can need wording."), scenes: ["EX-SC1"] }]),
      "scene_reference",
      "reject",
    ),
  );
  assert.ok(
    has(
      check([{ ...paragraph("A reply can need wording."), facts: ["I1"] }]),
      "scene_parent",
      "reject",
    ),
  );
  assert.ok(
    has(
      check([paragraph("A reply can need wording."), paragraph("Another reply can need wording.")]),
      "scene_reference",
      "reject",
    ),
  );
  assert.ok(
    has(
      check([{ text: "A point can need words.", facts: ["C1", "I1"], scenes: [] }]),
      "scene_missing",
      "reject",
    ),
  );
});
test("cue observations warn without rejecting valid paraphrases, and unavailable modes retain clear status", () => {
  const warning = check([
    paragraph(
      "If a message remains unfinished, choosing its language can offer a point of comparison.",
    ),
  ]);
  assert.equal(warning.outcome, "warning");
  assert.ok(has(warning, "scene_unverified"));
  const empty = [{ text: "A point can need words.", facts: ["C1", "I1"], scenes: [] }];
  assert.equal(check(empty, { renderMode: "unframed" }).outcome, "pass");
  const minimal = check(empty, { renderMode: "minimal" });
  assert.equal(minimal.outcome, "warning");
  assert.equal(minimal.issues[0].ruleId, "template_editorial_failure");
});
test("narrow personal-event checks keep their qualification attached to the event clause", () => {
  for (const text of [
    "You ignored the reply this morning.",
    "You accepted that task yesterday before wording a reply.",
    "If an option feels appealing, you ignored the reply this morning.",
  ])
    assert.ok(has(check([paragraph(text)]), "scene_assertion", "reject"), text);
  for (const text of [
    "If you ignored the reply this morning, its wording could be considered again.",
    "You may have ignored the reply this morning.",
    "If a reply stays unfinished, its wording can need attention.",
    "Yesterday is a word in the reply that needs wording.",
  ])
    assert.ok(!has(check([paragraph(text)]), "scene_assertion"), text);
});
test("exact sentence duplication preserves negation and numbers; repeated published sentences still reject", () => {
  const s = "The wording of a reply can give one point a clearer form.";
  assert.ok(
    has(check([paragraph(`${s} ${s}`)], { sourceTexts: [s] }), "sentence_duplicate", "reject"),
  );
  assert.ok(
    !has(
      check([
        paragraph(
          "The wording of a reply can give one point a clearer form. The wording of a reply cannot give one point a clearer form.",
        ),
      ]),
      "sentence_duplicate",
    ),
  );
  assert.ok(
    !has(
      check([
        paragraph(
          "The reply has 12 words in its current wording and can be compared. The reply has 13 words in its current wording and can be compared.",
        ),
      ]),
      "sentence_duplicate",
    ),
  );
});
test("only the complete stock phrases warn, and reports contain bounded codes instead of matched text", () => {
  for (const text of [
    "Leave space between appointments while considering the wording of a reply.",
    "The energy needed for a task can be described in a reply.",
    "Align the columns before checking the reply wording.",
  ])
    assert.ok(!has(check([paragraph(text)]), "stock_abstraction"));
  const r = check([paragraph("Trust the process while a reply takes shape in wording.")]);
  assert.ok(has(r, "stock_abstraction", "warning"));
  assert.ok(!JSON.stringify(r).includes("Trust the process"));
  assert.throws(
    () => check([paragraph("A reply can need wording.")], { sourceTexts: Array(33).fill("text") }),
    /bound|source/i,
  );
});
test("copying a complete long demonstration sentence rejects unless independently supplied by a published source", () => {
  const example = voice.DAILY_VOICE_EXAMPLES.plain.standard,
    text = example.paragraphs[0].text.split(". ")[0] + ".";
  assert.ok(has(check([paragraph(text)], { example }), "example_copy", "reject"));
  assert.ok(!has(check([paragraph(text)], { example, sourceTexts: [text] }), "example_copy"));
});
test("cross-day reuse only warns and excludes required literal chronology, not arbitrary published prose", () => {
  const text =
    "If a reply remains unfinished, its wording can provide one ordinary point of comparison.";
  const recent = [{ day: "2026-10-11", paragraphs: [text], requiredLiteralSentences: [] }];
  const r = check([paragraph(text)], { recent });
  assert.equal(r.outcome, "warning");
  assert.ok(has(r, "recent_opening_repeat"));
  assert.ok(has(r, "recent_sentence_repeat"));
  assert.ok(
    !has(
      check([paragraph(text)], { recent, requiredLiteralSentences: [text] }),
      "recent_sentence_repeat",
    ),
  );
});
test("six-word repetitions count nonoverlapping uses across distinct sentences and bound issue records", () => {
  const text =
    "The wording of a reply can illustrate one ordinary point. The wording of a reply can illustrate a different point. The wording of a reply can illustrate a third point.";
  assert.ok(has(check([paragraph(text)]), "phrase_repeat", "warning"));
  const report = check(
    Array.from({ length: 20 }, () =>
      paragraph("You ignored the reply this morning. Trust the process."),
    ),
  );
  assert.equal(report.outcome, "reject");
  assert.ok(report.issues.length <= 20);
  assert.ok(
    report.issues.every(
      (i) => Object.keys(i).sort().join(",") === "code,paragraph,ruleId,severity",
    ),
  );
});
