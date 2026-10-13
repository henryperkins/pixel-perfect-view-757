import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let vite, writing;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  writing = await vite.ssrLoadModule("/src/lib/content/daily-writing.ts");
});
after(async () => await vite?.close());
const scene = {
  key: "reply",
  situation: "If a reply remains unfinished, the point may need clearer wording.",
  focus: "The comparison concerns meaning and wording.",
  cues: { objects: ["reply"], actions: ["wording"] },
};
const frame = (kind, key) => ({
  key: "frame-" + key,
  source: { kind, key },
  templateSentenceIndex: 0,
  scenes: [scene],
  reflection: {
    standard: "Which point needs clearer wording?",
    highStress: "Which point could be simplest to describe?",
    lowSleep: "Which point could wait?",
  },
});
const bundle = () => ({
  version: "0.8.0",
  schemaVersion: 5,
  cycles: [
    {
      key: "hard:mercury:mercury",
      mechanism: "A point can need clearer wording. A reply can be an example.",
      question: "Which point needs clearer wording?",
    },
  ],
  synthesisRules: [
    {
      key: "pair",
      relationship: "tension",
      mechanism: "A response can need both a clear point and a workable pace.",
      primary: { interpretationKey: "hard:mercury:mercury", theme: "expression" },
      supporting: { interpretationKey: "square:mars:sun", theme: "initiative" },
    },
  ],
  dailyWritingFrames: [frame("interpretation", "hard:mercury:mercury"), frame("synthesis", "pair")],
});
const plan = () => ({
  releaseVersion: "0.8.0",
  interpretations: [
    {
      index: 1,
      cycleKey: "mercury_conjunction_mercury",
      interpretationKey: "hard:mercury:mercury",
      mechanism: "A point can need clearer wording. A reply can be an example.",
      themes: [],
    },
  ],
  synthesis: null,
  pairStatus: "independent",
  pairRuleKey: null,
});

test("a positive synthesis owns the scene while independent pairs retain the primary theme", () => {
  const input = plan();
  input.synthesis = {
    ruleKey: "pair",
    relationship: "tension",
    mechanism: bundle().synthesisRules[0].mechanism,
    dependsOn: ["C1", "I1", "C2", "I2"],
    releaseVersion: "0.8.0",
  };
  input.pairStatus = "selected";
  const selected = writing.resolveDailyWritingPlan(bundle(), input);
  assert.equal(selected.theme.factId, "S1");
  assert.deepEqual(selected.theme.requiredFacts, ["S1", "C1", "I1", "C2", "I2"]);
  assert.equal(selected.frame.source.key, "pair");
  const independent = writing.resolveDailyWritingPlan(bundle(), plan());
  assert.equal(independent.theme.factId, "I1");
  assert.equal(independent.frame.source.key, "hard:mercury:mercury");
  assert.equal(independent.scenes[0].id, "SC1");
});

test("missing, legacy and explicitly empty frames never borrow another scene; quiet plans remain scene-free", () => {
  const missing = bundle();
  missing.dailyWritingFrames = [];
  assert.equal(writing.resolveDailyWritingPlan(missing, plan()).status, "no_frame");
  delete missing.dailyWritingFrames;
  assert.equal(writing.resolveDailyWritingPlan(missing, plan()).scenes.length, 0);
  const quiet = plan();
  quiet.interpretations = [];
  assert.equal(writing.resolveDailyWritingPlan(bundle(), quiet).status, "no_primary");
  const literal = bundle();
  literal.cycles[0].key = "hard:*:*";
  literal.dailyWritingFrames = [frame("interpretation", "hard:*:*")];
  const input = plan();
  input.interpretations[0].interpretationKey = "hard:*:*";
  assert.equal(writing.resolveDailyWritingPlan(literal, input).status, "ready");
});

test("brief is a strict allowlist and ignores reflection variants, context, history, natal and story additions", () => {
  const input = plan();
  input.privateContext = "Private journal sentinel";
  input.natalLensPlan = { privateBirth: "Private birth sentinel" };
  const selected = writing.resolveDailyWritingPlan(bundle(), input);
  const brief = writing.toDailyWritingBrief(selected);
  assert.deepEqual(Object.keys(brief).sort(), ["requiredFacts", "scenes", "themeFactId"]);
  assert.deepEqual(Object.keys(brief.scenes[0]).sort(), ["cues", "focus", "id", "situation"]);
  assert.ok(!JSON.stringify(brief).includes("Which point"));
  assert.ok(!JSON.stringify(brief).includes("Private"));
  assert.equal(selected.templateSources[0].sentences.length, 1);
});

test("brief validation binds scene guidance to exact saved source, release and required fact parents", () => {
  const selected = writing.resolveDailyWritingPlan(bundle(), plan()),
    brief = writing.toDailyWritingBrief(selected);
  const facts = [
    { id: "C1", statement: "Calculated contact." },
    {
      id: "I1",
      statement: "Published meaning.",
      kind: "interpretation",
      sourceKey: "hard:mercury:mercury",
      releaseVersion: "0.8.0",
      dependsOn: ["C1"],
    },
  ];
  writing.assertDailyWritingBrief(brief, selected, facts);
  assert.throws(
    () =>
      writing.assertDailyWritingBrief(
        { ...brief, scenes: [{ ...brief.scenes[0], id: "SC2" }] },
        selected,
        facts,
      ),
    /scene|brief/i,
  );
  assert.throws(
    () =>
      writing.assertDailyWritingBrief(
        brief,
        selected,
        facts.map((f) => (f.id === "I1" ? { ...f, releaseVersion: "older" } : f)),
      ),
    /release|source/i,
  );
  assert.throws(
    () =>
      writing.assertDailyWritingBrief(
        brief,
        selected,
        facts.filter((f) => f.id !== "C1"),
      ),
    /parent|fact/i,
  );
});
