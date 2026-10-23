# Reading exploration remediation plan

- **Status:** Implemented on 2026-10-23 in `c406239..adb20bc`; baseline `f7d1b37`; verification record in Section 12
- **Date:** 2026-10-23
- **Baseline:** `main` at `f7d1b37`; application tree clean before this untracked plan was added
- **Scope:** Pattern chapter reader, chapter evidence, Today reading evidence, chart summary/details, and shared timing evidence
- **Related review:** 2026-10-22 reader-exploration review (findings F1–F12)

## 1. Purpose

This plan resolves every finding from the reader-exploration review in one coordinated change set. The work is deliberately split between:

- **Access authority and recovery** — stop background membership failures from hiding or truncating a readable chapter.
- **Evidence integrity** — validate saved citations and render malformed or truncated evidence defensively.
- **Accessibility** — make citation targets visibly focusable and correct heading levels.
- **Plain-language source clarity** — remove raw accuracy and transport wording from reader-facing copy, and stop rendering links to missing evidence.
- **Layout and robustness** — remove dead chapter-toggle layout rules and make the saved transit sequence tolerant of incomplete data.

The result should preserve the existing visual world, server authority, evidence semantics, and reading content. Changes cover chapter-query scheduling, presentation, and citation sanitization at the persistence boundary. Billing calculations, generation policy, prompts, providers, and database schema remain outside scope; the query-timing consequence is documented in Phase 1.

## 2. Baseline and constraints

### Current baseline

- Application baseline: `HEAD` is `f7d1b37` on `main`; this proposed plan is the only untracked file.
- The reviewed components are unchanged since the 2026-10-22 review.
- Focused baseline checks passed:
  - `node --test tests/pattern-chapters.test.mjs` — 10 passed.
  - `node --test tests/today-evidence.test.mjs` — 8 passed.
  - `node --test tests/interface-clarity.test.mjs` — 5 passed.
  - `npx tsc --noEmit` — passed.
- The earlier review reported clean scoped ESLint on the reviewed components; that result was not rerun during this plan review.
- No browser run was performed for the review. CSS and focus findings are source-level and require browser verification in this plan.

### Plan review amendments (2026-10-23)

- **R1 — Access lifecycle:** Revalidate a cached readable chapter on route remount, reconcile either membership/narrative response order once, and test the mounted queries and effects. A signature comparison alone cannot establish that cached content reflects current access.
- **R2 — Complete window validation:** Validate both boundaries of every rendered transit window. Checking only the outer ingress/egress leaves middle-window reads able to throw.
- **R3 — Persistent evidence:** Keep calculated evidence and journal context outside the narrative-state branches, including loading, error, unavailable, and chart-change states.
- **R4 — Expiry authority:** Separate the server's access deadline from a membership-only revalidation deadline. Stale membership dates never truncate a server-authorized chapter, including responses with an omitted or null expiry.
- **R5 — Legacy citation compatibility:** Structurally validate legacy citations without filtering against an absent saved fact set. Preserve the existing legacy essay test and the `evidenceAvailable: false` display contract.
- **R6 — Heading appearance:** Set explicit heading weights when changing tags: 400 for chart connection groups and 500 for the chapter upsell.
- **R7 — Evidence empty states:** Base the empty state on visible, in-range citations. Refer to saved source facts only when they exist, rather than promising current calculated values in the saved-evidence branch.
- **R8 — Extraction contract:** Define the narrative type, pass the arrival-animation ref through the presentational component, and use router-aware SSR fixtures.
- **R9 — Bounded request counts:** Specify exact request counts for cached-preview remounts, including a server that remains locked after mount revalidation and one reconciliation.
- **R10 — Reproducible verification:** Withdraw unretained scratch-script pass counts. Require checked-in fixtures, exact commands, revision identifiers, and observed output for implementation qualification.

These amendments revise the proposed implementation and its acceptance checks. Application remediation is implemented; Section 12 records the post-implementation verification.

Verification status: the three focused Node suites (23 tests) and typecheck above were reproduced during review. The earlier claim that nine access-effect sequences, three `QueryObserver` mount cases, and fourteen transit-guard fixtures passed is withdrawn: those scratch scripts and fixtures were not retained, so the result is not reproducible. Reference snippets below are proposed implementation guidance, not qualified code. Section 6 specifies the checked-in tests, browser cases, commands, and result records required after implementation.

### Constraints

- Follow `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md`.
- Preserve the “Scientific Editorial” visual world and semantic color tokens.
- Never rewrite published git history or force-push a Lovable-connected branch.
- Keep the server as the authority for paid access. Client-side previewing is a presentation fallback, not an entitlement decision.
- Do not add a database migration. Citation sanitization must work with existing stored rows.
- Do not change Stripe, checkout, subscription, or entitlement calculations.
- Do not change model providers, prompts, content bundles, or generation retry behavior.
- Do not expose private or raw transport details in reader-facing copy.
- Keep all new tests local and synthetic; do not call live services.

## 3. Findings and root causes

| ID  | Severity   | Finding                                                          | Root cause                                                                                                                                                                                                |
| --- | ---------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | High       | A failed membership poll can blank or downgrade an open chapter. | `PatternChapter` blocks on `membership.error` even when cached membership data exists, and includes `!membership.isError` in `fullAccess`. `useMembership` polls every 30s with `retry: false`.           |
| F2  | High       | The client can re-gate a chapter the server already authorized.  | `getFeatureNarrative` already applies `chapterPreview` and returns `locked`/`accessUntil`, but `PatternChapter` ignores those and re-applies preview from separately polled membership.                   |
| F3  | Medium     | A failed narrative refetch hides an already-loaded essay.        | The `query.error` branch is ordered before the `narrative` branch, although React Query preserves `data` on a failed refetch.                                                                             |
| F4  | Medium     | Cached chapter citations are cast, not validated.                | `loadFeatureNarrative` casts `cached.citations`; `PatternChapterEvidence` assumes each entry has `paragraph` and a `facts` array. A malformed entry throws during render.                                 |
| F5  | Medium     | Citation focus targets have no visible focus ring.               | `focusTarget` focuses `<p tabIndex={-1}>` and `<li tabIndex={-1}>`, but `.pattern-evidence-target` only sets scroll margin, and the global focus-visible rule excludes `[tabindex]`.                      |
| F6  | Low/medium | Today evidence says “Hour” or “Near” instead of plain accuracy.  | `TodayEvidence` and `today-view` use `todayPointLabel` for birth-time accuracy instead of the existing `plainAccuracy` helper.                                                                            |
| F7  | Low        | The chapter toggle grid has a dead column.                       | Desktop grid declares four columns, but the markup has three children. `.pattern-chapter-index` rules are unused.                                                                                         |
| F8  | Low        | Heading hierarchy gaps.                                          | The chapter upsell is an `<h3>` sibling of the chapter title; chart connection groups jump from `<h2>` to `<h4>`.                                                                                         |
| F9  | Low        | Raw degraded-reason text can reach readers.                      | `PatternChartSummary` and `EphemerisNotice` render `degradedReason` directly; Swiss fallback reasons can include HTTP/transport wording.                                                                  |
| F10 | Low        | Archived Today evidence can render dead parent links.            | The `P2` block hardcodes `C1`, `I1`, `A1`, and the `N1` block maps `dependsOn` without checking whether those facts were retained.                                                                        |
| F11 | Low        | `TransitSequence` relies on non-null assertions.                 | The component assumes `samples[1]`, `componentIds[1]`, a matching component, non-empty windows, and a first contact range.                                                                                |
| F12 | Low        | Truncated fact JSON can render as mangled text.                  | `featureFacts` truncates structured values to 300 characters; `describeFact` then tries `JSON.parse` and falls back to `bodyName(String(value))`, which replaces underscores and hyphens inside the JSON. |

## 4. Solution decisions

### D1. Server response is authoritative for chapter access

The narrative response from `getFeatureNarrative` is the source of truth for whether the returned chapter is full or previewed. The client must not re-apply a preview because a separately polled membership query is stale or erroring.

`membership` remains useful for:

- triggering a narrative refresh when access changes;
- scheduling revalidation when the narrative response omits its expiry; this timer cannot trigger local preview;
- showing non-blocking access status.

It must not decide whether a server-authorized full chapter is displayed.

### D2. Background errors never replace readable content

A background refetch failure is not a content failure. If a narrative is already in memory:

- keep the narrative visible;
- show a small, non-blocking “couldn’t refresh” notice with a retry action;
- only show a full error panel when there is no readable narrative.

A failed membership poll is not a chapter failure at all. The chapter request is independent and the server checks access itself.

### D3. Client preview only for local access expiry

`chapterPreview` may still be used in one narrow case: a full narrative is already in memory and its server-returned `accessUntil` passes while the chapter is open. In that case the client shows the preview immediately and triggers a server refetch. A malformed server-returned expiry is treated conservatively as expired. An omitted or null server expiry never borrows a membership date for truncation; membership can only request revalidation. The server remains the authority on the next request.

### D4. Sanitize citations at the boundary, render defensively in the client

- The server validates and sanitizes cached and newly generated citations before returning or saving them.
- Invalid entries are dropped; duplicate paragraphs and fact IDs are merged. Unknown fact IDs are removed only when the saved evidence set is available (including an explicitly empty set).
- Legacy essays with `evidenceAvailable: false` receive structural validation only. Their fact IDs cannot be checked against an absent saved set, and retaining citation metadata must not manufacture evidence or enable source links in that branch.
- The client still validates props because legacy rows and tests can pass older shapes.
- An empty citation list is stated plainly rather than rendered as an empty ordered list.

### D5. Use `:focus`, not only `:focus-visible`, for programmatic evidence targets

Citation links move focus programmatically. `:focus-visible` may not match after a pointer-initiated programmatic focus, so the target would have no visible outline. Evidence targets should use `:focus` so every activation shows where focus landed.

### D6. Map degraded reasons to plain copy; keep raw detail out of reader UI

Known service, configuration, timeout, and incomplete-response reasons map to a small set of plain sentences. Raw reasons remain available in logs or technical/admin surfaces, not in the reading UI.

### D7. Remove the dead chapter index rather than restore it

`DESIGN.md` reserves numbering for meaningful sequences. The chapter meta already carries family and strength. Remove the unused 24px grid column and `.pattern-chapter-index` rules instead of reintroducing decorative numbering.

### D8. Robustness fallbacks are explicit

When saved evidence is incomplete, render a clear fallback sentence rather than throwing or rendering an empty shell. This applies to `TransitSequence` and to malformed fact values.

## 5. Implementation plan

### Phase 1 — Access authority and recovery (F1–F3)

#### 1.1 Add pure access helpers

Create `src/lib/chapter-access.ts`:

```ts
export type ChapterAccessInput = {
  server:
    | {
        available: boolean;
        locked?: boolean;
        accessUntil?: string | null;
      }
    | null
    | undefined;
  membership:
    | {
        fullAccess: boolean;
        accessUntil: string | null;
      }
    | null
    | undefined;
  now: number;
};

export type ChapterAccessState = {
  /** The available server response's expiry only; never borrowed from membership. */
  accessUntil: string | null;
  /** A refresh deadline; a membership fallback cannot affect display access. */
  revalidateAt: string | null;
  accessExpired: boolean;
  locked: boolean;
  localPreview: boolean;
};

export function resolveChapterAccess(input: ChapterAccessInput): ChapterAccessState;

export function membershipAccessSignature(
  data: { fullAccess: boolean; accessUntil: string | null } | null | undefined,
): string | null;
```

Rules:

- `accessUntil` is `server.accessUntil ?? null` only when `server.available` is true; otherwise it is `null`. It never falls back to membership data.
- `revalidateAt` is the available server response's `accessUntil` when that property is defined. An explicit server `null` means no deadline and must not borrow a membership date. If the server response or its expiry is omitted, use `membership.accessUntil ?? null` for revalidation only.
- `accessExpired` depends exclusively on `accessUntil`: a present string that is invalid or at or before `now` is expired; `null` or omitted is not. A stale or malformed membership date cannot set this flag.
- `locked` is true only for an available server response when `server.locked === true || accessExpired`.
- `localPreview` is true only when the server returned an available chapter with `locked === false` and `accessExpired` is true. This is the only case where the client applies `chapterPreview` locally.
- A past or invalid `revalidateAt` schedules one immediate refresh per query scope and unchanged deadline. Repeated identical polls must not re-arm it. A membership-only refresh keeps the server text and lock state until a new server response arrives.

Create the pure view-state resolver and its types in `src/components/pattern/chapter-view.ts`. Define `ChapterNarrative` from the available server-function response; it does not currently exist. Use a type-only import so this module adds no runtime dependency on the server function:

```ts
import type { fetchFeatureNarrative } from "@/lib/pattern.functions";

export type ChapterNarrative = Extract<
  Awaited<ReturnType<typeof fetchFeatureNarrative>>,
  { available: true }
>;

export type ChapterViewState =
  | { kind: "loading" }
  | { kind: "changed" }
  | { kind: "error" }
  | { kind: "unavailable"; retryable: boolean; reason: string | null }
  | {
      kind: "ready";
      narrative: ChapterNarrative;
      locked: boolean;
      staleError: boolean;
    };
```

Priority order:

1. `ready` when a displayable narrative exists, even if `query.error` is set. Set `staleError` when `query.error` is also set. `display` must be `null` when the chart key changed, so a changed chart cannot be reported as ready.
2. `changed` when the response is available but its cache key differs from the page key.
3. `error` when there is no displayable narrative and `query.error` is set.
4. `unavailable` when the response says it is unavailable and not retryable or retryable.
5. `loading` while pending or fetching without a displayable narrative.

Membership errors never appear in this state machine.

Extract only the narrative-state rendering into an exported `ChapterNarrativeState` in `src/components/pattern/ChapterNarrativeState.tsx`, with this explicit prop contract:

```ts
import type { Ref } from "react";
import type { PatternFeature } from "./pattern-view";
import type { ChapterViewState } from "./chapter-view";

export type ChapterNarrativeStateProps = {
  state: ChapterViewState;
  feature: PatternFeature;
  narrativeRef: Ref<HTMLDivElement>;
  isFetching: boolean;
  onRetry: () => void;
  onRefreshChapters: () => void;
};
```

`PatternChapter` keeps the queries, access timer, access-reconciliation effect, and an unconditional `useReadingArrival(Boolean(display))` call. Pass its returned ref as `narrativeRef`; the presentational component attaches it to the `ready` branch's `<div className="pattern-narrative prose-reading">`. Do not move the hook into a ready-only child: it must observe the transition from pending to ready. Keep the same component mounted across state changes and retained collapse/reopen. Retry/refresh actions use the supplied callbacks, and retry buttons use `isFetching` to avoid duplicate submissions.

The extracted component can be server-rendered without React Query or server-function mocks, but still requires router context for its `<Link to="/plans">`. Ref attachment and one-time animation require mounted browser coverage; SSR cannot establish them.

`PatternChapterEvidence` and `AttachedJournalContext` remain unconditional siblings after `ChapterNarrativeState` in the owning `PatternChapter`. They must not move into its `ready` branch. When there is no displayable narrative, pass empty saved facts/citations, `evidenceAvailable: false`, no model, and zero paragraphs to the evidence component so it still exposes `feature.payload` as calculated values. A changed chart must not display the mismatched narrative's saved evidence.

#### 1.2 Refactor `PatternChapter`

Current file: `src/components/pattern/PatternChapter.tsx`.

Changes:

- Keep `useMembership` for access-change invalidation and revalidation-deadline fallback.
- Enable the narrative query independently of membership data. The component only renders inside the authenticated route, and `fetchFeatureNarrative` already requires auth. This changes request timing: `getFeatureNarrative` loads or generates the chapter before its own membership check, so generation can begin even if the separate membership query fails. Keep one initial chapter request and no automatic retry of a failed/unavailable writing result; cover this behavior with synthetic requests.
- Remove `!membership.isError` from access computation.
- Remove `Boolean(fullAccess)` from the query key. Use a stable key:

```ts
queryKey: ["feature-narrative", cacheKey, feature.feature_key];
```

- Keep `staleTime: Infinity` and `retry: false`. Revalidate an already-readable cached result when its observer mounts after leaving the route:

```ts
refetchOnMount: (query) => (query.state.data?.available ? "always" : false),
```

This deliberately refreshes cached full and preview chapters on route return, regardless of whether membership is already cached. Keep their content visible during the refresh. A cached `available: false` writing result must not be automatically retried by this option. Opening a retained chapter does not remount its observer, so collapse/reopen still causes no request or arrival animation.

- Add bounded access reconciliation. Track the observed membership signature, an unprocessed access change, and the signature already reconciled for the current query scope. Check for full-membership/locked-response mismatch when either result arrives; do not return solely because the membership signature stayed the same. A reference effect is:

```ts
const signature = membershipAccessSignature(membership.data);
const queryScope = JSON.stringify([cacheKey, feature.feature_key]);
const accessRefresh = useRef({
  queryScope,
  observedSignature: null as string | null,
  pendingChange: false,
  reconciledSignature: null as string | null,
});

useEffect(() => {
  if (accessRefresh.current.queryScope !== queryScope) {
    accessRefresh.current = {
      queryScope,
      observedSignature: null,
      pendingChange: false,
      reconciledSignature: null,
    };
  }
  if (!signature) return;
  const refresh = accessRefresh.current;
  if (refresh.observedSignature !== signature) {
    refresh.pendingChange ||= refresh.observedSignature !== null;
    refresh.observedSignature = signature;
    refresh.reconciledSignature = null;
  }

  // Wait for the current request; never cancel and restart it for an access change.
  if (query.isFetching) return;
  // Consume changes against failed/unavailable writing without retrying it or
  // carrying an old change into a later explicit retry with the same signature.
  if (query.data?.available === false || (query.isError && !query.data)) {
    refresh.pendingChange = false;
    refresh.reconciledSignature = signature;
    return;
  }
  if (!query.data?.available) return;
  const mismatch =
    membership.data?.fullAccess === true &&
    query.data.locked === true &&
    refresh.reconciledSignature !== signature;
  if (!refresh.pendingChange && !mismatch) return;

  // Consume before invalidating. A subsequent locked answer remains authoritative
  // and cannot trigger a loop for this unchanged signature.
  refresh.pendingChange = false;
  refresh.reconciledSignature = signature;
  void client.invalidateQueries({
    queryKey: ["feature-narrative", cacheKey, feature.feature_key],
  });
}, [
  signature,
  membership.data?.fullAccess,
  query.data,
  query.isFetching,
  query.isError,
  queryScope,
  cacheKey,
  feature.feature_key,
  client,
]);
```

- Reset reconciliation state when the query scope changes. An access change observed during a request remains pending until it settles. Repeated identical membership polls and repeated locked answers for a reconciled signature cause no additional request. Failed/unavailable results consume a pending change without a fetch; an explicit retry with the same signature must not trigger another automatic request after it succeeds. Server-full/membership-preview disagreement never causes local truncation; after a known signature transition, refresh the server response once instead.
- Keep bounded mismatch reconciliation after mount revalidation. With a cached preview, cached full membership, and a server that keeps returning locked, this intentionally permits **two** chapter requests after remount: one mount refresh and one reconciliation. There is no third request for the same signature. If the mount refresh returns full, only one request is expected. Record these exact counts in the mounted fixtures below.
- Keep the expiry timer, using `revalidateAt` from `resolveChapterAccess`, and make it invalidate a readable narrative as well as refetch membership. Schedule a future finite deadline normally and a past/invalid deadline once with a finite minimum delay. A null deadline creates no timer. Track the consumed deadline per query scope so unchanged data/polls cannot produce a refresh loop. The callback is:

```ts
setClock(Date.now());
void refetchMembership();
if (query.data?.available) {
  void client.invalidateQueries({
    queryKey: ["feature-narrative", cacheKey, feature.feature_key],
  });
}
```

- Compute access with `resolveChapterAccess`.
- Advancing `clock` affects local preview only through server-only `accessUntil`; a membership-only `revalidateAt` can trigger the callback without locking or truncating the chapter.
- Display the server narrative directly. Apply `chapterPreview` only when `access.localPreview` is true.
- Remove the blocking `membership.error` panel.
- If desired, add a small non-blocking `role="status"` line in the reading details area when `membership.error` is set and the narrative is still readable. It must not replace the chapter.
- Move the narrative error branch after the readable-narrative branch:

```tsx
{
  state.kind === "ready" ? (
    <>
      {state.staleError ? (
        <div className="pattern-narrative-fallback">
          <p role="status">This chapter is the last version loaded. We couldn’t refresh it.</p>
          <Button variant="outline" disabled={isFetching} onClick={onRetry}>
            Try refreshing this chapter
          </Button>
        </div>
      ) : null}
      {/* narrative and locked upsell only */}
    </>
  ) : state.kind === "loading" ? (
    {/* existing loading panel */}
  ) : state.kind === "changed" ? (
    {/* existing chart-change panel */}
  ) : state.kind === "error" ? (
    {/* existing error panel */}
  ) : (
    {/* existing unavailable panel */}
  );
}
```

- The Pattern Plus upsell condition becomes `state.kind === "ready" && state.locked`.
- After the narrative-state component, always render the evidence component and journal context. The evidence component receives the displayed narrative's facts, citations, evidence flag, model, and paragraph count when available; otherwise use the calculated-values fallback described in 1.1. Neither component depends on a successful essay load.
- Preserve `useReadingArrival(Boolean(display))` in `PatternChapter` and pass its ref through the prop contract in 1.1. Verify first asynchronous arrival still animates once, reduced motion suppresses it, and opening a retained chapter does not replay it.

#### 1.3 Add regression coverage for access behavior

Add `tests/chapter-access.test.mjs`:

- `resolveChapterAccess`:
  - server full + stale membership preview → not locked (server authority).
  - server preview + stale membership full → locked (server authority).
  - server full + no membership data → not locked (server authority).
  - server full + server `accessUntil` in the past → expired, locked, `localPreview: true`.
  - server full + invalid server `accessUntil` → expired and locked, with the same invalid value in `revalidateAt`; the one-shot refresh is checked in mounted coverage below.
  - server full + future server `accessUntil` + past/invalid membership expiry → not expired; both `accessUntil` and `revalidateAt` use the server date.
  - server full + omitted server `accessUntil` + future membership expiry → `accessUntil: null`, `revalidateAt` uses membership, and no local preview.
  - server full + omitted server `accessUntil` + past/invalid membership expiry → `accessExpired: false`, `locked: false`, `localPreview: false`; membership schedules revalidation only.
  - server full + explicit server `accessUntil: null` + past/invalid membership expiry → both deadlines are null; no local preview or membership-deadline timer.
  - absent/unavailable server response → no local lock or preview; a membership deadline may refresh membership but must not retry chapter writing.
- `membershipAccessSignature`:
  - `undefined` → null.
  - `{ fullAccess: true, accessUntil: null }` → `full:none`.
  - `{ fullAccess: false, accessUntil: "..." }` → `preview:...`.
  - same values → same signature; changed values → changed signature.

Add a presentational test for the view-state priority. Render the exported `ChapterNarrativeState` for each state with `renderToStaticMarkup`, supplying the documented callbacks, `narrativeRef: null`, and `isFetching`. Wrap it in `RouterContextProvider` using `createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() })`, following the existing test helpers. The locked state's `<Link>` still needs this context even though the component has no queries:

- `ready` + `staleError` renders the narrative and a non-blocking retry, not the full error panel.
- `error` with no narrative renders the error panel.
- `unavailable` renders the server reason and retry only when retryable.
- `ready` + `locked` renders the upsell with an `<h4>`.
- membership error is absent from every state’s markup.

Extend `tests/interface-review-fixes.test.mjs` to render the owning `PatternChapter` with `QueryClientProvider`, `RouterContextProvider`, and the existing synthetic member providers. Router context is also required by `useServerFn`, not only by visible links. Seed the session, membership, journal, and stable three-part narrative query keys for loading, error, unavailable, changed-chart, and ready states; construct error state explicitly rather than relying on effects running during SSR. Assert that “Behind this chapter,” calculated values from the current feature payload, and the journal attachment action remain available without a readable essay. For changed-chart data, assert that the old saved fact statements do not render. Rendering only `ChapterNarrativeState` is insufficient to prove this sibling placement.

Add mounted lifecycle checks to `tests/helpers/mobile-ui/pattern-evidence.cases.txt`, using the synthetic service overrides, held requests, and request counts:

- Leave the Pattern route with a cached preview, update membership to full while on another route, then return before query garbage collection. The mount revalidation must fetch a full server answer and remove the upsell without a page reload. Cover cached-full/current-preview membership on route return too; the new server answer decides the result.
- Repeat cached-preview/cached-full-membership remount with a server that remains locked: hold and release the mount refresh, then hold and release the one reconciliation. Assert exactly two chapter requests, the preview/upsell stays visible, and subsequent identical polls add zero requests. Use future server/membership deadlines to isolate this case from expiry timers.
- Membership resolves first with full access; a held initial narrative then returns locked. Exactly one reconciliation follows. Reverse the response order and assert the same outcome.
- After that reconciliation, return another locked server response with the same membership signature. Subsequent identical polls must not cause additional chapter requests.
- Change a known access signature during a held narrative refresh. The current request must settle without cancellation/restart; one pending reconciliation then runs. Change the chart/query scope and assert that reconciliation state is reset for the new key.
- Fail a membership poll and a narrative background refresh separately. A loaded chapter and its evidence remain visible; a narrative failure adds the non-blocking retry. Do not expect a membership failure to trigger another chapter request.
- Fail the initial membership request while there is no cached narrative. Assert one independent chapter request and server-authoritative rendering when it completes; a failed/unavailable writing answer is not automatically retried.
- Cache an unavailable writing result and return to the route. Mount revalidation and membership changes must not automatically retry chapter generation. After a membership change, explicitly retry a retryable result and return an available chapter (both full and locked variants); the unchanged membership signature must not cause a second request after that retry succeeds.
- With a controlled browser clock, cross the server-returned access expiry and assert immediate local preview plus server revalidation. Separately use omitted server expiry with past, invalid, and future membership deadlines: each deadline causes at most one revalidation, and full text stays visible while it is held or fails. Explicit null server expiry creates no fallback timer. Unchanged polls must not re-arm a consumed deadline.
- Observe the first asynchronous narrative becoming ready: the ref is attached and the arrival animation runs once (zero times with reduced motion). Collapse/reopen a retained chapter and assert no additional request and no replayed arrival animation.

For the isolated request-count cases, reset `fetchFeatureNarrative` counts after seeding and immediately before the action, hold the relevant requests to control ordering, and keep all access deadlines in the future. Count chapter requests only, excluding membership polls and journal requests:

| Case ID                       | Action and server answers                                                                                          | Expected chapter requests                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `access-remount-unlocks`      | Cached preview + cached full membership; mount answer is full                                                      | 1 mount refresh                               |
| `access-remount-stays-locked` | Cached preview + cached full membership; both answers stay locked                                                  | 2 total: 1 mount refresh + 1 reconciliation   |
| `access-initial-order`        | Empty chapter cache + full membership; initial and reconciliation answers locked, in either initial response order | 2 total: 1 initial request + 1 reconciliation |
| `access-remount-preview`      | Cached full + preview membership; mount answer is locked                                                           | 1 mount refresh                               |
| `access-reconciled-polls`     | Identical polls after a locked reconciliation                                                                      | 0 additional                                  |
| `access-unavailable-remount`  | Cached unavailable result; remount and change membership                                                           | 0                                             |
| `access-explicit-retry`       | Explicit retry after unavailable/failed writing consumed an access change; signature unchanged                     | 1 explicit retry, 0 automatic follow-ups      |
| `access-retained-reopen`      | Collapse/reopen an already-visited chapter                                                                         | 0 additional                                  |

These checks exercise actual queries and effects in a mounted browser. They run through the separate CLI harness, not `npm test`; scalar signature tests and static markup cannot substitute for them.

Acceptance criteria:

- A failed membership poll with cached full access does not remove or truncate the chapter.
- A server full response renders full even if membership data says preview.
- A server preview response renders preview even if membership data says full.
- Only server-returned access expiry flips to preview; membership-only deadlines revalidate without truncating. Neither timer nor access-signature effects create fetch loops.
- Cached readable chapters revalidate on route remount; cached unavailable writing is not automatically retried.
- Both initial response orders reconcile once; cached-preview remounts match the exact request-count table. Unchanged conflicting results do not cause a third request or cancel an in-flight chapter request.
- A narrative refetch error with an existing narrative shows the narrative plus a non-blocking retry.
- No blocking membership-error panel exists in the chapter reader.
- Calculated evidence and journal context remain available in every narrative state, without displaying mismatched saved evidence after a chart change.
- The arrival ref reaches the ready narrative element; first asynchronous arrival animates once, retained reopen does not replay it, and reduced motion suppresses it.

### Phase 2 — Evidence integrity (F4, F12)

#### 2.1 Add a shared citation module

Create `src/lib/narrative-citations.ts`:

```ts
import { z } from "zod";

export type NarrativeCitation = {
  paragraph: number;
  facts: string[];
};

export const narrativeCitationSchema = z.object({
  paragraph: z.number().int().min(1).max(100),
  facts: z.array(z.string().min(1).max(80)).min(1).max(20),
});

export function sanitizeNarrativeCitations(
  value: unknown,
  knownFactIds: Iterable<string>,
): NarrativeCitation[];

export function readableNarrativeCitations(value: unknown): NarrativeCitation[];
```

Rules:

- `sanitizeNarrativeCitations` is server-facing:
  - returns `[]` for non-arrays;
  - parses each entry with `safeParse`;
  - drops entries with invalid paragraph or facts;
  - removes fact IDs not in `knownFactIds`;
  - drops citations with no remaining facts;
  - deduplicates fact IDs within every citation, even without a duplicate paragraph, then merges duplicate paragraph numbers while preserving first-seen fact order;
  - sorts by paragraph.
- `readableNarrativeCitations` is the shared structural validator, used by the client and by the server for legacy essays without retained evidence:
  - performs the same structural validation;
  - does not require known fact IDs, because the component already renders “Source unavailable” for unknown IDs;
  - deduplicates fact IDs within each entry and merges duplicate paragraphs, preserving first-seen fact order and sorting by paragraph;
  - is safe for `null`, `undefined`, strings, and arrays containing null.
- Do not use `.strict()` on the citation object. Existing rows may contain extra fields; strip them rather than rejecting the whole citation.

#### 2.2 Sanitize on the server

Current server path: `src/lib/pattern.server.ts`, `loadFeatureNarrative`.

- Cached path:

```ts
const unpacked = unpackNarrative(await decryptField(dek, cached.narrative_ct));
const citations = unpacked.evidenceAvailable
  ? sanitizeNarrativeCitations(
      cached.citations,
      unpacked.facts.map((fact) => fact.id),
    )
  : readableNarrativeCitations(cached.citations);
return {
  ...unpacked,
  citations,
  // ...
};
```

- Preserve the existing `legacy encrypted essays remain readable without manufactured citation evidence` test in `tests/pattern-chapters.test.mjs`, including equality with the original valid citations. `unpackNarrative` returns `facts: []` and `evidenceAvailable: false` for plaintext legacy essays; this is absent evidence, not a known empty source set. Keep those fields and the stored row unchanged. In contrast, an envelope with `evidenceAvailable: true` and `facts: []` has a known empty set, so ID filtering must remove its citations.
- Structurally valid legacy citation metadata does not enable paragraph links: the `evidenceAvailable: false` component branch continues to show current calculated values and the older-reading limitation. Do not reconstruct saved facts from current chart rows.

- Generated path:

```ts
const citations = sanitizeNarrativeCitations(
  written.meta.citations,
  facts.map((fact) => fact.id),
);
// Save and return `citations`, not the raw `written.meta.citations`.
```

- Log only counts when entries are dropped or merged:

```ts
if (rawCount !== citations.length) {
  console.warn("[pattern] sanitized chapter citations", {
    featureKey,
    rawCount,
    keptCount: citations.length,
  });
}
```

- Never log citation statements, fact text, or chapter prose.

#### 2.3 Harden `PatternChapterEvidence`

Current file: `src/components/pattern/PatternChapterEvidence.tsx`.

- Normalize citations and filter to the displayed paragraph range before deciding whether there are links to render:

```ts
const visibleCitations = readableNarrativeCitations(citations).filter(
  (citation) => citation.paragraph <= paragraphCount,
);
```

The helper already enforces `paragraph >= 1`. Use `visibleCitations` for both the list and its empty-state condition; a nonempty normalized input can still have zero in-range entries.

- Deduplicate facts defensively:

```ts
const safeFacts = Array.isArray(facts)
  ? facts.filter(
      (fact): fact is Fact =>
        Boolean(fact) &&
        typeof fact === "object" &&
        typeof fact.id === "string" &&
        typeof fact.statement === "string",
    )
  : [];
const uniqueFacts = [...new Map(safeFacts.map((fact) => [fact.id, fact])).values()];
```

- Use `uniqueFacts` for `byId`, `referenceLabels`, and the rendered list.
- If `evidenceAvailable` is true and `visibleCitations.length === 0`, render a sentence about the displayed reading and only promise saved facts when they exist:

```tsx
<p className="text-sm leading-relaxed text-muted-foreground">
  No paragraph source links are available for the displayed reading.
  {uniqueFacts.length > 0 ? " Saved source facts are listed below." : null}
</p>
```

- Do not render an empty `<ol aria-label="Sources by paragraph">`.
- Render the “Facts behind the wording” heading and fact list only when `uniqueFacts.length > 0`; otherwise state “No saved source facts are available for this reading.” Do not render an empty fact list or claim that current calculated payload values appear in this saved-evidence branch. The `evidenceAvailable: false` calculated-values fallback remains separate.
- If a citation references a fact not in `uniqueFacts`, keep the current “Source unavailable” fallback. This is honest for legacy or partially retained evidence.
- Use a stable key for citations after merging. Paragraph numbers are unique after sanitization; still use `${paragraph}-${index}` only if a duplicate could reach the client through a test fixture.

#### 2.4 Fix truncated fact display

Current files: `src/lib/ai/facts.ts` and `src/components/pattern/PatternChapterEvidence.tsx`.

- Keep the existing 300-character storage bound to avoid changing model input and saved data.
- Add a raw-text path to `describeFact`:

```ts
type DescribedFact = {
  label: string;
  value: unknown;
  field?: string;
  raw?: boolean;
};

function parseFactValue(text: string): { value: unknown; raw: boolean } {
  try {
    return { value: JSON.parse(text), raw: false };
  } catch {
    return { value: text, raw: true };
  }
}
```

- `describeFact` returns `raw: true` when parsing fails.
- `Value` accepts `raw`:

```tsx
function Value({
  value,
  field = "",
  raw = false,
}: {
  value: unknown;
  field?: string;
  raw?: boolean;
}) {
  if (typeof value === "string") {
    return raw ? (
      <span className="block whitespace-pre-wrap break-words font-mono text-xs">{value}</span>
    ) : (
      <>{bodyName(value)}</>
    );
  }
  // existing number/boolean/array/object branches
}
```

- For arrays, pass `field` through so nested numeric values can keep their degree symbol:

```tsx
<Value value={item} field={field} />
```

- If the raw text looks like a truncated JSON fragment (starts with `{` or `[` and ends without a closing token), add a short note beneath it:

```tsx
<p className="mt-2 text-xs text-muted-foreground">
  This recorded value was shortened when the chapter was saved.
</p>
```

- Do not pass raw text through `bodyName`; that is the source of the mangling.

Optional future-proofing (not required for this plan): replace the raw `.slice(0, 300)` in `featureFacts` with a bounded serializer that always emits valid JSON and a `truncated: true` marker. This would change model input and should be a separate, evaluated change.

#### 2.5 Add evidence tests

Add `tests/narrative-citations.test.mjs`:

- non-array inputs → `[]`;
- `null`, string, and array-with-null entries are ignored;
- invalid paragraph (0, negative, non-integer) is dropped;
- missing or non-array `facts` is dropped;
- unknown fact IDs are removed;
- citations with no remaining facts are dropped;
- duplicate paragraphs merge facts and preserve order;
- duplicate fact IDs within a single citation (for example, `{ paragraph: 1, facts: ["N1", "N1"] }`) render once, without duplicate React keys;
- valid citations are returned sorted;
- `readableNarrativeCitations` is safe for malformed input and keeps unknown IDs.

Extend `tests/pattern-chapters.test.mjs`:

- corrupt cached citations with `[null]`, `"bad"`, `{ paragraph: 1 }`, `{ paragraph: -1, facts: ["N1"] }`, and duplicate paragraphs;
- assert `getFeatureNarrative` remains available and returns only sanitized citations;
- assert no throw and no dead fact IDs for responses with `evidenceAvailable: true`;
- assert valid facts and prose remain unchanged;
- keep the existing plaintext legacy test passing unchanged, including its citation equality and unchanged stored-row assertions;
- add malformed legacy citations with one valid entry: structurally invalid entries are dropped, valid IDs are retained, `facts` stays empty, and `evidenceAvailable` stays false;
- contrast an envelope with `evidenceAvailable: true` and empty saved facts: all citation IDs are dropped;
- assert a generated chapter saves sanitized citations using a synthetic duplicate allowed fact ID within one model paragraph. The existing generation verifier already rejects unknown fact IDs; duplicate allowed IDs demonstrate that the new normalization actually runs before persistence.

Extend `tests/interface-review-fixes.test.mjs`:

- render `PatternChapterEvidence` with malformed citations and facts (cast the props in JS) and assert no throw;
- assert the valid citation still renders;
- assert empty citations plus retained facts render the “No paragraph source links…” sentence and “Saved source facts are listed below,” with the facts visible;
- assert citations entirely outside `paragraphCount` render that same empty state, without an empty ordered list;
- assert empty or rejected facts render “No saved source facts are available for this reading,” without the “listed below” promise or an empty fact list;
- assert saved-evidence empty states do not claim current calculated values are below, and the legacy `evidenceAvailable: false` branch still renders the current payload and older-reading limitation without source links;
- render a fact statement with truncated JSON and assert the raw text is shown verbatim, not passed through `bodyName` (for example, `north_node` must not become `North Node` inside the JSON fragment).

Acceptance criteria:

- Malformed citations or facts never throw during server loading or component rendering.
- Valid citations remain linked; invalid or unknown ones do not become dead links.
- Duplicate paragraph citations merge.
- Empty-state copy reflects the in-range links and retained saved facts actually rendered.
- Truncated structured values render clearly and are not mangled.
- Legacy chapters retain structurally valid citation metadata and their verbatim prose without inventing saved evidence; their UI still renders current calculated values and limitation copy, not unsupported source links.

### Phase 3 — Accessibility (F5, F8)

#### 3.1 Add visible focus styles for evidence targets

Current file: `src/styles.css`.

Add:

```css
.pattern-evidence-target:focus,
.pattern-evidence-facts > li:focus,
.today-evidence-target:focus {
  outline: 2px solid var(--ring);
  outline-offset: 4px;
  border-radius: var(--radius);
}
```

Keep the existing `scroll-margin-top: 110px` rules. Remove or supersede the `:focus-visible`-only Today rule so programmatic focus from a pointer activation is visible too.

Optional cleanup: extract the duplicated focus/scroll behavior from `PatternChapterEvidence` and `TodayEvidence` into `src/components/pattern/evidence-focus.ts`:

```ts
export function focusEvidenceTarget(id: string) {
  const target = document.getElementById(id);
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: "start", behavior: "instant" });
}
```

Use it in both components. This is presentation-only and makes the behavior consistent.

#### 3.2 Correct heading hierarchy

- `src/components/pattern/ChapterNarrativeState.tsx` (extracted from `PatternChapter.tsx` in Phase 1): change the Pattern Plus upsell from `<h3>` to `<h4 className="font-serif text-xl font-medium">`. Explicit weight 500 preserves the current appearance after losing the base `h3` weight.
- `src/components/pattern/PatternChartDetails.tsx`: change connection group headings from `<h4>` to `<h3>`.
- `src/styles.css`: update `.pattern-connection-group h4` to `.pattern-connection-group h3` and add `font-weight: 400` to that rule. Preserve its existing serif family and `1.125rem` size; the explicit weight overrides the base `h3` weight of 500.
- Keep the resulting family, size, weight, and spacing unchanged. Tag changes alone do not preserve typography: the base `h1`–`h3` rule sets weight 500, whereas `h4` otherwise inherits weight 400 here.

Verify the resulting outline:

- Pattern page: `h1` “Your pattern” → `h2` “Your chapters” → `h3` chapter title → `h4` “Continue this chapter…” and `h4` “Facts behind the wording” → `h5` fact labels. “Behind this chapter” is a `<summary>`, not a heading.
- Chart details: `h2` “Chart details” → `h3` connection group headings.
- Today evidence: `h2` “Sources behind this reading” → `h3` evidence sections → `h4` subsections → `h5` fact labels → `h6` natal origin sub-block.

#### 3.3 Add accessibility tests

- Extend `tests/interface-clarity.test.mjs` to render `PatternChartDetails` with at least one aspect and assert `<h3>` group headings and no `<h4>` group headings.
- Render `ChapterNarrativeState` in the locked state inside `RouterContextProvider` and assert the upsell heading is `<h4>`.
- Add a browser case under `tests/helpers/mobile-ui/pattern-evidence.cases.txt` (and document it in `tests/helpers/mobile-ui/browser-cases.md`):
  - open a chapter;
  - open “Behind this chapter”;
  - activate “Paragraph 1” with a mouse click and with keyboard Enter;
  - assert `document.activeElement` is the paragraph target and `getComputedStyle(active).outlineStyle !== "none"`;
  - activate a fact link and assert the same for the fact target;
  - assert no focus outline appears on ordinary page load.
- In the same browser fixture at 390px and 1440px, assert `getComputedStyle` reports weight `400` for chart connection `h3` elements and `500` for the upsell `h4`. Compare font family and size with the pre-change captures; an SSR tag assertion alone cannot establish visual preservation.

Acceptance criteria:

- Activating a citation link leaves a visible outline on the target for both pointer and keyboard activation.
- No reviewed surface skips a heading level.
- The heading-tag changes preserve the existing typography, including weights 400 for connection groups and 500 for the upsell.
- Focus does not scroll behind the sticky header (`scroll-margin-top` remains effective).

### Phase 4 — Plain-language source clarity (F6, F9, F10)

#### 4.1 Use `plainAccuracy` consistently

- `src/components/pattern/TodayEvidence.tsx`:
  - import `plainAccuracy` from `@/lib/plain-engine`;
  - replace `todayPointLabel(natal.plan.lens.screen.accuracy)` with `plainAccuracy(natal.plan.lens.screen.accuracy)`.
- `src/components/pattern/today-view.ts`:
  - import `plainAccuracy`;
  - replace `todayPointLabel(recorded)` with `plainAccuracy(recorded)` in the U-fact parser.

Expected copy:

- `exact` → “Recorded to the minute”
- `near` → “Within about 15 minutes”
- `hour` → “Within about an hour”
- `unknown` → “Unknown · noon assumed”

#### 4.2 Add a plain degraded-reason helper

Add to `src/lib/plain-engine.ts`:

```ts
export function plainDegradedReason(reason: string | null | undefined): string {
  if (!reason) {
    return "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.";
  }
  const value = reason.toLowerCase();
  if (value.includes("not configured")) {
    return "High-precision positions were not configured, so this chart uses the in-app approximate engine.";
  }
  if (
    value.includes("http") ||
    value.includes("unreachable") ||
    value.includes("timeout") ||
    value.includes("did not respond") ||
    value.includes("fetch")
  ) {
    return "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.";
  }
  if (
    value.includes("omitted") ||
    value.includes("recognisable") ||
    value.includes("recognizable") ||
    value.includes("incomplete")
  ) {
    return "The Swiss Ephemeris service returned incomplete positions, so this chart uses the in-app approximate engine.";
  }
  if (value.includes("in-app") || value.includes("approximate")) {
    return "This chart was computed with the in-app approximate engine.";
  }
  return "This chart uses the in-app approximate engine.";
}
```

Use it in:

- `src/components/pattern/PatternChartSummary.tsx` — replace the direct `degradedReason` fallback.
- `src/components/pattern/EphemerisNotice.tsx` — replace the direct `degradedReason` fallback.

Do not render the raw `degradedReason` in reader-facing UI. Keep the raw value available on the server for logs or a future technical/admin view.

#### 4.3 Stop rendering dead parent links

In `src/components/pattern/TodayEvidence.tsx`, add a small `ParentLinks` helper:

```tsx
function ParentLinks({
  ids,
  byId,
  readingId,
  label,
  missingCopy,
}: {
  ids: string[];
  byId: Map<string, { id: string; statement: string }>;
  readingId: string;
  label: string;
  missingCopy: string;
}) {
  const unique = [...new Set(ids)];
  const available = unique.filter((id) => byId.has(id));
  if (!available.length) {
    return <p className="text-xs text-muted-foreground">{missingCopy}</p>;
  }
  return (
    <>
      <ul className="flex flex-wrap gap-x-4" aria-label={label}>
        {available.map((id) => (
          <li key={id}>
            <SourceLink id={todayFactId(readingId, id)}>{todayFactLabel(id)}</SourceLink>
          </li>
        ))}
      </ul>
      {available.length < unique.length ? (
        <p className="text-xs text-muted-foreground">
          Some parent sources were not retained with this reading.
        </p>
      ) : null}
    </>
  );
}
```

Use it for:

- `S1` published synthesis parents (already validated, but reuse for consistency);
- `P2` published chapter parents (`C1`, `I1`, `A1`);
- `N1` published natal lens parents (`natal.plan.lens.dependsOn`).

For the `P2` block, do not hardcode links without checking `byId`. For `N1`, do not map `dependsOn` directly. For `S1`, keep the existing validation and use the helper.

#### 4.4 Add copy/source tests

Extend `tests/today-evidence.test.mjs`:

- add a U fact `recorded birth-time accuracy is "hour" (about plus or minus 60 minutes)` and assert “Within about an hour” and not a standalone “Hour”;
- add an N1 fixture with `screen.accuracy: "hour"` and assert “Within about an hour · ±60 minutes”;
- add a P2 fixture with facts missing `A1` and assert no `href` to the A1 target and the “Some parent sources were not retained” message;
- add an N1 fixture with a missing `dependsOn` parent and assert no dead link;
- keep the existing S1 missing-parent test passing.

Extend `tests/interface-clarity.test.mjs`:

- test `plainDegradedReason` for:
  - `null`;
  - `"Swiss Ephemeris service returned HTTP 503."`;
  - `"Swiss Ephemeris service unreachable: fetch failed"`;
  - `"Swiss Ephemeris response omitted Chiron."`;
  - `"This chart was computed with the in-app approximate engine."`;
- render `EphemerisNotice` with a raw transport reason and assert the raw words (`HTTP`, `fetch`, `unreachable`) are absent.

Acceptance criteria:

- Reader-facing accuracy labels never say “Hour” or “Near” alone.
- Reader-facing degraded copy never contains HTTP statuses, transport errors, or raw exception text.
- No parent link points to a nonexistent fact target.
- Missing parents are stated plainly, and available parents remain linked.

### Phase 5 — Layout and robustness (F7, F11)

#### 5.1 Remove the dead chapter-toggle column

In `src/styles.css`:

- Change desktop `.pattern-chapter-toggle` from:

```css
grid-template-columns: 48px minmax(0, 1fr) 24px 16px;
```

to:

```css
grid-template-columns: 48px minmax(0, 1fr) 16px;
```

- Remove the `.pattern-chapter-index` rule block and its mobile `display: none` rule.
- Leave the mobile three-column rule unchanged.
- Confirm the toggle still has three children: mark, label, chevron.
- Confirm the chevron sits at the right edge with the same 16px gap as mobile.

Browser checks:

- 390px and 1440px: chevron aligned to the toggle’s right padding; no empty 24px gap.
- 320px with 200% root text: title/meta wrap without overlapping the chevron; no horizontal overflow.
- Reduced motion: no new animation.

#### 5.2 Guard `TransitSequence`

Current file: `src/components/pattern/TransitSequence.tsx`.

Replace the non-null chain with guarded resolution. Normalize both boundaries of every selected window before rendering any of them:

```tsx
const e = calculation.evidence;
const sample = e.scan.samples[1];
const componentId = e.componentIds[1];
const component = sample?.components.find((item) => item.id === componentId);
const contactIds = component?.contactIds ?? [];
const windows =
  sample?.windows.filter((window) => window.contactIds.some((id) => contactIds.includes(id))) ?? [];
const sequenceWindows = windows.flatMap((window) => {
  if (!window.ingress || !window.egress) return [];
  const start = Date.parse(window.ingress.at);
  const end = Date.parse(window.egress.at);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  return [
    {
      id: window.id,
      ingressAt: window.ingress.at,
      egressAt: window.egress.at,
      start,
      end,
    },
  ];
});
const firstWindow = sequenceWindows[0];
const lastWindow = sequenceWindows.at(-1);
const invalidContact = e.contactRanges.some(
  (contact) =>
    !Number.isFinite(Date.parse(contact.centralAt)) ||
    contact.civilDays.length === 0 ||
    contact.civilDays.some((day) => !Number.isFinite(Date.parse(day))),
);

if (
  !sample ||
  !component ||
  !firstWindow ||
  !lastWindow ||
  sequenceWindows.length !== windows.length ||
  lastWindow.end <= firstWindow.start ||
  invalidContact
) {
  return (
    <p className="mt-4 text-sm text-muted-foreground">The saved contact sequence is incomplete.</p>
  );
}
const start = firstWindow.start;
const end = lastWindow.end;
```

The count comparison is essential: if even one middle window is invalid, render the incomplete-sequence fallback instead of displaying a shortened sequence as complete. Use only `sequenceWindows` in the timeline, with `ingressAt`/`egressAt` for positions and widths. Use `firstWindow.ingressAt` in the “Window opens” row. Remove every unchecked `w.ingress!.at`/`w.egress!.at` read from the render path, including first/last-window indexing; validating only the outer bounds is insufficient.

An empty `contactRanges` array is allowed: keep the valid windows, render no exact-contact markers, and state that no exact contact was recorded. A retained contact with an invalid central timestamp or empty/invalid civil days uses the incomplete-sequence fallback so neither `percent` nor `timingDate` receives an invalid date.

Also guard the first-contact access in the “First exact contact” definition list:

```tsx
{
  e.contactRanges[0] ? (
    <dd>{/* existing first-contact copy */}</dd>
  ) : (
    <dd>No exact contact recorded</dd>
  );
}
```

Keep the early `if (calculation?.status !== "qualified") return null;` behavior for omitted calculations.

#### 5.3 Add layout and sequence tests

- `tests/transit-story-view.test.mjs`:
  - render `TransitSequence` with a qualified calculation whose `scan.samples` is empty or whose selected component has no windows;
  - assert no throw and the “saved contact sequence is incomplete” fallback;
  - start from the existing valid three-window fixture, remove the middle window's ingress, then its egress in a separate case; assert the fallback, no throw, and no partial timeline;
  - remove the first window's egress and the last window's ingress in separate cases, so both boundaries of every window are covered;
  - set a middle boundary to an invalid date and set one window's egress at or before its ingress; assert the fallback and no `NaN`/`Infinity` in rendered styles;
  - render a qualified calculation with empty `contactRanges` and assert the “No exact contact recorded” fallback;
  - retain a contact with an invalid `centralAt` or empty/invalid `civilDays` and assert the incomplete-sequence fallback without a date-formatting exception;
  - keep the existing valid-sequence tests passing.
- Browser case for F7 as described in 5.1.
- Optionally add a source-level assertion that `.pattern-chapter-index` is absent from `src/styles.css` and that the desktop grid has three columns. Prefer the browser/visual check; avoid brittle CSS string tests unless the team wants one.

Acceptance criteria:

- The chapter toggle has exactly three layout columns on every breakpoint.
- No unused `.pattern-chapter-index` rules remain.
- `TransitSequence` never throws on qualified-but-incomplete saved evidence; it renders a clear fallback.
- Every rendered window has two valid, ordered boundaries. A damaged middle window never becomes a partial timeline or an unchecked boundary read.
- Valid sequences render identically.

## 6. Test plan

### Automated tests

| Area                       | File                                    | Cases                                                                                                                                   |
| -------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Access helpers             | `tests/chapter-access.test.mjs`         | server-only expiry, omitted versus null expiry, past/invalid membership-only refresh dates, signatures, view-state priority             |
| Chapter server evidence    | `tests/pattern-chapters.test.mjs`       | malformed citations, legacy structural-only validation, known empty fact sets, duplicate IDs, generated normalization, prose unchanged  |
| Citation helpers           | `tests/narrative-citations.test.mjs`    | non-arrays, null entries, invalid paragraphs, missing facts, unknown IDs, within-citation and paragraph dedupe, sorting, shared parsing |
| Chapter evidence rendering | `tests/interface-review-fixes.test.mjs` | router-aware state SSR, final-range empty states with/without facts, truncated JSON, valid links, evidence/journal in every state       |
| Today evidence             | `tests/today-evidence.test.mjs`         | plain accuracy, N1 accuracy, P2/N1 missing parents, existing S1 behavior                                                                |
| Chart details/headings     | `tests/interface-clarity.test.mjs`      | h3 connection groups, router-aware h4 upsell render, `plainDegradedReason`, raw-reason exclusion; computed weights verified in browser  |
| Transit sequence           | `tests/transit-story-view.test.mjs`     | missing samples/windows, missing middle/outer boundaries, invalid dates, empty/invalid contact ranges, valid sequence regression        |
| Existing suites            | `npm test`                              | no regressions                                                                                                                          |

### Browser checks (Playwright CLI, synthetic fixtures)

Use the existing `tests/helpers/mobile-ui` harness and add `pattern-evidence.cases.txt`. Document its case IDs and commands in `browser-cases.md`; this tracked case file is required for reproducing the lifecycle and visual checks.

Provide explicit synthetic narrative overrides with `available`, `locked`, `accessUntil`, the matching chart cache key, paragraphs, retained facts, and citations. For omitted-expiry cases, actually omit `accessUntil`; do not substitute null, which has a different contract. The current default chapter fixture has `evidenceAvailable: false` and no citations, so it cannot exercise paragraph/fact focus links without this override. Use controlled request ordering and the exact counts in 1.3; they are required mounted-effect coverage in addition to the following visual checks.

Checks:

1. Pattern page at 390×844 and 1440×1000:
   - open the first chapter;
   - open “Behind this chapter”;
   - click “Paragraph 1” and a fact link;
   - assert the active element is the target and the computed outline is visible;
   - assert the page does not scroll under the sticky header.
   - verify connection headings are `h3` at weight 400 and the locked upsell is `h4` at weight 500, with family and size preserved.
2. Pattern page at 320×740 with 200% root text:
   - chapter toggle title/meta wrap without overlapping the chevron;
   - no horizontal overflow;
   - evidence values and links wrap.
3. Pattern page with reduced motion:
   - no focus/scroll animation regressions;
   - first asynchronous arrival has an attached ref and animates once with normal motion, zero times with reduced motion;
   - retained chapters do not replay arrival animation.
4. Today page:
   - open “Sources behind this reading”;
   - verify plain accuracy labels and degraded copy;
   - verify missing parent links are absent.
5. Timing/Today with a synthetic qualified transit episode:
   - valid sequence unchanged;
   - a missing middle ingress/egress and an invalid middle date show the fallback without a crash or partial timeline.
6. Pattern page across route navigation and access changes:
   - run every mounted access lifecycle case in 1.3, including both initial response orders, the cached-preview/still-locked two-request limit, unavailable explicit retry, and retained collapse/reopen request counts;
   - distinguish server-expiry truncation from membership-only revalidation using past, invalid, omitted, null, and future deadlines;
   - with failed, unavailable, and held initial writing requests, calculated values and the journal attachment remain reachable;
   - a changed-chart response never contributes its saved facts to the old page's chapter evidence.

Browser checks are CLI verification, not part of `npm test`. After the tracked case file is implemented, start the synthetic server from the repository root in a separate terminal:

```bash
node scripts/mobile-ui-fixture.mjs
```

Then use the available Playwright CLI (or the documented wrapper in `tests/helpers/mobile-ui/browser-cases.md`):

```bash
playwright-cli -s=pattern-evidence-chromium open http://127.0.0.1:4198/
playwright-cli -s=pattern-evidence-chromium run-code --filename=tests/helpers/mobile-ui/pattern-evidence.cases.txt
```

Repeat in a WebKit-configured session following the harness documentation. Inspect every returned assertion and error; a successful CLI exit alone is not a passing case.

### Reproducible qualification record

- Commit the actual unit fixtures and browser case file with the implementation. Do not substitute an unretained script, prose-only case list, or scalar simulation for mounted lifecycle checks.
- For each reported result, record the application/fixture revision, exact command or wrapper path, test/case ID, expected outcome, observed outcome, and relevant output. Browser records also include engine, viewport, clock setup, response ordering, and expected/actual chapter request counts from 1.3.
- Store sanitized browser output and selected screenshots under `output/playwright/reading-exploration-<revision>/`, with a source/fixture revision manifest, and link them from the verification summary. Keep Node-test and typecheck command output with the same review record.
- Mark checks that were not executed as pending. The baseline test results in Section 2 establish the current application baseline, not the correctness of the proposed snippets or future implementation.

### Commands

Run after implementation, once the new test and source files exist:

```bash
node --test tests/chapter-access.test.mjs
node --test tests/narrative-citations.test.mjs
node --test tests/pattern-chapters.test.mjs
node --test tests/today-evidence.test.mjs
node --test tests/interface-clarity.test.mjs
node --test tests/interface-review-fixes.test.mjs
node --test tests/transit-story-view.test.mjs
npm test
npx tsc --noEmit
npm run build
npx eslint src/lib/chapter-access.ts src/lib/narrative-citations.ts src/lib/pattern.server.ts \
  src/components/pattern/chapter-view.ts \
  src/components/pattern/ChapterNarrativeState.tsx \
  src/components/pattern/PatternChapter.tsx \
  src/components/pattern/PatternChapterEvidence.tsx \
  src/components/pattern/TodayEvidence.tsx \
  src/components/pattern/today-view.ts \
  src/components/pattern/PatternChartDetails.tsx \
  src/components/pattern/PatternChartSummary.tsx \
  src/components/pattern/EphemerisNotice.tsx \
  src/components/pattern/TransitSequence.tsx \
  src/lib/plain-engine.ts
npx prettier --check src/lib/chapter-access.ts src/lib/narrative-citations.ts src/lib/pattern.server.ts \
  src/components/pattern/chapter-view.ts \
  src/components/pattern/ChapterNarrativeState.tsx \
  src/components/pattern/PatternChapter.tsx \
  src/components/pattern/PatternChapterEvidence.tsx \
  src/components/pattern/TodayEvidence.tsx \
  src/components/pattern/today-view.ts \
  src/components/pattern/PatternChartDetails.tsx \
  src/components/pattern/PatternChartSummary.tsx \
  src/components/pattern/EphemerisNotice.tsx \
  src/components/pattern/TransitSequence.tsx \
  src/lib/plain-engine.ts
git diff --check
```

The earlier review reported pre-existing full-lint errors, but this plan review did not reproduce that result. If running `npm run lint`, record its revision, command output, and any baseline failures separately; scoped lint must pass for the changed implementation files.

Include an extracted `evidence-focus.ts` and the changed tests in scoped ESLint/Prettier commands. Format Markdown files, and use an explicit TypeScript parser when formatting the TypeScript-bodied `pattern-evidence.cases.txt`, following the surrounding harness files. The examples above do not replace checking every file actually changed.

For edits to this plan itself, run:

```bash
npx prettier --check docs/superpowers/plans/2026-10-23-reading-exploration-remediation.md
```

## 7. Implementation order and commit plan

Recommended order:

1. **Access and recovery** (F1–F3)
   - `chapter-access` helpers and tests;
   - `PatternChapter` refactor and presentational state tests.
2. **Evidence integrity** (F4, F12)
   - citation module and server sanitization;
   - `PatternChapterEvidence` hardening and raw-value display;
   - tests.
3. **Accessibility** (F5, F8)
   - focus styles and helper;
   - heading changes;
   - SSR and browser checks.
4. **Copy and source clarity** (F6, F9, F10)
   - `plainAccuracy`, `plainDegradedReason`, `ParentLinks`;
   - tests.
5. **Layout and robustness** (F7, F11)
   - CSS cleanup, `TransitSequence` guards;
   - tests and browser checks.
6. **Verification and release notes**
   - full tests, typecheck, build, scoped lint/prettier;
   - browser checks;
   - update this plan’s status and `roadmap.md` after merge.

Suggested commits (one PR is fine):

- `Fix chapter access and refresh recovery`
- `Validate saved chapter citations and evidence rendering`
- `Polish reading evidence accessibility and copy`
- `Remove dead chapter layout rules and guard saved transit sequences`

Do not force-push or rebase published Lovable history. Keep every commit in a working state.

## 8. Risks, tradeoffs, and mitigations

| Risk                                                                        | Mitigation                                                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cached full chapter remains visible during a membership outage.             | Only server-returned expiry permits local truncation. Membership fallback deadlines request revalidation while preserving the authorized text; record this stale-content tradeoff.                         |
| A stale membership poll says full while the server says preview.            | Server response wins; the preview and upsell remain.                                                                                                                                                       |
| A stale membership poll says preview while the server says full.            | Server response wins, including omitted/null server expiry paired with past/invalid membership expiry. Test both the pure helper and held/failed browser revalidation.                                     |
| Citation sanitization drops a legacy citation.                              | Structurally validate legacy metadata without filtering against absent facts; preserve the legacy equality test. Only evidence-bearing responses filter unknown IDs, including a known empty set.          |
| Heading changes alter CSS sizing or weight.                                 | Explicitly set connection h3 weight 400 and upsell h4 weight 500; preserve family/size and verify computed browser styles.                                                                                 |
| Empty evidence copy promises values that are absent or from another source. | Compute emptiness after paragraph-range filtering, refer only to retained saved facts, and test the no-facts variant without a false availability promise.                                                 |
| Removing the 24px grid column changes chevron alignment.                    | Browser check at 390/1440/320 and compare with the current mobile layout.                                                                                                                                  |
| `:focus` outlines appear on pointer activation.                             | Only evidence targets use `:focus`; these are programmatic focus destinations, so the outline is intentional.                                                                                              |
| `TransitSequence` guard hides a valid sequence.                             | Validate every selected window and contact date; reject a damaged sequence as a whole, while preserving the existing valid-sequence fixtures and empty-contact fallback.                                   |
| Cached preview survives a membership change while the chapter is unmounted. | Revalidate readable cached results on route remount, retain content during refresh, and test another-route membership updates before returning.                                                            |
| New access effect causes duplicate requests.                                | Enforce the 1.3 count table: cached-preview/still-locked remount permits exactly two requests, then none for unchanged polls. Failed/unavailable results consume pending changes without retrying writing. |
| Narrative-state extraction loses animation, evidence, or journal access.    | Define the response-derived type and ref prop; keep the hook and siblings in the owner. Use router-aware SSR for state coverage and mounted checks for ref attachment and one-time animation.              |
| Verification claims cannot be reproduced.                                   | Require tracked fixtures, exact commands, revision/engine/viewport identifiers, expected/actual counts, and retained output. Unexecuted checks stay pending.                                               |

## 9. Rollback

- Revert the remediation commits. No database migration or schema change is involved.
- Existing cached rows are not rewritten; legacy metadata receives structural validation only. Generated rows save normalized citations. Reverting restores the previous cast/save behavior but does not restore removed duplicates or invalid IDs in rows generated during remediation; prose and facts are unchanged.
- Access changes are client-side presentation plus query invalidation; reverting restores the previous membership gating without changing billing data.
- CSS/heading changes are presentation-only.
- If a specific fix causes a regression, it can be reverted independently by phase.

## 10. Definition of done

- [x] F1: Failed membership polls never blank or truncate a readable chapter.
- [x] F2: Server-authorized full chapters are not re-gated by stale client membership.
- [x] R4: Only server-returned expiry permits local preview; omitted/null server expiry with past/invalid membership dates passes helper and mounted revalidation tests.
- [x] R1: Cached readable chapters revalidate on route return, both initial response orders reconcile once, and unchanged conflicting results cause no fetch loop or automatic writing retry.
- [x] F3: Failed narrative refetches preserve the loaded essay with a non-blocking retry.
- [x] F4: Cached citations are validated/sanitized server-side and rendered defensively client-side.
- [x] R5: The existing legacy citation-equality and unchanged-row assertions pass; absent evidence is distinguished from a known empty saved fact set.
- [x] R7: Empty-state decisions use in-range citations; saved-fact availability copy matches the facts actually rendered.
- [x] F5: Citation targets show a visible focus outline for pointer and keyboard activation.
- [x] F6: Accuracy labels use `plainAccuracy` in Today evidence and saved U facts.
- [x] F7: Chapter toggle has three columns; dead `.pattern-chapter-index` rules removed.
- [x] F8: Heading levels are sequential in the chapter upsell and chart connections.
- [x] R6: Computed heading weights remain 500 for the upsell and 400 for chart connections; family and size are preserved.
- [x] F9: Reader UI maps degraded reasons to plain copy; raw transport wording is absent.
- [x] F10: P2/N1 parent links only target retained facts; missing parents are stated.
- [x] F11: `TransitSequence` handles incomplete saved evidence with a clear fallback.
- [x] R2: Both boundaries of every rendered window and every contact date are validated; damaged middle windows never render a partial sequence.
- [x] F12: Truncated structured facts render verbatim/clearly, not through `bodyName`.
- [x] R3: Calculated evidence and journal context remain reachable in every narrative state; changed-chart results never supply mismatched saved facts.
- [x] R8: `ChapterNarrative` is derived with a type-only import, SSR fixtures include router context, and the arrival ref is attached with one-time/reduced-motion behavior verified.
- [x] R9: Every isolated request-count case in 1.3 passes, including exactly two requests for a cached-preview/still-locked remount and no automatic follow-up after an unchanged-signature explicit writing retry.
- [x] New and existing tests pass.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run build` passes.
- [x] Scoped ESLint, Prettier, and `git diff --check` pass.
- [x] Browser checks pass at 390×844, 1440×1000, and 320×740 with 200% text; reduced motion and focus verified.
- [x] Mounted access lifecycle checks in 1.3 pass with recorded request counts and controlled response ordering; helper/SSR tests alone do not satisfy this gate.
- [x] R10: Checked-in fixtures and exact commands reproduce every reported qualification result; revision identifiers, expected/actual outcomes, and sanitized output are retained.
- [x] Billing calculations, generation policy, prompts, providers, and database schema are unchanged; the independent chapter-query timing and its one-request/no-automatic-writing-retry behavior are verified.
- [x] `DESIGN.md` updated if the focus/evidence or chapter layout guidance changes.
- [x] `roadmap.md` updated with the verification summary.
- [x] This plan’s status is updated from Proposed to Implemented with the working-tree revision and test results (Section 12).

## 11. Open decisions

1. **Non-blocking membership notice:** Recommend a small `role="status"` line in reading details when `membership.error` is set and a readable chapter is shown. It must not replace the chapter. If the team prefers no extra chrome, omit it; the server response remains authoritative.
2. **Expired access presentation:** For server-returned expiry only, recommend immediate local preview plus a server refetch. The full text was already delivered; the server denies future full responses. If the team requires an immediate lock screen instead, replace the preview with a locked notice and refetch. A membership-only deadline never invokes either local restriction.
3. **Raw degraded reasons:** Recommend server logs or a future admin/technical view only. Do not expose raw HTTP/transport text in reader UI.
4. **Unknown citation fact IDs — resolved by R5:** Remove unknown IDs from generated/cached responses with retained evidence. For legacy `evidenceAvailable: false` responses, structurally validate and retain IDs without inventing facts or exposing source links. Keep the client's “Source unavailable” fallback for inconsistent evidence-bearing props/test data.
5. **Chapter numbering:** Recommend no decorative numbering, consistent with `DESIGN.md`; remove the dead CSS rather than restoring an index.

## 12. Verification record (2026-10-23)

Application revision: `f7d1b37..adb20bc` (four implementation commits on the `f7d1b37` baseline). Fixtures and browser cases are checked in with the implementation.

### Node and static checks

| Command                                                      | Observed result                  |
| ------------------------------------------------------------ | -------------------------------- |
| `node --test tests/chapter-access.test.mjs`                  | 19 passed                        |
| `node --test tests/narrative-citations.test.mjs`             | 11 passed                        |
| `node --test tests/pattern-chapters.test.mjs`                | 14 passed                        |
| `node --test tests/today-evidence.test.mjs`                  | 12 passed                        |
| `node --test tests/interface-clarity.test.mjs`               | 9 passed                         |
| `node --test tests/interface-review-fixes.test.mjs`          | 30 passed                        |
| `node --test tests/transit-story-view.test.mjs`              | 13 passed                        |
| `npm test`                                                   | 1312 passed, 4 skipped, 0 failed |
| `npx tsc --noEmit`                                           | passed                           |
| `npm run build`                                              | passed                           |
| Scoped `npx eslint` on every changed source and test file    | passed                           |
| `npx prettier --check` on every changed source and test file | passed                           |
| `git diff --check`                                           | passed                           |

The TypeScript-bodied `pattern-evidence.cases.txt` is Prettier-formatted with `--parser typescript`; the trailing semicolon Prettier adds is removed because the Playwright CLI wraps the file as a parenthesized expression.

### Browser checks

Harness: `node scripts/mobile-ui-fixture.mjs`, serving `http://127.0.0.1:4198/`. Case file: `tests/helpers/mobile-ui/pattern-evidence.cases.txt`. Sanitized results and the Chromium runner are under `output/playwright/reading-exploration-f7d1b37/`.

- WebKit 26.6 (`playwright-cli -s=pattern-evidence-webkit run-code --filename=...`): 25 of 25 checks passed.
- Chromium 155.0.8059.12 (`node output/playwright/reading-exploration-f7d1b37/browser-chromium.mjs`, using the installed Playwright Chromium because this environment has no `chrome` channel): 25 of 25 checks passed.
- Viewports: 390×844 and 1440×1000 for focus and heading measurements; 320×740 with a 32px root font for toggle reflow. Reduced-motion cases use `reducedMotion: "reduce"`.
- Expiry cases install a controlled clock at `2026-10-23T12:00:00.000Z` and use `page.clock.fastForward`.
- Request counts (chapter requests only): `access-remount-unlocks` 1; `access-remount-stays-locked` 2; `access-initial-order` 2 in both response orders; `access-remount-preview` 1; `access-reconciled-polls` 2 with 0 after identical polls; `access-unavailable-remount` 0; `access-explicit-retry` 1 with 0 automatic follow-ups; `access-retained-reopen` 1 with 0 on reopen; `access-changed-chart` 1.
- Server expiry produced an immediate local preview while the held revalidation was pending, then restored the full server answer; membership-only past, invalid and future deadlines each revalidated once without truncation; an explicit null server expiry created no timer.

### Pending

- Chromium through the Playwright CLI's `chrome` channel was not executed because the channel is not installed in this environment; the bundled Chromium run above is the recorded Chromium result.
- Live billing, model-provider and member-database services were not exercised. All fixtures are synthetic.
