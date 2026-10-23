import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, PatternChartDetails, TodayFeedback, TodayGuidance, composeDailyGuidance, plain, view;
let ChapterNarrativeState, EphemerisNotice;
before(async () => {
  h = await createRecordsHarness();
  ({ PatternChartDetails } = await h.vite.ssrLoadModule(
    "/src/components/pattern/PatternChartDetails.tsx",
  ));
  plain = await h.vite.ssrLoadModule("/src/lib/plain-engine.ts");
  ({ TodayFeedback } = await h.vite.ssrLoadModule("/src/components/pattern/TodayFeedback.tsx"));
  ({ TodayGuidance } = await h.vite.ssrLoadModule("/src/components/pattern/TodayGuidance.tsx"));
  ({ composeDailyGuidance } = await h.vite.ssrLoadModule("/src/lib/daily-guidance.ts"));
  view = await h.vite.ssrLoadModule("/src/components/pattern/today-view.ts");
  ({ ChapterNarrativeState } = await h.vite.ssrLoadModule(
    "/src/components/pattern/ChapterNarrativeState.tsx",
  ));
  ({ EphemerisNotice } = await h.vite.ssrLoadModule("/src/components/pattern/EphemerisNotice.tsx"));
});

test("a saved source with legacy or malformed details has a safe reader label", () => {
  for (const detail of [null, [], "legacy", 7]) {
    assert.equal(
      view.todaySourceLabel({ label: "Published template reference · P1", detail }),
      "Phase wording 1",
    );
  }
  assert.equal(
    view.todaySourceLabel({ label: "Interpretation hard:mercury:*", detail: null }),
    "Published interpretation",
  );
});

test("suggestion disclosure preserves its meaning and limits without internal source keys", () => {
  const guidance = composeDailyGuidance({
    day: "2026-10-21",
    now: new Date("2026-10-21T12:00:00Z"),
    timezone: "UTC",
    granted: new Set(),
    primary: {
      cycle_key: "private-cycle-key",
      label: "Saturn square Sun",
      phase: "approaching",
      orb: 1,
      exact_at: null,
    },
    source: {
      key: "internal-interpretation-key",
      releaseVersion: "saved-v1",
      themes: ["structure"],
    },
    checkIn: null,
    preferredDomain: null,
  });
  const html = renderToStaticMarkup(createElement(TodayGuidance, { guidance, timezone: "UTC" }));
  assert.match(html, /Try this today/);
  assert.match(html, /Why this suggestion/);
  assert.match(html, /does not change the chart/);
  assert.match(html, /saved-v1/);
  assert.doesNotMatch(html, /private-cycle-key|internal-interpretation-key/);
});

test("consented earlier feedback stays available without adding an idle instruction", () => {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  const client = new QueryClient();
  const render = (previous) =>
    renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          RouterContextProvider,
          { router },
          createElement(TodayFeedback, {
            readingId: "saved-reading",
            accountId: "member",
            saved: null,
            readingRevision: 1,
            previous,
          }),
        ),
      ),
    );
  assert.match(
    render({ score: 1, day: "2026-10-12" }),
    /Earlier response to this interpretation: Yes/,
  );
  assert.doesNotMatch(render(null), /Earlier response|No response saved/);
});
after(async () => h?.close());

test("source and time labels stay plain without inventing an unknown source", () => {
  assert.equal(plain.plainEngineLabel("swiss-ephemeris@2.10"), "Swiss Ephemeris");
  assert.equal(plain.plainEngineLabel("kepler-approx@1.0.0"), "Approximate fallback");
  assert.equal(plain.plainEngineLabel(null), "Unrecorded");
  assert.equal(plain.plainEngineLabel("unrecognized-provider"), "Recorded calculation");
  assert.equal(plain.plainAccuracy("hour"), "Within about an hour");
  assert.equal(plain.plainAccuracy("unknown"), "Unknown · noon assumed");
});

test("house suppression does not imply that angle descriptions are also suppressed", () => {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  const render = (angleClaimsSuppressed) =>
    renderToStaticMarkup(
      createElement(
        RouterContextProvider,
        { router },
        createElement(PatternChartDetails, {
          data: {
            rising: null,
            placements: [],
            allAspects: [],
            snapshot: { birth: null, engine: "swiss-ephemeris@fixture" },
            engine: "swiss-ephemeris@fixture",
            ephemeris: { precision: "high" },
            houseSystem: "Placidus",
            uncertainty: {
              accuracy: angleClaimsSuppressed ? "unknown" : "hour",
              housesReliable: false,
              angleClaimsSuppressed,
              ascendantSpreadDeg: 30,
              moonSpreadDeg: 1,
            },
          },
        }),
      ),
    );
  const approximate = render(false);
  assert.match(approximate, /House descriptions are left out/);
  assert.match(approximate, /Angle descriptions remain available/);
  assert.doesNotMatch(approximate, /Angle descriptions are also left out/);
  assert.match(render(true), /Angle descriptions are also left out/);
  assert.doesNotMatch(approximate, /Fingerprint|Contract|<pre/);
});

function chartDetails(aspects) {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  return renderToStaticMarkup(
    createElement(
      RouterContextProvider,
      { router },
      createElement(PatternChartDetails, {
        data: {
          rising: null,
          placements: [],
          allAspects: aspects,
          snapshot: { birth: null, engine: "swiss-ephemeris@fixture" },
          engine: "swiss-ephemeris@fixture",
          ephemeris: { precision: "high" },
          houseSystem: "Placidus",
          uncertainty: {
            accuracy: "hour",
            housesReliable: false,
            angleClaimsSuppressed: false,
            ascendantSpreadDeg: 30,
            moonSpreadDeg: 1,
          },
        },
      }),
    ),
  );
}

test("chart connection groups use h3 headings without skipping a level", () => {
  const html = chartDetails([{ a: "sun", b: "moon", aspect: "square", orb: 1.2 }]);
  const group = html.match(/<div class="pattern-connection-group">(.*?)<\/div>/s)?.[1];
  assert.ok(group);
  assert.match(group, /<h3>Friction/);
  assert.doesNotMatch(html, /<h4/);
});

test("the locked chapter upsell renders as an h4", () => {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  const html = renderToStaticMarkup(
    createElement(
      RouterContextProvider,
      { router },
      createElement(ChapterNarrativeState, {
        state: {
          kind: "ready",
          locked: true,
          staleError: false,
          narrative: {
            available: true,
            cacheKey: "chart-key",
            narrative: "A readable paragraph.",
            paragraphs: ["A readable paragraph."],
            facts: [],
            evidenceAvailable: false,
            model: null,
            citations: [],
            locked: false,
            accessUntil: null,
          },
        },
        feature: { feature_key: "sun_in_aries", title: "Sun in Aries" },
        narrativeRef: null,
        isFetching: false,
        onRetry() {},
        onRefreshChapters() {},
      }),
    ),
  );
  assert.match(
    html,
    /<h4 class="font-serif text-xl font-medium">Continue this chapter with Pattern Plus<\/h4>/,
  );
});

test("degraded reasons become plain copy without transport detail", () => {
  assert.equal(
    plain.plainDegradedReason(null),
    "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.",
  );
  assert.equal(
    plain.plainDegradedReason("Swiss Ephemeris service returned HTTP 503."),
    "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.",
  );
  assert.equal(
    plain.plainDegradedReason("Swiss Ephemeris service unreachable: fetch failed"),
    "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.",
  );
  assert.equal(
    plain.plainDegradedReason("Swiss Ephemeris response omitted Chiron."),
    "The Swiss Ephemeris service returned incomplete positions, so this chart uses the in-app approximate engine.",
  );
  assert.equal(
    plain.plainDegradedReason("This chart was computed with the in-app approximate engine."),
    "This chart was computed with the in-app approximate engine.",
  );
});

test("the degraded notice never renders raw transport wording", () => {
  const html = renderToStaticMarkup(
    createElement(EphemerisNotice, {
      state: {
        engine: "in-app@fixture",
        precision: "approximate",
        degraded: true,
        degradedReason: "Swiss Ephemeris service unreachable: fetch failed with HTTP 503",
      },
    }),
  );
  assert.match(html, /Swiss Ephemeris service was unavailable/);
  assert.doesNotMatch(html, /HTTP|fetch|unreachable/i);
});
