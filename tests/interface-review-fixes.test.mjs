import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { resolve } from "node:path";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";

let vite, Journal, Assistants, Privacy, MemberDraftProvider, TodayEvidence, ChapterEvidence;
let Today, Timing, TimeTravel, TodayTiming;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    logLevel: "error",
    resolve: { alias: { "@": resolve("src") } },
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "review-fixture-assistant-session",
        enforce: "pre",
        resolveId(id) {
          if (/\/useAssistantSession(?:\.ts)?$/.test(id)) return "\0review-assistant-session";
        },
        load(id) {
          if (id === "\0review-assistant-session")
            return 'export const useAssistantSession = () => ({ session: { user: { id: "provider-member" }, access_token: "synthetic" }, loading: false, error: "" });';
        },
      },
    ],
  });
  ({ Route: Journal } = await vite.ssrLoadModule("/src/routes/_authenticated/journal.tsx"));
  ({ Route: Assistants } = await vite.ssrLoadModule("/src/routes/_authenticated/assistants.tsx"));
  ({ Route: Privacy } = await vite.ssrLoadModule("/src/routes/_authenticated/privacy.tsx"));
  ({ MemberDraftProvider } = await vite.ssrLoadModule(
    "/src/components/pattern/MemberDraftProvider.tsx",
  ));
  ({ TodayEvidence } = await vite.ssrLoadModule("/src/components/pattern/TodayEvidence.tsx"));
  ({ PatternChapterEvidence: ChapterEvidence } = await vite.ssrLoadModule(
    "/src/components/pattern/PatternChapterEvidence.tsx",
  ));
  ({ Route: Today } = await vite.ssrLoadModule("/src/routes/index.tsx"));
  ({ Route: Timing } = await vite.ssrLoadModule("/src/routes/_authenticated/timing.tsx"));
  ({ Route: TimeTravel } = await vite.ssrLoadModule("/src/routes/_authenticated/time-travel.tsx"));
  ({ TodayTiming } = await vite.ssrLoadModule("/src/components/pattern/TodayTiming.tsx"));
  Today.useLoaderData = () => ({ visitor: false });
  Journal.useSearch = () => ({});
  Journal.useNavigate = () => () => {};
  Assistants.useRouteContext = () => ({ user: { userId: "member" } });
});
after(async () => vite?.close());

function renderPage(Route, queries = []) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  client.setQueryData(["session"], { session: { userId: "member", isAdmin: false } });
  for (const [key, data] of queries) client.setQueryData(key, data);
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  try {
    return renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          RouterContextProvider,
          { router },
          createElement(MemberDraftProvider, null, createElement(Route.options.component)),
        ),
      ),
    );
  } finally {
    client.clear();
  }
}
const text = (html) => html.replace(/<[^>]+>/g, "");
const precisionState = {
  engine: "swiss-ephemeris@2.10",
  precision: "high",
  degraded: false,
  degradedReason: null,
  transitEngine: "kepler-approx@1.0.0",
};
function dailyData(ephemeris = precisionState) {
  return {
    needsOnboarding: false,
    day: new Date().toISOString().slice(0, 10),
    timezone: "UTC",
    cycles: [],
    ephemeris,
    uncertainty: { accuracy: "exact", housesReliable: true, angleClaimsSuppressed: false },
    reading: {
      id: "saved",
      headline: "A saved reading",
      paragraphs: ["Saved wording."],
      prompt: "Your reflection?",
    },
    wellness: {
      mood: null,
      energy: null,
      sleep: null,
      stress: null,
      note: null,
      savedAt: null,
      retentionDays: 90,
    },
    localContext: { markedMoments: true },
    feedback: null,
    provenance: [],
  };
}
function dailyQueries(data) {
  return [
    [["today", "member"], data],
    [["cycles", "member", "current"], data],
    [["journal", "member"], { events: [], checkIns: [], feedback: [] }],
  ];
}

for (const [name, getRoute] of [
  ["Today", () => Today],
  ["Timing", () => Timing],
  ["Time travel", () => TimeTravel],
]) {
  test(`${name} keeps approximate transit precision visible when birth positions have high precision`, () => {
    const html = renderPage(getRoute(), dailyQueries(dailyData()));
    // Details must remain closed; their descendants do not establish an inline limitation.
    const visible = text(html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, ""));
    assert.match(visible, /transit (?:angles|geometry).*approximate/i);
    assert.doesNotMatch(visible, /natal positions.*approximate/i);
  });
}

test("a precise main contact is distinguished from the remaining approximate transit angles", () => {
  const state = {
    ...precisionState,
    primaryTransitGeometry: {
      engine: "swiss-ephemeris@2.10",
      sourceId: "saved-source",
      cycleKey: "saturn_square_sun",
      referenceAt: "2026-10-21T12:00:00Z",
    },
  };
  const html = renderPage(Today, dailyQueries(dailyData(state)));
  const visible = text(html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, ""));
  assert.match(visible, /main contact.*angle.*orb/i);
  assert.match(visible, /Other transit (?:angles|geometry).*approximate/i);
});

test("an empty reading journal has one action that still reaches the full journal", () => {
  const data = dailyData();
  const html = renderPage(Today, [
    ...dailyQueries(data),
    [["journal", "member", "reading-context", data.day, [], []], { enabled: true, entries: [] }],
  ]);
  const section = html.match(/<section[^>]*id="today-journal"[^>]*>(.*?)<\/section>/s)?.[1];
  assert.ok(section);
  assert.equal([...section.matchAll(/<a\b[^>]*href="\/journal"/g)].length, 1);
  assert.match(text(section), /No saved entries/);
});

test("a timing window retains one journal route after its duplicate action is removed", () => {
  const data = dailyData();
  data.cycles = [
    {
      cycle_key: "saturn_square_sun",
      transit_body: "saturn",
      natal_point: "sun",
      aspect: "square",
      phase: "approaching",
      orb: 1,
      importance: 0.8,
      domain: "identity",
      exact_at: null,
      ingress_at: null,
      egress_at: null,
    },
  ];
  const html = renderPage(Timing, dailyQueries(data));
  const window = html.match(
    /<article\b[^>]*class="timing-window [^"]*"[^>]*>(.*?)<\/article>/s,
  )?.[1];
  assert.ok(window);
  assert.equal([...window.matchAll(/<a\b[^>]*href="\/journal"/g)].length, 1);
  assert.match(window, /aria-controls="timing-panel-saturn_square_sun"/);
});

test("Today timing removes duplicate phase wording but keeps unknown closest-pass and phase states", () => {
  const cycle = {
    cycle_key: "saturn_square_sun",
    transit_body: "saturn",
    natal_point: "sun",
    aspect: "square",
    phase: "exact",
    orb: 0.1,
    importance: 0.8,
    domain: "identity",
    days_to_exact: 0,
    exact_at: null,
  };
  const render = (value) =>
    renderPage({
      options: {
        component: () =>
          createElement(TodayTiming, { cycles: [value], day: "2026-10-21", timezone: "UTC" }),
      },
    });
  const summary = (html) =>
    text(html.match(/<span class="today-window-context">(.*?)<\/span>/s)?.[1] ?? "");
  assert.equal((summary(render(cycle)).match(/Exact/g) ?? []).length, 1);
  const missingDate = summary(render({ ...cycle, phase: "approaching", days_to_exact: null }));
  assert.match(missingDate, /Building/);
  assert.match(missingDate, /No closest pass/);
  for (const [phase, label] of [
    ["separating", "Fading"],
    ["exact", "Exact"],
  ]) {
    const missing = summary(render({ ...cycle, phase, days_to_exact: null }));
    assert.ok(missing.includes(label));
    assert.match(missing, /No closest pass/);
  }
});
const entries = (html) =>
  [...html.matchAll(/<li[^>]*class="journal-entry"[^>]*>(.*?)<\/li>/gs)].map((m) => text(m[1]));
function journalRows(events, cycles = [], features = []) {
  return entries(
    renderPage(Journal, [
      [["journal", "member"], { events, checkIns: [], feedback: [] }],
      [["today", "member"], { needsOnboarding: false, day: "2026-10-21", cycles }],
      [["pattern", "member"], { needsOnboarding: false, features }],
    ]),
  );
}
const event = (id, cycle_key, feature_key = null) => ({
  id,
  cycle_key,
  feature_key,
  occurred_on: "2026-10-01",
  domain: "work",
  label: `Saved entry ${id}`,
  body: null,
  revision: 1,
});

test("historical journal windows remain identifiable when today's windows no longer match", () => {
  const rows = journalRows([
    event("a", "mars_square_mercury"),
    event("b", "venus_opposition_venus"),
    event("c", "legacy-window-17"),
  ]);
  assert.match(rows[0], /Mars.*Mercury/);
  assert.match(rows[1], /Venus.*Venus/);
  assert.match(rows[2], /legacy-window-17/);
});

test("removed journal chapters keep their saved identity alongside current chapter titles", () => {
  const rows = journalRows(
    [event("a", null, "distribution_fire"), event("b", null, "aspect_moon_square_saturn")],
    [],
    [{ feature_key: "aspect_moon_square_saturn", title: "Moon square Saturn" }],
  );
  assert.match(rows[0], /[Dd]istribution fire/);
  assert.match(rows[1], /Moon square Saturn/);
});

test("remembered approvals with duplicate or absent names expose distinct clients and actions", () => {
  const grants = [
    { clientId: "client-aaaa-same-suffix", clientName: "Unnamed assistant" },
    { clientId: "client-bbbb-same-suffix", clientName: "Unnamed assistant" },
  ];
  const html = renderPage(Assistants, [
    [["assistant-access", "member"], { enabled: true, link: { linkedAt: "saved" }, grants: [] }],
    [["remembered-assistant-grants", "member", "provider-member", "saved"], grants],
  ]);
  const section = html.match(
    /<section[^>]*aria-labelledby="remembered-approvals"[^>]*>(.*?)<\/section>/s,
  )?.[1];
  assert.ok(section);
  for (const grant of grants) assert.ok(text(section).includes(grant.clientId));
  const buttons = [...section.matchAll(/<button[^>]*>(.*?)<\/button>/gs)].map((m) => text(m[1]));
  assert.equal(buttons.length, 2);
  assert.ok(buttons[0].includes(grants[0].clientId));
  assert.ok(buttons[1].includes(grants[1].clientId));
  assert.notEqual(buttons[0], buttons[1]);
});

test("active assistants with the same name also have distinct revocation labels", () => {
  const grants = ["client-a", "client-b"].map((clientId) => ({
    clientId,
    clientName: "Shared name",
    scopes: ["today"],
    createdAt: "2026-10-01",
  }));
  const html = renderPage(Assistants, [
    [["assistant-access", "member"], { enabled: true, link: null, grants }],
  ]);
  const section = html.match(
    /<section[^>]*aria-labelledby="assistant-grants"[^>]*>(.*?)<\/section>/s,
  )?.[1];
  assert.ok(section);
  const buttons = [...section.matchAll(/<button[^>]*>(.*?)<\/button>/gs)].map((m) => text(m[1]));
  assert.ok(buttons[0].includes("client-a"));
  assert.ok(buttons[1].includes("client-b"));
});

test("wellness consent describes permitted uses to both readers and assistive technology", () => {
  const html = renderPage(Privacy, [
    [["bootstrap", "member"], { consents: [], profile: {}, hasChart: true }],
    [["journal", "member"], { events: [], checkIns: [], feedback: [] }],
  ]);
  for (const id of ["WEL-01", "WEL-03"]) {
    const usesId = `source-${id}-uses`;
    const uses = html.match(new RegExp(`<p[^>]*id="${usesId}"[^>]*>(.*?)</p>`, "s"))?.[1];
    assert.ok(uses, `${id} must disclose its permitted uses`);
    assert.match(text(uses), /fram(?:ing|ed)/i);
    assert.match(text(uses), /reflection questions/i);
    const button = [...html.matchAll(/<button\b[^>]*>/g)]
      .map((m) => m[0])
      .find((tag) => tag.includes(`source-${id}-label`));
    assert.ok(button);
    assert.match(button, new RegExp(`aria-describedby="[^"]*\\b${usesId}\\b`));
    assert.match(button, /aria-pressed="false"/);
    assert.doesNotMatch(uses, /reflection_prompt|external_language|personalisation/);
  }
});

function privacyHtml() {
  return renderPage(Privacy, [
    [["bootstrap", "member"], { consents: [], profile: {}, hasChart: true }],
    [["journal", "member"], { events: [], checkIns: [], feedback: [] }],
  ]);
}
function usesText(html, id) {
  const uses = html.match(new RegExp(`<p[^>]*id="source-${id}-uses"[^>]*>(.*?)</p>`, "s"))?.[1];
  assert.ok(uses, `${id} must disclose its uses`);
  return text(uses);
}

test("the location calculation purpose does not claim that current location changes the birth chart", () => {
  const html = privacyHtml();
  const uses = usesText(html, "DEV-02");
  assert.match(uses, /calculat/i);
  assert.doesNotMatch(uses, /your chart|birth chart|natal chart/i);
  assert.match(html, /Used only to calculate local daylight/);
});

test("timezone permission names the local day and does not claim reading framing", () => {
  const uses = usesText(privacyHtml(), "DEV-01");
  assert.match(uses, /local day/i);
  assert.doesNotMatch(uses, /framing readings/i);
  assert.doesNotMatch(uses, /timing windows/i);
});

test("location permission names daylight and does not claim reading framing", () => {
  const uses = usesText(privacyHtml(), "DEV-02");
  assert.match(uses, /daylight/i);
  assert.match(uses, /calculat/i);
  assert.doesNotMatch(uses, /framing readings/i);
});

test("check-ins and marked moments do not claim they choose reflection questions", () => {
  const html = privacyHtml();
  for (const id of ["USR-04", "USR-07"]) {
    assert.doesNotMatch(usesText(html, id), /reflection questions/i);
  }
  const checkIn = usesText(html, "USR-04");
  assert.match(checkIn, /fram(?:ing|ed)/i);
  assert.match(checkIn, /personalis/i);
  assert.match(usesText(html, "USR-07"), /fram(?:ing|ed)/i);
});

test("feedback personalisation is not presented as applying saved preferences", () => {
  const html = renderPage(Privacy, [
    [["bootstrap", "member"], { consents: [], profile: {}, hasChart: true }],
    [["journal", "member"], { events: [], checkIns: [], feedback: [] }],
  ]);
  const uses = html.match(/<p[^>]*id="source-USR-11-uses"[^>]*>(.*?)<\/p>/s)?.[1];
  assert.ok(uses);
  assert.doesNotMatch(text(uses), /preferences/i);
  assert.match(text(uses), /personalis|tailor/i);
});

function assertDistinctTargets(html, linkPattern) {
  const links = [...html.matchAll(linkPattern)];
  assert.ok(links.length >= 2);
  const names = links.map((m) => text(m[2]));
  assert.equal(new Set(names).size, names.length, "different cited facts need different names");
  for (const [index, match] of links.entries()) {
    const target = html.match(new RegExp(`<li[^>]*id="${match[1]}"[^>]*>(.*?)</li>`, "s"))?.[1];
    assert.ok(target);
    const heading = target.match(/<h5[^>]*>(.*?)<\/h5>/s)?.[1];
    assert.equal(text(heading), names[index], "the fact heading must match its citation label");
  }
}

test("daily citations distinguish every supplied interpretation, limit and reflection", () => {
  for (const ids of [
    ["I1", "I2"],
    ["D1", "D2"],
    ["P1", "P3"],
    ["T1", "T2"],
    ["E1", "E2"],
    ["U1", "U2"],
    ["R1", "R2"],
    ["X1", "Y1"],
  ]) {
    const html = renderToStaticMarkup(
      createElement(TodayEvidence, {
        readingId: "review",
        cycles: [],
        provenance: [],
        timezone: "UTC",
        paragraphCount: 1,
        paragraphLinksAvailable: true,
        language: {
          mode: "model",
          facts: ids.map((id) => ({ id, statement: `Saved wording for ${id}` })),
          citations: [{ paragraph: 1, facts: ids }],
        },
      }),
    );
    assertDistinctTargets(html, /<a[^>]*href="#(today-review-fact-[^"]+)"[^>]*>(.*?)<\/a>/gs);
  }
});

test("natal citations use distinct names that match the saved fact headings", () => {
  const html = renderToStaticMarkup(
    createElement(ChapterEvidence, {
      feature: { feature_key: "review", title: "Saved chapter" },
      facts: [
        { id: "R1", statement: "Related saved Moon structure" },
        { id: "R2", statement: "Related saved Sun structure" },
      ],
      citations: [{ paragraph: 1, facts: ["R1", "R2"] }],
      evidenceAvailable: true,
      model: null,
      paragraphCount: 1,
    }),
  );
  assertDistinctTargets(html, /<a[^>]*href="#(chapter-review-fact-[^"]+)"[^>]*>(.*?)<\/a>/gs);
});
