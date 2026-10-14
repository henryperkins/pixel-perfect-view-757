# Mobile member flow browser checks

The fixture renders the application's real routes, Shell, styles, controls, draft controller and encrypted IndexedDB store. Authentication, member records, geocoding responses and server mutations are synthetic. It never reads `.env` or calls a model, billing, email or member backend. Google Fonts is loaded for representative typography. Results establish **Render**, not **Device**, evidence.

Start from the repository root with the existing installed dependencies:

```sh
node scripts/mobile-ui-fixture.mjs
```

Open `http://127.0.0.1:4198/`. `PATTERN_MOBILE_UI_PORT` can select another port; update the probe URLs to match. The fixture cache is local to `.playwright-cli/vite-cache`. Stop the server with Ctrl-C. Production bundles do not import this fixture.

Use an available Playwright CLI session in Chromium and another in WebKit. In the Codex environment, the existing wrapper is `/home/ubuntu/.codex/skills/playwright/scripts/playwright_cli.sh`; no project dependency was added. Open each session with its available engine configuration, then run these functions in order:

```sh
playwright-cli -s=mobile-chromium open http://127.0.0.1:4198/
playwright-cli -s=mobile-chromium run-code --filename=tests/helpers/mobile-ui/store.cases.txt
playwright-cli -s=mobile-chromium run-code --filename=tests/helpers/mobile-ui/review.cases.txt
playwright-cli -s=mobile-chromium run-code --filename=tests/helpers/mobile-ui/core.cases.txt
playwright-cli -s=mobile-chromium run-code --filename=tests/helpers/mobile-ui/advanced.cases.txt
playwright-cli -s=mobile-chromium run-code --filename=tests/helpers/mobile-ui/layout.cases.txt
```

The `.cases.txt` files contain the async function accepted by Playwright CLI `run-code`, rather than Node test modules. Use the wrapper in place of `playwright-cli` if it is not on PATH. A CLI success exit alone is insufficient: inspect every returned `passed`, any `error`, overflow dimensions, font measurements, focus bounds and reduced-motion result. `core` resets only the synthetic `mobile-audit-member` draft records and fixture session state. Other destructive cases use fresh, isolated browser contexts. Do not run these probes against a member site.

| Probe      | What it establishes                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`    | Real IndexedDB/Web Crypto transaction, reopen, account separation, content CAS, two-tab conflict after consent rewrite, expiry, non-extractable key, ciphertext sentinel inspection, damaged-record isolation, consent stripping in values/baseline/submission, and discard/purge while encryption is paused. |
| `review`   | Immediate login cache refresh, root survival with blocked sessionStorage, Today discard, two-tab clear/reactivation, synthetic quota failure, and blocked IndexedDB fallback.                                                                                                                                 |
| `core`     | Today → check-in → save → Journal first at 390×844; navigation/reload, slow save, journal read-only pending fields, lost acknowledgement without duplicate, deletion Back/focus, editor recovery, membership focus, input purposes, selection state and stale geocoding.                                      |
| `advanced` | Uncertain Today save with later edits, dated prior-day recovery, account switching, missing-create retry with original operation, edit retry retaining newer text, failed/pending/direct-link deletion, birth-edit manual coordinates, and focus revalidation without BroadcastChannel.                       |
| `layout`   | Eight routes × six normal viewports plus three 32 px root-font stress viewports; page width, nav-label overlap, editable text, landscape Timing position, keyboard focus bounds, an unbroken saved URL and reduced motion.                                                                                    |

Normal viewports are 320×568, 360×800, 390×844, 440×956, 667×375 and 844×390. Root-font stress uses 320×568, 390×844 and 667×375. Doubling the root font is not physical-phone zoom. Programmatic Tab and focus bounds do not reproduce an OS virtual keyboard. Real toolbar, safe-area, keyboard/autofill, gesture, VoiceOver/TalkBack and performance qualification remain in the [completion checklist](../../../docs/superpowers/plans/2026-10-14-mobile-member-flow-completion-checklist.md).

The fixture's synthetic server keeps test records in sessionStorage solely to simulate a server surviving reload. This is separate from production's encrypted IndexedDB draft store. Inspect the latter database for the encryption cases; do not mistake the test backend for production draft persistence.

Sanitized results and selected screenshots are under [`output/playwright/mobile-member-2026-10-14`](../../../output/playwright/mobile-member-2026-10-14/). The source checksum manifest records the implementation and fixture inputs used for qualification. Request counts and storage fault results are synthetic; LCP, INP and CLS are **not measured** by these probes.
