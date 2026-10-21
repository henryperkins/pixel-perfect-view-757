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
});

test("a saved source with legacy or malformed details has a safe reader label", () => {
  for (const detail of [null, [], "legacy", 7]) {
    assert.equal(
      view.todaySourceLabel({ label: "Published template reference · P1", detail }),
      "Phase wording",
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
