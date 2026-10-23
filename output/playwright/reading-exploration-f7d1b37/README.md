# Reading exploration remediation verification

Baseline application revision: `f7d1b37` (`main`). The implementation and its fixtures are the working-tree change set described in `docs/superpowers/plans/2026-10-23-reading-exploration-remediation.md`.

## Contents

| File                         | Purpose                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `focused-tests.txt`          | Seven focused Node suites (108 tests)                                |
| `full-test.txt`              | `npm test` (1312 passed, 4 skipped)                                  |
| `typecheck.txt`              | `npx tsc --noEmit`                                                   |
| `build.txt`                  | `npm run build`                                                      |
| `scoped-lint.txt`            | Scoped `npx eslint` on changed source and test files                 |
| `scoped-prettier.txt`        | `npx prettier --check` on changed source, tests, styles and docs     |
| `webkit-results.json`        | Sanitized `pattern-evidence` browser results, WebKit 26.6            |
| `webkit-run.log`             | Full Playwright CLI output for the WebKit run                        |
| `chromium-results.json`      | Sanitized `pattern-evidence` browser results, Chromium 155.0.8059.12 |
| `browser-chromium.mjs`       | Runner for the tracked case file in the installed Chromium build     |
| `screenshots.mjs`            | Capture helper for the focused-evidence screenshots                  |
| `pattern-evidence-390.png`   | 390×844 chapter evidence with paragraph focus                        |
| `pattern-evidence-1440.png`  | 1440×1000 chapter evidence with paragraph focus                      |
| `source-checksums.json`      | SHA-256 manifest of the changed source, test and fixture files       |

## Commands

```sh
node scripts/mobile-ui-fixture.mjs
# In another terminal, with the Playwright CLI wrapper available:
playwright-cli -s=pattern-evidence-webkit open --browser=webkit http://127.0.0.1:4198/
playwright-cli -s=pattern-evidence-webkit run-code --filename=tests/helpers/mobile-ui/pattern-evidence.cases.txt
# This environment has no `chrome` channel for the CLI, so Chromium used the
# installed Playwright build through the tracked runner:
node output/playwright/reading-exploration-f7d1b37/browser-chromium.mjs
```

The runner accepts `PLAYWRIGHT_CORE_PATH` and `CHROMIUM_PATH` overrides; the defaults are the paths available in this environment.

## Browser results

Both engines passed all 25 checks. Viewports: 390×844 and 1440×1000 (focus, headings, evidence), 320×740 with a 32px root font (toggle reflow), and reduced motion. Expiry cases use `page.clock.install` at `2026-10-23T12:00:00.000Z`.

Recorded chapter-request counts: remount unlock 1; remount still locked 2; initial response order 2 in both directions; cached full with preview membership 1; identical polls after reconciliation 0 additional; unavailable remount 0; explicit retry 1 with 0 follow-ups; retained reopen 0 additional; changed chart 1.

## Pending

Chromium through the Playwright CLI's `chrome` channel was not run because the channel is not installed here. Live billing, model-provider and member-database services were not exercised; all fixtures are synthetic.
