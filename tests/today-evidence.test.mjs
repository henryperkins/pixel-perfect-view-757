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

test("synthesis has a distinct published category and saved text is presented without its instruction prefix", () => {
  assert.equal(view.todayFactLabel("S1"), "Published synthesis");
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
  assert.ok(html.includes(ruleKey));
  assert.match(
    html,
    /class="mt-3 whitespace-pre-line[^"]*">More scope can call for a clearer structure\.<\/p>/,
  );
});

test("saved synthesis renders its relationship, version and four local parent links", () => {
  const html = render();
  assert.match(html, /Published synthesis/);
  assert.match(html, /Tension/);
  assert.match(html, /saved-content-1/);
  assert.match(html, /saved-rule/);
  assert.match(html, /aria-label="Published synthesis parents"/);
  const parentList = html.match(
    /<ul[^>]*aria-label="Published synthesis parents"[^>]*>(.*?)<\/ul>/s,
  )?.[1];
  assert.ok(parentList);
  for (const id of parents) {
    assert.ok(parentList.includes(`href="#${view.todayFactId("archived/reading-1", id)}"`));
    assert.ok(html.includes(`id="${view.todayFactId("archived/reading-1", id)}"`));
  }
  assert.match(html, /Original supplied text/);
  assert.match(html, /Supplied · not cited in model paragraphs/);
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
