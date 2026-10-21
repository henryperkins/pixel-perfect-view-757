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
