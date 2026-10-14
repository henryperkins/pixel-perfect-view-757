# Viewport audit evidence

2026-10-14 · **Render evidence only** · Chromium 155.0.8059.12 and desktop WebKit 26.6.

[Full audit, implementation details and device plan](../../../docs/superpowers/plans/2026-10-14-mobile-viewport-safe-area-audit.md) · [Incremental CSS/HTML/Shell patch](viewport-fixes.patch) · [Verification summary](verification-summary.json) · [Source checksums](source-checksums.json).

The patch starts from the already-modified working tree at the beginning of this focused audit, not from Git HEAD. It excludes the preceding mobile remediation and unrelated dirty work. Four production files changed; two fixture files were extended to render the real Toaster, Time travel, the real root not-found component and exact server-error HTML.

| Evidence                                     | Chromium                                                                 | Desktop WebKit                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Baseline route/menu/dialog/type dimensions   | [Before](before-chromium.json)                                           | [Before](before-webkit.json)                                         |
| Final route/menu/dialog/type dimensions      | [After](after-chromium.json)                                             | [After](after-webkit.json)                                           |
| Notification/nav overlap and hit targets     | [Before](toast-before-chromium.json), [after](toast-after-chromium.json) | [Before](toast-before-webkit.json), [after](toast-after-webkit.json) |
| Large text, last menu action, long URL/email | [Final checks](edges-chromium.json)                                      | [Final checks](edges-webkit.json)                                    |
| Principal journey                            | [Baseline](journey-chromium.json), [final](journey-after-chromium.json)  | [Baseline](journey-webkit.json), [final](journey-after-webkit.json)  |

Both engines have 72 normal route/viewport cases, 15 additional 32 px root-font cases, six menu measurements, three menu-end hit tests, four dialog measurements, nine font samples, five toast cases with 20 navigation hit targets, one long-URL/email case and five journey steps. Final dimensions have no horizontal document overflow. Menu ends and dialog bounds fit. Notifications clear fixed navigation by 16 px. The final journey has no artificial toast-dismissal wait; the baseline walk needed one.

Selected screenshots:

- Notification over navigation: [before](chromium-toast-nav-before.png), [after](chromium-toast-nav-after.png), [WebKit after](webkit-toast-nav-after.png).
- Server-error page at 320 px: [before](chromium-server-error-320-before.png), [after](chromium-server-error-320-after.png), [WebKit after](webkit-server-error-320-after.png). The full-page baseline capture is 328 px wide and 616 px tall for a 320×568 viewport; see JSON for the cause, rather than inferring it from the image alone.
- Enlarged-text menu's final action: [Chromium at 320 px](chromium-menu-end-320-text-after.png), [WebKit at 320 px](webkit-menu-end-320-text-after.png).
- Enlarged-text deletion dialog in landscape: [Chromium](chromium-delete-landscape-text-after.png), [WebKit](webkit-delete-landscape-text-after.png).

The fixture uses actual route/components/styles and synthetic services. It reads no `.env` and makes no member/model/billing/email request. The error fixture serves the production error HTML without inducing a production failure; its fixture HTTP status is 200. The React exception boundary's trigger was not exercised. Browser fonts load from Google Fonts. Root-font 32 px is a layout stress test, not actual phone zoom. The fixture's check-in persistence is synthetic, not live server proof.

Reproduce from the repository root with the already-installed dependencies:

```sh
PATTERN_MOBILE_UI_PORT=4199 node scripts/mobile-ui-fixture.mjs
```

Open separate Playwright CLI sessions for available Chromium and WebKit engines at `http://127.0.0.1:4199/`. Run these audit functions in each session, replacing `SESSION` with its name:

```sh
playwright-cli -s=SESSION run-code --filename=tests/helpers/mobile-ui/viewport-journey.cases.txt
playwright-cli -s=SESSION run-code --filename=tests/helpers/mobile-ui/viewport.cases.txt
playwright-cli -s=SESSION run-code --filename=tests/helpers/mobile-ui/viewport-toasts.cases.txt
playwright-cli -s=SESSION run-code --filename=tests/helpers/mobile-ui/viewport-edges.cases.txt
```

The local wrapper is `/home/ubuntu/.codex/skills/playwright/scripts/playwright_cli.sh`. Chromium used the installed executable `/home/ubuntu/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome`; WebKit used the installed Playwright engine. These functions use explicit 4199 fixture URLs and absolute screenshot paths under this checkout; adjust those paths if reproducing elsewhere. They must not be pointed at real accounts. Inspect the returned JSON, not only the CLI exit code. Read [general fixture instructions](../../../tests/helpers/mobile-ui/browser-cases.md) for the service boundary.

Verification commands completed successfully:

```sh
npm run build
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint src/components/pattern/Shell.tsx src/routes/__root.tsx src/lib/error-page.ts scripts/mobile-ui-fixture.mjs tests/helpers/mobile-ui/main.tsx
./node_modules/.bin/prettier --check src/components/pattern/Shell.tsx src/routes/__root.tsx src/styles.css src/lib/error-page.ts scripts/mobile-ui-fixture.mjs tests/helpers/mobile-ui/main.tsx
```

Real Safari tab layouts, toolbar transitions, safe-area insets, OS keyboards, physical zoom, VoiceOver/TalkBack and Home Screen standalone were not tested. LCP, INP and CLS are not measured. No release or production verification is represented here.
