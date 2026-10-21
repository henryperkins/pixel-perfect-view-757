No actionable findings in the reviewed local F-01/F-03 changes.

Review scope: `src/components/pattern/RouteFocus.tsx`, root wiring, the TodayCheckIn border token change, mobile fixture parity, and the route-focus probe file. HEAD remains `8e0e5c933ab8bad2b3e186e70501ef8e31d82570`. No app files were edited by this reviewer. No suite/build, Git mutation, deployment, or plugin update was run by this reviewer.

Code evidence:

- `RouteFocus.tsx:11-24` records only PUSH/REPLACE, matches the rendered history key, clears pending state before acting, and excludes initial loads, unchanged paths, hashes, and history traversal. The installed TanStack history assigns a new key before notifying subscribers, and its client coordinator emits `onRendered` only for the acknowledged current transaction. I found no actionable stale-navigation race in this flow.
- `RouteFocus.tsx:25-35` preserves already-placed destination focus, including focus outside main, while moving abandoned body/document/source-chrome focus to the destination main. Both subscriptions are removed by the effect cleanup at lines 38-41.
- `src/routes/__root.tsx:128-130` places the observer above route-local Shell mounts; the mobile fixture mirrors that placement.
- `TodayCheckIn.tsx:469` changes only the resting border token. Existing focus and disabled styles are retained.
- Shell is byte-identical to its captured baseline: SHA-256 `fd00a682e3b3cf49f9a033c75a2145b1f176df6b4166a2741923ca92f96183c3` for both the current file and `source-before/src__components__pattern__Shell.tsx`. No diff exists for Shell, useNavigationMenu, or global styles.

Independent runtime checks passed **4/4 in Chromium 149.0.7827.55 and 4/4 in desktop WebKit 26.6**:

1. React destination `autoFocus` retains focus; main receives zero focus calls.
2. A destination layout effect can focus an input outside main; main receives zero focus calls.
3. A delayed Journal PUSH superseded by Timing renders only Timing and focuses main once. Releasing the stale Journal request preserves a newer deliberate Timing filter focus.
4. Back cancels a delayed Journal PUSH with zero main focus calls; the Today draft remains available. Native Back leaves BODY active in these runs.

Exact probes: `independent-review-probes.cases.txt`. Results: `independent-review-probes-chromium.json` and `independent-review-probes-webkit.json`; CLI transcripts are retained beside them. The two focus probes replace only the in-memory Journal component with small React components. The race probes gate only its in-memory `beforeLoad` with a manually released promise. Each case uses a fresh context. Pass-through focus instrumentation and an `onRendered` subscriber record behavior. No production route or source file is changed by these substitutions.

The initial Chromium probe script and transcript are preserved as `independent-review-probes-v1.cases.txt` and `independent-review-probes-chromium-v1.txt`. Its two failures were harness assertions: an unsuitable select never established deliberate focus, and the test incorrectly required native Back to preserve exact input focus. The corrected script first asserts focus on a visible enabled Timing filter and requires Back to avoid main focus while retaining the draft. Neither raw failure contained an additional main-focus call or stale rendered event.

The main regression file now also includes the implementer's direct REPLACE case at lines 60-67. I reviewed that addition; the implementer owns its execution/results.

Remaining limits: this is local Code/Render evidence with synthetic services. It does not qualify physical iOS/Android, OS keyboards/browser chrome, VoiceOver/TalkBack, SSR event replay/hydration under network delay, or real authenticated/member-service behavior. I found no actionable defect requiring an implementation change within the reviewed scope. The review browser session `pattern-focus-review20` is closed; other sessions were left running.
