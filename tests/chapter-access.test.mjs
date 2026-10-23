import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { resolve } from "node:path";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";

let vite, access, chapterView, ChapterNarrativeState;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    logLevel: "error",
    resolve: { alias: { "@": resolve("src") } },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  access = await vite.ssrLoadModule("/src/lib/chapter-access.ts");
  chapterView = await vite.ssrLoadModule("/src/components/pattern/chapter-view.ts");
  ({ ChapterNarrativeState } = await vite.ssrLoadModule(
    "/src/components/pattern/ChapterNarrativeState.tsx",
  ));
});
after(async () => vite?.close());

const now = Date.parse("2026-10-23T12:00:00Z");
const future = "2026-11-23T12:00:00Z";
const past = "2026-10-01T12:00:00Z";
const invalid = "not-a-date";
const full = (extra = {}) => ({ available: true, locked: false, accessUntil: future, ...extra });
const membership = (extra = {}) => ({ fullAccess: true, accessUntil: future, ...extra });

test("server authority: a stale membership preview cannot gate a full server chapter", () => {
  const state = access.resolveChapterAccess({
    server: full(),
    membership: membership({ fullAccess: false, accessUntil: past }),
    now,
  });
  assert.equal(state.locked, false);
  assert.equal(state.localPreview, false);
  assert.equal(state.accessExpired, false);
  assert.equal(state.accessUntil, future);
});

test("server authority: a stale full membership cannot unlock a server preview", () => {
  const state = access.resolveChapterAccess({
    server: full({ locked: true }),
    membership: membership(),
    now,
  });
  assert.equal(state.locked, true);
  assert.equal(state.localPreview, false);
});

test("server authority: no membership data still trusts the server chapter", () => {
  const state = access.resolveChapterAccess({ server: full(), membership: null, now });
  assert.equal(state.locked, false);
  assert.equal(state.accessExpired, false);
});

test("a server expiry in the past expires and locally previews a full chapter", () => {
  const state = access.resolveChapterAccess({
    server: full({ accessUntil: past }),
    membership: membership(),
    now,
  });
  assert.equal(state.accessExpired, true);
  assert.equal(state.locked, true);
  assert.equal(state.localPreview, true);
});

test("an invalid server expiry is treated conservatively as expired", () => {
  const state = access.resolveChapterAccess({
    server: full({ accessUntil: invalid }),
    membership: membership(),
    now,
  });
  assert.equal(state.accessExpired, true);
  assert.equal(state.locked, true);
  assert.equal(state.localPreview, true);
  assert.equal(state.revalidateAt, invalid);
});

test("a future server expiry ignores past or invalid membership deadlines", () => {
  for (const membershipUntil of [past, invalid]) {
    const state = access.resolveChapterAccess({
      server: full(),
      membership: membership({ accessUntil: membershipUntil }),
      now,
    });
    assert.equal(state.accessExpired, false);
    assert.equal(state.locked, false);
    assert.equal(state.localPreview, false);
    assert.equal(state.accessUntil, future);
    assert.equal(state.revalidateAt, future);
  }
});

test("an omitted server expiry borrows membership only as a revalidation deadline", () => {
  const state = access.resolveChapterAccess({
    server: { available: true, locked: false },
    membership: membership(),
    now,
  });
  assert.equal(state.accessUntil, null);
  assert.equal(state.revalidateAt, future);
  assert.equal(state.accessExpired, false);
  assert.equal(state.localPreview, false);
});

test("an omitted server expiry with a past membership date never truncates the chapter", () => {
  for (const membershipUntil of [past, invalid]) {
    const state = access.resolveChapterAccess({
      server: { available: true, locked: false },
      membership: membership({ accessUntil: membershipUntil }),
      now,
    });
    assert.equal(state.accessUntil, null);
    assert.equal(state.revalidateAt, membershipUntil);
    assert.equal(state.accessExpired, false);
    assert.equal(state.locked, false);
    assert.equal(state.localPreview, false);
  }
});

test("an explicit null server expiry means no deadline at all", () => {
  const state = access.resolveChapterAccess({
    server: full({ accessUntil: null }),
    membership: membership({ accessUntil: past }),
    now,
  });
  assert.equal(state.accessUntil, null);
  assert.equal(state.revalidateAt, null);
  assert.equal(state.accessExpired, false);
  assert.equal(state.locked, false);
  assert.equal(state.localPreview, false);
});

test("an unavailable server response never locks or previews locally", () => {
  const state = access.resolveChapterAccess({
    server: { available: false },
    membership: membership({ accessUntil: past }),
    now,
  });
  assert.equal(state.accessUntil, null);
  assert.equal(state.revalidateAt, past);
  assert.equal(state.accessExpired, false);
  assert.equal(state.locked, false);
  assert.equal(state.localPreview, false);
});

test("membership signatures are stable and distinguish access changes", () => {
  assert.equal(access.membershipAccessSignature(undefined), null);
  assert.equal(access.membershipAccessSignature(null), null);
  assert.equal(
    access.membershipAccessSignature({ fullAccess: true, accessUntil: null }),
    "full:none",
  );
  assert.equal(
    access.membershipAccessSignature({ fullAccess: false, accessUntil: future }),
    `preview:${future}`,
  );
  assert.equal(
    access.membershipAccessSignature({ fullAccess: true, accessUntil: future }),
    access.membershipAccessSignature({ fullAccess: true, accessUntil: future }),
  );
  assert.notEqual(
    access.membershipAccessSignature({ fullAccess: true, accessUntil: future }),
    access.membershipAccessSignature({ fullAccess: true, accessUntil: past }),
  );
});

const narrative = {
  available: true,
  cacheKey: "chart-key",
  narrative: "A readable paragraph.\n\nA second paragraph.",
  paragraphs: ["A readable paragraph.", "A second paragraph."],
  facts: [{ id: "N1", statement: "detached natal structure" }],
  evidenceAvailable: true,
  model: "synthetic/model",
  citations: [{ paragraph: 1, facts: ["N1"] }],
  locked: false,
  accessUntil: future,
};

test("view state keeps readable content ahead of a background error", () => {
  assert.deepEqual(
    chapterView.resolveChapterView({
      data: narrative,
      display: narrative,
      error: true,
      isPending: false,
      isFetching: false,
      locked: false,
    }),
    { kind: "ready", narrative, locked: false, staleError: true },
  );
});

test("view state reports a changed chart before any error or loading state", () => {
  assert.deepEqual(
    chapterView.resolveChapterView({
      data: narrative,
      display: null,
      error: false,
      isPending: false,
      isFetching: true,
      locked: false,
    }),
    { kind: "changed" },
  );
});

test("view state falls back to error, unavailable and loading in order", () => {
  assert.deepEqual(
    chapterView.resolveChapterView({
      data: undefined,
      display: null,
      error: true,
      isPending: false,
      isFetching: false,
      locked: false,
    }),
    { kind: "error" },
  );
  assert.deepEqual(
    chapterView.resolveChapterView({
      data: { available: false, retryable: true, reason: "Try again." },
      display: null,
      error: false,
      isPending: false,
      isFetching: false,
      locked: false,
    }),
    { kind: "unavailable", retryable: true, reason: "Try again." },
  );
  assert.deepEqual(
    chapterView.resolveChapterView({
      data: undefined,
      display: null,
      error: false,
      isPending: true,
      isFetching: true,
      locked: false,
    }),
    { kind: "loading" },
  );
});

const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
const feature = { feature_key: "sun_in_aries", title: "Sun in Aries" };
function renderState(state) {
  return renderToStaticMarkup(
    createElement(
      RouterContextProvider,
      { router },
      createElement(ChapterNarrativeState, {
        state,
        feature,
        narrativeRef: null,
        isFetching: false,
        onRetry() {},
        onRefreshChapters() {},
      }),
    ),
  );
}

test("a stale narrative error shows the chapter and a non-blocking retry", () => {
  const html = renderState({ kind: "ready", narrative, locked: false, staleError: true });
  assert.match(html, /A readable paragraph/);
  assert.match(html, /last version loaded/);
  assert.match(html, /Try refreshing this chapter/);
  assert.doesNotMatch(html, /This chapter couldn’t load/);
});

test("a hard error shows the error panel only when nothing is readable", () => {
  const html = renderState({ kind: "error" });
  assert.match(html, /This chapter couldn’t load/);
  assert.match(html, /Try this chapter again/);
});

test("an unavailable chapter shows the server reason and retries only when allowed", () => {
  const retryable = renderState({
    kind: "unavailable",
    retryable: true,
    reason: "This chapter took too long to prepare. You can try again.",
  });
  assert.match(retryable, /took too long/);
  assert.match(retryable, /Try this chapter again/);
  const final = renderState({
    kind: "unavailable",
    retryable: false,
    reason: "No verified reading could be written.",
  });
  assert.match(final, /No verified reading could be written/);
  assert.doesNotMatch(final, /Try this chapter again/);
});

test("a locked ready chapter renders the upsell as an h4", () => {
  const html = renderState({ kind: "ready", narrative, locked: true, staleError: false });
  assert.match(
    html,
    /<h4 class="font-serif text-xl font-medium">Continue this chapter with Pattern Plus<\/h4>/,
  );
});

test("no narrative state mentions the membership check", () => {
  for (const state of [
    { kind: "loading" },
    { kind: "changed" },
    { kind: "error" },
    { kind: "unavailable", retryable: true, reason: "Try again." },
    { kind: "ready", narrative, locked: false, staleError: false },
    { kind: "ready", narrative, locked: true, staleError: true },
  ]) {
    assert.doesNotMatch(renderState(state), /membership/i);
  }
});
