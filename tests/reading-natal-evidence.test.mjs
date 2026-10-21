import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedNatalReading, natalReadingResponse } from "./helpers/natal-fixtures.mjs";
let h, view, TodayEvidence, today;
before(async () => {
  h = await createRecordsHarness();
  await seedNatalReading(h);
  h.setGateway(natalReadingResponse);
  today = await h.app.getToday(h.records(), h.userA, "UTC");
  view = await h.vite.ssrLoadModule("/src/components/pattern/today-view.ts");
  ({ TodayEvidence } = await h.vite.ssrLoadModule("/src/components/pattern/TodayEvidence.tsx"));
});
after(async () => h?.close());
function render(language = today.language) {
  return renderToStaticMarkup(
    createElement(TodayEvidence, {
      readingId: "archived-natal",
      cycles: [],
      provenance: [],
      language,
      timezone: "UTC",
      paragraphCount: 2,
      paragraphLinksAvailable: true,
    }),
  );
}
test("daily_natal_evidence_labels_interpretation_not_measurement", () => {
  assert.equal(view.todayFactLabel("N1"), "Published chart interpretation");
  assert.equal(view.todayFactCategory("N1"), "Interpretive reference");
  const html = render();
  assert.match(html, /Checked at the recorded time and both uncertainty boundaries/);
  assert.match(html, /recognize or reject/);
  assert.match(html, /Capricorn/);
  assert.match(html, /Swiss Ephemeris/);
  assert.match(html, /Birth-time accuracy/);
  assert.match(html, /do not confirm the birth time or every moment between them/);
  assert.doesNotMatch(html, /Saved sample geometry|<pre/);
  assert.ok(!html.includes("verified temperament"));
  for (const id of ["C1", "I1"])
    assert.ok(html.includes(`href="#${view.todayFactId("archived-natal", id)}"`));
});
test("archived_origin_is_not_recomputed_and_legacy_absence_adds_no_origin", () => {
  const html = render();
  assert.ok(html.includes(today.language.natalLens.plan.releaseVersion));
  assert.ok(!html.includes(today.language.natalLens.plan.lens.ruleKey));
  assert.ok(
    !render({
      ...today.language,
      natalLens: null,
      facts: today.language.facts.filter((f) => f.id !== "N1"),
    }).includes("Natal origin"),
  );
});
test("natal_chapter_n1_label_is_unchanged", async () => {
  const { PatternChapterEvidence } = await h.vite.ssrLoadModule(
    "/src/components/pattern/PatternChapterEvidence.tsx",
  );
  assert.equal(typeof PatternChapterEvidence, "function");
  const html = renderToStaticMarkup(
    createElement(PatternChapterEvidence, {
      feature: {
        feature_key: "moon_placement",
        family: "luminary",
        title: "Moon in Capricorn",
        strength: 1,
        payload: { sign: "Capricorn" },
      },
      facts: [
        {
          id: "N1",
          statement:
            'detected natal structure "Moon in Capricorn" of family luminary (key moon_placement)',
        },
      ],
      citations: [],
      evidenceAvailable: true,
      paragraphCount: 0,
      model: null,
    }),
  );
  assert.ok(html.includes("Chart structure"));
  assert.ok(!html.includes("Published natal lens"));
});
