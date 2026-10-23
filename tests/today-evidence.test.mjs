import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { resolve } from "node:path";

let vite, view, TodayEvidence;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    resolve: { alias: { "@": resolve("src") } },
    server: { middlewareMode: true, hmr: false, ws: false },
    logLevel: "error",
  });
  view = await vite.ssrLoadModule("/src/components/pattern/today-view.ts");
  ({ TodayEvidence } = await vite.ssrLoadModule("/src/components/pattern/TodayEvidence.tsx"));
});
after(async () => vite?.close());

const parents = ["C1", "I1", "C2", "I2"];
const synthesis = {
  id: "S1",
  statement:
    "Published tension synthesis saved-rule (parents: C1, I1, C2, I2): More scope can call for a clearer structure.",
  kind: "synthesis",
  dependsOn: parents,
  sourceKey: "saved-rule",
  releaseVersion: "saved-content-1",
};
const facts = [
  synthesis,
  ...parents.map((id) => ({ id, statement: `Saved ${id} reference.` })),
  { id: "I3", statement: "Uncited supporting meaning." },
];
const props = () => ({
  readingId: "archived/reading-1",
  cycles: [],
  provenance: [],
  timezone: "UTC",
  paragraphCount: 2,
  paragraphLinksAvailable: true,
  language: {
    mode: "model",
    model: "synthetic/model",
    dropped: 0,
    reason: null,
    facts,
    citations: [{ paragraph: 1, facts: ["S1", ...parents] }],
    interpretationPlan: {
      version: "daily-synthesis-1",
      interpretations: [],
      pairStatus: "selected",
      pairRuleKey: "saved-rule",
      releaseVersion: "saved-content-1",
      synthesis: {
        ruleKey: "saved-rule",
        relationship: "tension",
        dependsOn: parents,
        releaseVersion: "saved-content-1",
      },
    },
  },
});
const render = (value = props()) => renderToStaticMarkup(createElement(TodayEvidence, value));

test("saved source illustrations explain their possible status and link to the exact saved source and paragraph", () => {
  const value = props();
  value.language.dailyWriting = {
    status: "saved",
    evidence: {
      releaseVersion: "saved-content-1",
      plan: {
        theme: { factId: "S1" },
        scenes: [
          {
            id: "SC1",
            situation:
              "If a calendar is full, one commitment can be compared with available capacity.",
            focus: "The comparison concerns responsibility and room for another option.",
          },
        ],
      },
      sceneUse: [{ id: "SC1", paragraph: 2 }],
    },
  };
  const html = render(value);
  assert.match(html, /Published illustrations/);
  assert.match(html, /possible examples/);
  assert.match(html, /Used by paragraph 2/);
  assert.ok(html.includes(`href="#${view.todayParagraphId(value.readingId, 2)}"`));
  assert.ok(html.includes(`href="#${view.todayFactId(value.readingId, "S1")}"`));
  assert.ok(!html.includes("daily-writing-quality") && !html.includes("scene_unverified"));
  value.language.dailyWriting.evidence.sceneUse = [];
  assert.match(render(value), /Not used in this saved wording/);
});

test("synthesis has a distinct published category and saved text is presented without its instruction prefix", () => {
  assert.equal(view.todayFactLabel("S1"), "Combined interpretation");
  assert.equal(view.todayFactCategory("S1"), "Published synthesis");
  assert.equal(view.todayFactCategory("C1"), "Calculated cycle");
  assert.equal(
    view.describeTodayFact(synthesis).text,
    "More scope can call for a clearer structure.",
  );
  assert.equal(
    view.describeTodayFact({
      id: "I2",
      statement: "Published interpretation trine:jupiter:mars: Effort meets little friction.",
    }).text,
    "Effort meets little friction.",
  );
});

test("synthesis descriptions support published rule keys containing spaces", () => {
  const p = structuredClone(props());
  const ruleKey = "reviewed daily tension";
  p.language.facts[0].sourceKey = ruleKey;
  p.language.facts[0].statement = synthesis.statement.replace("saved-rule", ruleKey);
  p.language.interpretationPlan.pairRuleKey = ruleKey;
  p.language.interpretationPlan.synthesis.ruleKey = ruleKey;
  assert.equal(
    view.describeTodayFact(p.language.facts[0]).text,
    "More scope can call for a clearer structure.",
  );
  const html = render(p);
  assert.ok(!html.includes(ruleKey));
  assert.match(html, /saved-content-1/);
  assert.match(
    html,
    /class="mt-3 whitespace-pre-line[^"]*">More scope can call for a clearer structure\.<\/p>/,
  );
});

test("saved synthesis renders its relationship, version and four local parent links", () => {
  const html = render();
  assert.match(html, /Combined interpretation/);
  assert.match(html, /Tension/);
  assert.match(html, /saved-content-1/);
  assert.doesNotMatch(html, /saved-rule/);
  assert.match(html, /aria-label="Published synthesis parents"/);
  const parentList = html.match(
    /<ul[^>]*aria-label="Published synthesis parents"[^>]*>(.*?)<\/ul>/s,
  )?.[1];
  assert.ok(parentList);
  for (const id of parents) {
    assert.ok(parentList.includes(`href="#${view.todayFactId("archived/reading-1", id)}"`));
    assert.ok(html.includes(`id="${view.todayFactId("archived/reading-1", id)}"`));
  }
  assert.doesNotMatch(html, /Original supplied text/);
  assert.match(html, /Supplied, not linked from a paragraph/);
  assert.match(html, /Linked from a paragraph/);
  assert.match(html, /does not prove every sentence/);
  assert.ok(!parentList.includes("I3"));
});

test("historical metadata and missing parents never fabricate synthesis links or new editorial identity", () => {
  for (const mutate of [
    (p) => {
      p.language.facts = p.language.facts.map((f) => ({ id: f.id, statement: f.statement }));
      p.language.interpretationPlan = null;
    },
    (p) => {
      p.language.facts = p.language.facts.filter((f) => f.id !== "I2");
    },
    (p) => {
      p.language.interpretationPlan.synthesis.releaseVersion = "future-content";
    },
  ]) {
    const p = structuredClone(props());
    mutate(p);
    const html = render(p);
    assert.ok(!html.includes('aria-label="Published synthesis parents"'));
    assert.ok(!html.includes("future-content"));
    assert.ok(html.includes("More scope can call for a clearer structure."));
  }
});

test("archived paragraphs without saved boundaries keep fact links but no invented paragraph target", () => {
  const p = props();
  p.paragraphLinksAvailable = false;
  const html = render(p);
  assert.ok(!html.includes(`href="#${view.todayParagraphId(p.readingId, 1)}"`));
  assert.ok(html.includes(`href="#${view.todayFactId(p.readingId, "S1")}"`));
});

test("source trail names saved references without raw rules, registry IDs or duplicate rows", () => {
  const p = props();
  p.provenance = [
    {
      lane: "content",
      source_id: "AST-05",
      label: "Interpretation hard:saturn:*",
      detail: { bundle: "saved-content-1" },
    },
    {
      lane: "content",
      source_id: "AST-05",
      label: "Published reference cited by language layer · S1",
      detail: { factId: "S1" },
    },
    {
      lane: "content",
      source_id: "AST-20",
      label: "Published natal lens reference · N1",
      detail: { factId: "N1" },
    },
    {
      lane: "content",
      source_id: "AST-07",
      label: "Published natal lens reference · N1",
      detail: { factId: "N1" },
    },
  ];
  const html = render(p);
  assert.match(html, /Published interpretation/);
  assert.match(html, /Combined interpretation/);
  assert.equal((html.match(/Published chart interpretation/g) ?? []).length, 1);
  assert.doesNotMatch(
    html,
    /hard:saturn:\*|AST-05|AST-07| · N1|Published reference cited by language layer/,
  );
});

test("todayHeadline formats raw lowercase contact labels in sentence case and preserves authored headlines", () => {
  assert.equal(view.todayHeadline("mars square natal mercury"), "Mars square natal Mercury");
  assert.equal(
    view.todayHeadline("node conjunction natal ascendant"),
    "North Node conjunction natal Ascendant",
  );
  assert.equal(
    view.todayHeadline("Leave room for an unhurried answer"),
    "Leave room for an unhurried answer",
  );
  assert.equal(view.todayHeadline("A quiet day in the pattern"), "A quiet day in the pattern");
});

test("saved birth-time accuracy uses plain words instead of a bare hour label", () => {
  const described = view.describeTodayFact({
    id: "U1",
    statement: 'recorded birth-time accuracy is "hour" (about plus or minus 60 minutes)',
  });
  assert.deepEqual(described.values, [
    { label: "Recorded birth-time accuracy", value: "Within about an hour" },
    { label: "Time uncertainty", value: "Approximately ±60 minutes" },
  ]);
  const p = props();
  p.language.facts = [
    {
      id: "U1",
      statement: 'recorded birth-time accuracy is "hour" (about plus or minus 60 minutes)',
    },
  ];
  p.language.citations = [];
  const html = render(p);
  assert.match(html, /Within about an hour/);
  assert.doesNotMatch(html, />\s*Hour\s*</);
});

const natalLens = (overrides = {}) => ({
  usedParagraphs: [1],
  plan: {
    releaseVersion: "saved-natal-1",
    lens: {
      dependsOn: ["C1", "I1"],
      evidence: [{ kind: "sign", body: "moon", sign: "Cancer", marginsDeg: [1.2, 1.4, 1.6] }],
      screen: {
        accuracy: "hour",
        sampleEngines: ["swiss-ephemeris@2.10", "swiss-ephemeris@2.10", "swiss-ephemeris@2.10"],
        sampleOffsetsMinutes: [-60, 0, 60],
      },
      ...overrides,
    },
  },
});

test("the natal lens accuracy label is plain and keeps its minutes", () => {
  const p = props();
  p.language.facts = [
    { id: "N1", statement: "Published natal lens, an interpretive possibility: A saved lens." },
    { id: "C1", statement: "Saved C1 reference." },
    { id: "I1", statement: "Saved I1 reference." },
  ];
  p.language.citations = [];
  p.language.natalLens = natalLens();
  const html = render(p);
  assert.match(html, /Within about an hour · ±60 minutes/);
  assert.doesNotMatch(html, />\s*Hour\s*</);
});

test("a natal lens parent missing from the saved facts is not linked", () => {
  const p = props();
  p.language.facts = [
    { id: "N1", statement: "Published natal lens, an interpretive possibility: A saved lens." },
    { id: "C1", statement: "Saved C1 reference." },
  ];
  p.language.citations = [];
  p.language.natalLens = natalLens();
  const html = render(p);
  assert.ok(html.includes(`href="#${view.todayFactId(p.readingId, "C1")}"`));
  assert.ok(!html.includes(`href="#${view.todayFactId(p.readingId, "I1")}"`));
  assert.match(html, /Some parent sources were not retained with this reading\./);
});

test("a published chapter parent missing from the saved facts is not linked", () => {
  const p = props();
  p.language.facts = [
    { id: "P2", statement: "Published transit chapter: A saved chapter." },
    { id: "C1", statement: "Saved C1 reference." },
    { id: "I1", statement: "Saved I1 reference." },
  ];
  p.language.citations = [];
  p.language.transitStory = {
    plan: { status: "selected", releaseVersion: "saved-story-1", evidence: { timingOverlay: {} } },
  };
  const html = render(p);
  const block = html.match(
    /<div class="mt-3 space-y-2"><p class="text-sm">Published chapter · saved-story-1<\/p>(.*?)<\/div>/s,
  )?.[1];
  assert.ok(block, "the published chapter block renders");
  assert.ok(block.includes(`href="#${view.todayFactId(p.readingId, "C1")}"`));
  assert.ok(block.includes(`href="#${view.todayFactId(p.readingId, "I1")}"`));
  assert.ok(!block.includes(`href="#${view.todayFactId(p.readingId, "A1")}"`));
  assert.match(block, /Some parent sources were not retained with this reading\./);
});
