Ceiling: proxy — Linux Chromium 155.0.8059.12 and Playwright WebKit 26.6. No mobile OS simulator, physical phone or person-driven assistive result.

## 1. Verdict

Applied the approved F-05 account-field contrast repair: six class replacements in three files. All 24 previously failing empty-field cases now pass in both themes/engines, plus 194 focused-state/reflow/pending/error assertions. The public frozen test build passes its account and route/save/recovery checks. F-05 is **implemented**, pending target qualification; F-04 and F-06 retain their earlier implemented status.

Mode: audit and fix, ordinary color change. Device-dependent fixes remain propose only; no new keyboard, viewport, gesture or history behavior was changed. User approval covered the stated repair, checks and non-production preview. Commit/push/production publication remain separate.

## 2. Coverage and substitutions

This is a scoped continuation of [the prior audit](/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T033356Z-de0858d7/audit-report.md). Its ten-area/seven-module assessment and all original finding evidence remain on their recorded builds. This continuation checks account form states and a new preview; it does not reclassify prior whole-journey checks as current passes.

- Current local checks: **218/218** (24 empty-field plus 194 state/reflow assertions).
- Current public preview checks: **56/56**, across both engines, including account contrast and isolated HTTP persistence/recovery.
- TypeScript, scoped ESLint/Prettier, full application build, frozen test-client build, five backend/geocoder checks and the changed-file detector passed. No full unit-suite result is imported from earlier work.
- Static/Node/browser capabilities were actually exercised. Physical device, mobile OS simulator, actual VoiceOver/TalkBack and field metrics remain unavailable.

Local test services and explicit themes/viewport stress are setup substitutions. Pending/error checks inject a 650ms rejected synthetic account call. Public tests run a frozen minified client with an isolated cookie/file HTTP backend and controlled acknowledgement loss. Native input fields, client validation, styles, router and encrypted draft client remain real. Production auth/email/password, Stripe, AI, Swiss calculations, database, SSR/hydration and deployed performance remain outside that evidence.

The public backend confirms production_services=false. Its served CSS hash matches the frozen manifest and all three patched source hashes match the workspace. The existing older birth preview/tunnel and unrelated services were left running.

## 3. Finding and fix

**F-05 · P2 · Observed · implemented.** Original Affects, low-contrast evidence and prior birth portion remain intact.

Changed files:

- [AuthPage](/home/ubuntu/pixel-perfect-view-757/src/routes/auth.tsx:107): sign-in/signup/request-reset fields.
- [AccountSecurity](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/AccountSecurity.tsx:195): current/new/repeated account fields.
- [AccountLink](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/AccountLink.tsx:99): reset-link password fields.

Each authored class uses the existing border-muted-foreground token. The patch does not alter parsing, validation, field purpose/autofill, passwords, account behavior or shared global styles. [Exact patch](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-account-fix-20261021T040046Z/account-fix.patch).

Empty border-to-fill contrast changes from **1.3934:1 to 5.6553:1 light** and **1.7864:1 to 6.3241:1 dark**; border-to-surround becomes **5.3832:1 / 7.0199:1**. Both exceed the 3:1 required boundary threshold. Focused/filled controls remain legible; pending submissions disable Submit, failed submissions retain values and allow retry. Widths 320/360/390/430, short landscape 667×375/844×390, root-font 16/32px stress and desktop 1280 were sampled for each account mode in both engines.

The current pre-fix failures are retained in red-chromium/webkit.json, corrected cases in green-chromium/webkit.json, and independent compiled-public-build samples in public-account-chromium/webkit.json. Old failed records are not erased or relabeled. The ledger helper cannot retire a baseline failure using only proxy passes; its incomplete/failed aggregate is distinct from the passing current fixed-build checks.

F-04 selected birth helper and F-06 signed-coordinate hint remain pre-existing implementations; no new source edit to either. Original F-06 mechanism scope is unchanged. Its old unexecuted placeholder-build device plans are archived intact; the newly provisioned build has new device check/regression IDs and no fabricated results.

## 4. Recommendations

Run the four primary device configurations first (Safari Compact/Bottom/Top and Android Chrome), then VoiceOver/TalkBack, recovery and measured-performance entries. Optional brand-link sizing and broader navigation polish remain separate. The pre-existing section-navigation edits were preserved; this turn does not claim their implementation or independent qualification.

## 5. Changes and preservation

Only the three approved account files were edited by this work. A private verified recovery archive and full initial file-hash inventory precede the patch. Existing dirty source, settings and editorial material were preserved. An unrelated one-line change to tests/helpers/mobile-ui/browser-cases.md appeared concurrently and was retained, not overwritten.

Build/source identity: base 10c87a1 plus approved uncommitted patch and existing dirty source. The frozen preview snapshots those exact files. No application commit, push, dependency upgrade or production deployment.

Impeccable 4.7.0 context was reused from this live session; account surface brief and craft floor were read. Scoped adapt/harden/polish checks, rendered inspection and changed-file detector executed. No independent critique/reviewer is claimed.

## 6. Reachable device handoff

**Open [the isolated preview](https://nvidia-romance-pod-extras.trycloudflare.com/__preview).** Direct forms: [sign in](https://nvidia-romance-pod-extras.trycloudflare.com/auth), [account settings](https://nvidia-romance-pod-extras.trycloudflare.com/privacy), and [reset-password form](https://nvidia-romance-pod-extras.trycloudflare.com/reset-password#token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa).

Build: **B-PHONE-ACCOUNT-20261021T040046Z**. Source/asset/backend identity: [manifest](https://nvidia-romance-pod-extras.trycloudflare.com/__preview/manifest). Health: [test-backend health](https://nvidia-romance-pod-extras.trycloudflare.com/__preview/health).

[Current ten-entry device script](/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T040046Z-3197b726/device-checks.md). Entries C-ACCOUNT-D01..10 replace C-CUR-D01..10 and retain the original browser/configuration/state requirements. Source and setup confirmations, partial results, notes and screenshot/trace fields are included. Native device entries remain not_run.

Preview accounts start automatically and remain isolated by browser cookie. Use test data. The control page provides light/dark selection, fresh account/onboarding reset, delay/failure/lost-ack controls and canonical saved test records. It supports the controlled local recovery checks; it does not demonstrate production storage or real authentication/password/email operations.

The preview and tunnel intentionally remain running for this handoff. [Operations and stop instructions](/home/ubuntu/pattern-mobile-previews/account-contrast-20261021T040046Z/operations.json). Temporary diagnostic browser sessions and the local Vite fixture are cleaned up separately.

## 7. Open questions and remaining verification

- Actual phone models, OS/browser versions, Safari tab layout availability, keyboard/locale, real safe areas/chrome and actual 200% behavior remain unreported.
- No actual VoiceOver/TalkBack, physical touch/gesture, tab-discard or hardware-performance result has been acquired.
- Account email/password methods intentionally return unsupported test errors. Real provider messages, actual password changes/session revocation, production storage and provider/calculation behavior need a separately verified environment.
- Production and field LCP/INP/CLS/TBT remain unmeasured. The static test client differs from deployed SSR and service wiring; a phone lab trace is not field data.
- The strict ledger is structurally validated, with baseline failures and unrun target requirements visible. No finding is called Verified from these proxy passes.
