import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let vite, schema, base, invalidate;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  schema = await vite.ssrLoadModule("/src/lib/content/schema.ts");
  ({ DEFAULT_BUNDLE: base } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
  ({ invalidateDailyWritingFrames: invalidate } = await vite.ssrLoadModule(
    "/src/lib/content/daily-writing-invalidation.ts",
  ));
});
after(async () => await vite?.close());
const frame = () => ({
  key: "reply-frame",
  source: { kind: "interpretation", key: "conjunction:mercury:mercury" },
  templateSentenceIndex: 0,
  scenes: [
    {
      key: "reply",
      situation: "If a reply stays unfinished, its point can need clearer wording.",
      focus: "The comparison concerns meaning and wording.",
      cues: { objects: ["reply"], actions: ["wording"] },
    },
  ],
  reflection: { standard: "Which point would you like to articulate more clearly?" },
});
const bundle = () => ({
  ...structuredClone(base),
  version: "0.8.0",
  schemaVersion: 5,
  dailyWritingFrames: [frame()],
});
test("schema 5 validates exact source-owned frames and preserves them without default borrowing", () => {
  const b = bundle();
  schema.validateContentGraph(b);
  const normalized = schema.normalizeContentBundle(b, b.version, base);
  assert.deepEqual(normalized.dailyWritingFrames, b.dailyWritingFrames);
  assert.equal(normalized.schemaVersion, 5);
  const legacy = schema.normalizeContentBundle(base, base.version, b);
  assert.deepEqual(legacy.dailyWritingFrames, []);
  const empty = schema.normalizeContentBundle({ ...b, dailyWritingFrames: [] }, b.version, b);
  assert.deepEqual(empty.dailyWritingFrames, []);
});
test("frames cannot bind absent or independent sources or invalid source sentences", () => {
  for (const change of [
    (f) => (f.source.key = "absent"),
    (f) => {
      f.source.kind = "synthesis";
      f.source.key = "taste-curiosity-independent";
    },
    (f) => (f.templateSentenceIndex = 100),
    (f) => (f.templateSentenceIndex = -1),
  ]) {
    const b = bundle();
    change(b.dailyWritingFrames[0]);
    assert.throws(() => schema.validateContentGraph(b), /source|sentence|frame/i);
  }
});
test("frame bounds reject duplicated bindings, scenes, malformed cues, unsafe or compound questions", () => {
  for (const change of [
    (b) => b.dailyWritingFrames.push({ ...frame(), key: "another" }),
    (b) => b.dailyWritingFrames[0].scenes.push(structuredClone(b.dailyWritingFrames[0].scenes[0])),
    (b) => (b.dailyWritingFrames[0].scenes[0].situation = "Two sentences. Another sentence."),
    (b) => (b.dailyWritingFrames[0].scenes[0].focus = "x".repeat(181)),
    (b) => (b.dailyWritingFrames[0].scenes[0].cues.objects = ["Reply"]),
    (b) => (b.dailyWritingFrames[0].reflection.standard = "What matters and how will you act?"),
    (b) => (b.dailyWritingFrames[0].reflection.lowSleep = "How should you invest your money?"),
    (b) => (b.dailyWritingFrames = "bad"),
    (b) => (b.dailyWritingFrames = Array(2001).fill(frame())),
  ]) {
    const b = bundle();
    change(b);
    assert.throws(() => schema.validateContentGraph(b), /frame|scene|cue|question|reflection/i);
  }
});
test("editing or deleting source copy removes its frame and dependent synthesis frames while preserving untouched frames", () => {
  const before = bundle();
  const next = structuredClone(before);
  next.cycles.find((c) => c.key === "conjunction:mercury:mercury").question =
    "Which point needs words?";
  const result = invalidate(before, next);
  assert.deepEqual(result.removedFrameKeys, ["reply-frame"]);
  assert.deepEqual(result.bundle.dailyWritingFrames, []);
  const unrelated = structuredClone(before);
  unrelated.cycles.find((c) => c.key === "trine:mars:sun").mechanism +=
    " One task can be a comparison.";
  assert.deepEqual(
    invalidate(before, unrelated).bundle.dailyWritingFrames,
    before.dailyWritingFrames,
  );
  const deleted = structuredClone(before);
  deleted.cycles = deleted.cycles.filter((c) => c.key !== "conjunction:mercury:mercury");
  assert.equal(invalidate(before, deleted).bundle.dailyWritingFrames.length, 0);
});
test("scene and compact sentence validation reject unsupplied placements/dates but permit ordinary house and energy vocabulary", () => {
  for (const text of [
    "If your Sun is in Taurus, a reply can have clearer wording.",
    "If the tenth house defines this choice, a reply can have clearer wording.",
    "The event happens on 2026-10-14.",
    "The current orb is 1.2 degrees.",
    "If the natal Sun forms a square to the natal Moon, a reply could need words.",
    "If your rising is unsettled, a reply can need clearer wording.",
  ]) {
    const b = bundle();
    b.dailyWritingFrames[0].scenes[0].situation = text;
    assert.throws(() => schema.validateContentGraph(b), /scene/i);
  }
  const valid = bundle();
  valid.dailyWritingFrames[0].scenes[0].situation =
    "If a task around the house needs energy, its point can need clearer wording.";
  schema.validateContentGraph(valid);
  valid.dailyWritingFrames[0].scenes[0].situation =
    "If your rising workload needs a clearer point, a reply can give it words.";
  schema.validateContentGraph(valid);
  const source = bundle();
  source.cycles.find((c) => c.key === "conjunction:mercury:mercury").mechanism =
    "Your Sun is in Taurus. An idea can need words.";
  assert.throws(() => schema.validateContentGraph(source), /sentence/i);
});
