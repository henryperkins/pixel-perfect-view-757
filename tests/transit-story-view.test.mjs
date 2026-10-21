import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { analyticEpisode } from "./fixtures/transit-episodes/analytic.mjs";
let h, m, t, sequence, notice, v, TimingWindow;
before(async () => {
  h = await createRecordsHarness();
  m = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.ts");
  t = await h.vite.ssrLoadModule("/src/components/pattern/timing.ts");
  sequence = (await h.vite.ssrLoadModule("/src/components/pattern/TransitSequence.tsx"))
    .TransitSequence;
  notice = (await h.vite.ssrLoadModule("/src/components/pattern/EphemerisNotice.tsx"))
    .EphemerisNotice;
  v = await h.vite.ssrLoadModule("/src/components/pattern/today-view.ts");
  ({ TimingWindow } = await h.vite.ssrLoadModule("/src/components/pattern/TimingWindow.tsx"));
});
after(async () => h?.close());
function calculate(opts) {
  const f = analyticEpisode(opts);
  f.scan.coverage.from = f.scan.samples[0].legs[0].start.at;
  f.scan.coverage.to = f.scan.samples[2].legs.at(-1).end.at;
  return { f, c: m.resolveDailyTransitCalculation(f.scan, f.anchor, f.primary, f.day, f.timezone) };
}
test("episode_timeline_preserves_out_of_orb_gaps", () => {
  const { c } = calculate({});
  const html = renderToStaticMarkup(createElement(sequence, { calculation: c }));
  assert.equal((html.match(/data-contact-window=/g) || []).length, 3);
  assert.match(html, /Contact 2 of 3/);
  assert.match(html, /calculated contacts,\s*not a record of events in your life/);
  assert.match(html, /Timing calculation source/);
  assert.match(html, /calculation\s*tolerance, not personal timing accuracy/);
});
test("uncertain_contacts_render_ranges_without_exact_today", () => {
  const { c, f } = calculate({ shifts: [-0.6, 0, 0.6] });
  assert.equal(t.daysToExact(f.primary, f.day, "UTC", c), null);
  assert.equal(t.windowPhase(f.primary, f.day, "UTC", c), "uncertain");
  const html = renderToStaticMarkup(createElement(sequence, { calculation: c }));
  assert.match(html, /Sampled range/);
  assert.ok(!html.includes("Exact today"));
});
test("between_has_no_fake_ordinal", () => {
  const { c, f } = calculate({ amplitude: 2, station: true });
  assert.equal(t.windowPhase(f.primary, f.day, "UTC", c), "between");
  const html = renderToStaticMarkup(createElement(sequence, { calculation: c }));
  assert.match(html, /Between calculated contacts/);
  assert.doesNotMatch(html, /Contact \d of/);
});
test("qualified_primary_timing_leaves_other_windows_on_their_saved_calendar", () => {
  const { c, f } = calculate({ shifts: [-0.6, 0, 0.6] });
  const other = {
    ...f.primary,
    cycle_key: "unrelated-window",
    days_to_exact: null,
    exact_at: "2026-10-11T01:00:00Z",
  };
  assert.equal(t.windowPhase(other, "2026-10-11", "America/Los_Angeles", c), "fading");
  assert.equal(t.daysToExact(other, "2026-10-11", "America/Los_Angeles", c), -1);
  assert.equal(
    t.cycleTimingPhrase(other, "2026-10-11", "America/Los_Angeles", c, true),
    "Exact the day before",
  );
});
test("closing_a_visited_window_retains_its_saved_transit_sequence", () => {
  const { c, f } = calculate({});
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/timing"] }),
  });
  const renderWindow = (visited) =>
    renderToStaticMarkup(
      createElement(
        RouterContextProvider,
        { router },
        createElement(TimingWindow, {
          cycle: f.primary,
          day: f.day,
          timezone: f.timezone,
          calculation: c,
          open: false,
          visited,
          onToggle() {},
          onBrowse() {},
        }),
      ),
    );
  const unopened = renderWindow(false);
  assert.doesNotMatch(unopened, /aria-label="Calculated contact sequence"/);
  const closed = renderWindow(true);
  assert.match(closed, /aria-expanded="false"/);
  assert.match(closed, /inert=""/);
  assert.match(closed, /aria-hidden="true"/);
  assert.match(closed, /aria-label="Calculated contact sequence"/);
  assert.equal((closed.match(/data-contact-window=/g) || []).length, 3);
});
test("source_notice_distinguishes_natal_and_transit_and_story_atoms_are_distinct", () => {
  const html = renderToStaticMarkup(
    createElement(notice, {
      state: {
        engine: "swiss@test",
        precision: "high",
        degraded: false,
        degradedReason: null,
        transitEngine: "kepler-approx@1.0.0",
        eventTiming: {
          engine: "Swiss test",
          sourceId: "synthetic",
          solverVersion: "transit-episode-1",
        },
      },
    }),
  );
  assert.match(html, /Natal positions/);
  assert.match(html, /Current transit geometry.*approximate/);
  assert.match(html, /Primary event timing/);
  assert.equal(v.todayFactLabel("A1"), "Calculated contact sequence");
  assert.equal(v.todayFactLabel("P2"), "Published contact interpretation");
});
test("qualified primary geometry notice distinguishes remaining approximate contacts", () => {
  const html = renderToStaticMarkup(
    createElement(notice, {
      state: {
        engine: "swiss@test",
        precision: "high",
        degraded: false,
        degradedReason: null,
        transitEngine: "kepler-approx@1.0.0",
        primaryTransitGeometry: {
          engine: "swiss@qualified",
          cycleKey: "saturn_square_sun",
          referenceAt: "2026-10-18T12:00:00.000Z",
          sourceId: "synthetic",
        },
        eventTiming: {
          engine: "swiss@qualified",
          sourceId: "synthetic",
          solverVersion: "transit-episode-1",
        },
      },
    }),
  );
  assert.match(html, /main contact’s angle and orb use that qualified timing/);
  assert.match(html, /Other transit geometry and orbs are approximate/);
  assert.doesNotMatch(html, /Current transit geometry and orb are approximate/);
});

test("uncertain window values do not promote the central sample to a single closest day", () => {
  const { c, f } = calculate({ shifts: [-0.6, 0, 0.6] });
  assert.equal(c.timingOverlay.qualifiedExactDay, null);
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  const html = renderToStaticMarkup(
    createElement(
      RouterContextProvider,
      { router },
      createElement(TimingWindow, {
        cycle: f.primary,
        day: f.day,
        timezone: f.timezone,
        calculation: c,
        open: true,
        visited: true,
        onToggle() {},
        onBrowse() {},
      }),
    ),
  );
  assert.match(html, /Sampled range/);
  assert.doesNotMatch(html, /<dt>Closest pass<\/dt>/);
  assert.doesNotMatch(html, /Exact today/);
});
