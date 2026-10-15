# Editorial pilot controls — local browser verification

Verified on 2026-10-15, 03:46–03:50 UTC, using the actual `EditorialPilotEvaluation` and shared `EvaluationCase` components in cached Chromium at 1280 × 900. Vite loaded no environment files. Every server function was replaced by a synthetic in-browser fixture; no application endpoint, member record, provider, deployment, or active release was accessed.

The [Playwright skill](/home/ubuntu/.codex/skills/playwright/SKILL.md) was followed via the locally installed skill and cached CLI. The wrapper's offline package lookup was unavailable, so the existing cached `@playwright/cli` executable was used directly. Browser routing allowed only the localhost fixture. All 168 captured static requests had origin `127.0.0.1:4197`; no dynamic requests occurred. Browser console: zero errors and zero warnings.

| Check | Observed result |
| --- | --- |
| Initial recovery | One synthetic fetch; Start disabled before preparation. |
| Explicit preview | One preview and zero starts; exact provider, model, candidate, five-attempt/$5 limits, source and plan hash displayed; Start enabled. |
| Explicit start | Exactly one start; the reviewed hash was checked by the fixture; run ID persisted under the user/version storage key; Start and Preview disabled. |
| Polling and stop | Active status polled through reads. One explicit stop retained a result and changed the displayed status to stopped. |
| Result rendering and export | Quiet result expanded in the existing viewer. Downloaded JSON contained `daily-editorial-pilot-evidence-1`, the saved run ID, one retained result, and the frozen plan in the ledger. |
| Saved-run reload | Reload recovered the same run and result; start count remained one. |
| Lost acknowledgement | Synthetic start stored a run, then threw. The panel recovered that run with one read; start count remained one. A later stored result appeared through polling. |
| Unknown start and reload | Synthetic start threw before a discoverable run existed. The persistent `pending` marker survived reload; Start and Preview stayed disabled and start count remained one. |
| Later manual recovery | When the fixture made the retained run available, Recover loaded it and replaced the pending marker with its ID; start count remained one. |

The three scenarios each used one simulated start, with zero real evaluation/model attempts. The fixture's plan source SHA was the explicit synthetic sentinel `ffffffffffffffffffffffffffffffffffffffff`; its plan hash was `732348c449d484d36a2d48006c71202b069bc5b345980ef74e72fb8b9342714c`. This identity belongs only to the local UI fixture, captured before the final quiet-repertoire copy revision; it is not a deployed or qualified plan. The rendered quiet-threshold result was unchanged by that later copy revision.

Verified UI source SHA-256 values:

- `src/components/pattern/EditorialPilotEvaluation.tsx`: `cc612b0a205b4905e5143bbce795ccc667c7ae455c890ac83e69ab8143c6398c`
- `src/components/pattern/ReadingEvaluation.tsx`: `a64a7cd2889f835ddcac3c0847f897a4d9e08c543f0a3b78924b50e005a46ccc`
- `src/routes/_authenticated/content.tsx`: `93e6d0ce83d07db26d08eb4f56b8e836be65c9c6b825a3243971711dd01c4edb`

No UI defect was found in these bounded interaction checks. This does not verify the deployed `/content` route, actual authentication, TanStack server-function transport, hosted Workflow behavior, real provider results, physical-device behavior, or accessibility with assistive technology. The temporary localhost server and named browser session were closed after verification; the synthetic fixture was removed.
