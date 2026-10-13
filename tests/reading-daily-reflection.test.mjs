import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
let vite, reflection;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  reflection = await vite.ssrLoadModule("/src/lib/content/daily-reflection.ts");
});
after(async () => await vite?.close());
const plan = () => ({
  version: "daily-concrete-writing-1",
  releaseVersion: "0.8.0",
  status: "ready",
  theme: {
    factId: "S1",
    sourceKey: "pair",
    relationship: "tension",
    requiredFacts: ["S1", "C1", "I1", "C2", "I2"],
  },
  frame: {
    key: "frame-pair",
    reflection: {
      standard: "Which commitment could leave room for an option?",
      highStress: "Which commitment could be made a little smaller?",
      lowSleep: "Which commitment would be simplest to reconsider?",
    },
  },
  scenes: [],
  templateSources: [],
});
const context = () => ({
  granted: new Set(),
  tone: "plain",
  depth: "standard",
  localBucket: null,
  checkIn: null,
  wellness: null,
});
test("questions reject compound focus, instructions, placements and unsafe text while allowing coordinated nouns", () => {
  for (const value of [
    "Reflection: Which commitment matters?",
    "Which commitment matters? Where will you begin?",
    "Consider your options; which one matters?",
    "Which commitment matters\ntoday?",
    "Observation?",
  ])
    assert.ok(reflection.dailyQuestionProblem(value));
  assert.equal(
    reflection.dailyQuestionProblem("What needs attention and how will you act?"),
    "compound",
  );
  assert.equal(
    reflection.dailyQuestionProblem("Which option matters and which could wait?"),
    "compound",
  );
  assert.equal(
    reflection.dailyQuestionProblem("Which obligation and opportunity could share one place?"),
    null,
  );
  assert.equal(
    reflection.dailyQuestionProblem("How does your tenth house change this choice?"),
    "unsafe",
  );
  assert.equal(reflection.dailyQuestionProblem("How should you invest your money?"), "unsafe");
});
test("exactly one source-aligned question is selected and wellness variants stay local with stress precedence", () => {
  const input = plan(),
    ctx = context();
  assert.equal(
    reflection.resolveDailyReflection(input, "Unrelated domain question?", ctx).question,
    input.frame.reflection.standard,
  );
  ctx.granted = new Set(["WEL-03", "WEL-01"]);
  ctx.wellness = { stress: 4, sleep: 1 };
  let result = reflection.resolveDailyReflection(input, null, ctx);
  assert.equal(result.variant, "high_stress");
  assert.equal(result.localSource, "WEL-03");
  assert.equal(result.question, input.frame.reflection.highStress);
  ctx.granted = new Set(["WEL-01"]);
  result = reflection.resolveDailyReflection(input, null, ctx);
  assert.equal(result.variant, "low_sleep");
  assert.equal(result.localSource, "WEL-01");
  ctx.granted = new Set();
  result = reflection.resolveDailyReflection(input, null, ctx);
  assert.equal(result.variant, "standard");
  assert.equal(result.localSource, null);
});
test("invalid or missing variants retain the standard; missing frames use a single relationship, primary or quiet fallback", () => {
  const input = plan(),
    ctx = context();
  ctx.granted = new Set(["WEL-03"]);
  ctx.wellness = { stress: 5, sleep: null };
  input.frame.reflection.highStress = "Which commitment matters and how will you begin?";
  assert.equal(reflection.resolveDailyReflection(input, null, ctx).variant, "standard");
  input.frame = null;
  input.status = "no_frame";
  assert.equal(
    reflection.resolveDailyReflection(input, "What happened in another domain?", ctx).question,
    "Which ordinary choice brings these competing demands into focus?",
  );
  input.theme.factId = "I1";
  input.theme.relationship = null;
  assert.equal(
    reflection.resolveDailyReflection(input, "Which point needs clearer wording?", ctx).variant,
    "legacy",
  );
  assert.equal(
    reflection.resolveDailyReflection(input, "Two questions? Another?", ctx).question,
    "Where could this theme show up in one ordinary choice?",
  );
  input.theme = null;
  input.status = "no_primary";
  assert.equal(
    reflection.resolveDailyReflection(input, null, ctx).question,
    "What has your attention today?",
  );
});
test("a missing or invalid high-stress variant retains standard even when low sleep also qualifies", () => {
  const input = plan(),
    ctx = context();
  ctx.granted = new Set(["WEL-03", "WEL-01"]);
  ctx.wellness = { stress: 5, sleep: 1 };
  delete input.frame.reflection.highStress;
  assert.equal(reflection.resolveDailyReflection(input, null, ctx).variant, "standard");
  input.frame.reflection.highStress = "What matters and how will you act?";
  assert.equal(reflection.resolveDailyReflection(input, null, ctx).variant, "standard");
});
