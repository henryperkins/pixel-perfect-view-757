# Module 7 — Perceived Performance, Recovery & Mobile Polish

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use audit for source-supported risks, optimize for an evidenced bottleneck, harden for errors, concurrency, retry and recovery, and clarify for ambiguous status messages. Compare measurements under equivalent conditions; command completion does not establish a performance gain. Follow the actually installed skill for invocation and prerequisites.

## Checks

Audit the target's performance, perceived speed, and failure recovery under the audit contract.

Measure first if you can. Field data (CrUX, RUM) is the reference. Judge LCP, INP, and CLS at the 75th percentile, split by mobile and desktop, against the "good" thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. A Lighthouse navigation run reports LCP, CLS, and TBT. It can't measure INP, since nothing interacts with the page; report TBT as TBT. Scripted taps give a lab INP for those taps. One lab run doesn't establish field performance. Without field data, say so. Class each finding by its own evidence. Missing field data makes claims about real-user metrics hypotheses; it does not downgrade independent code or lab evidence. Other unconfirmed claims can also be hypotheses.

Check:
1. Images. `srcset` with width descriptors needs an accurate `sizes`; without it the browser assumes full viewport width. Serve AVIF or WebP through `<picture>` with a fallback. Set `width` and `height` or `aspect-ratio` on every image and embed. Don't lazy-load the LCP image; give it `fetchpriority="high"`. Lazy-load media below the fold.
2. Layout shift. Reserve space for anything that arrives late: images, embeds, banners, ads, and web fonts (`font-display`, metric-matched fallbacks).
3. Tap response (INP). Find long tasks after taps: heavy handlers, hydration, synchronous work before paint. Show visual feedback first, then yield or defer the rest.
4. Loading states. Use skeletons that match the final layout's dimensions. Show them only when loading takes long enough to notice, so fast responses don't flash. No full-page spinners for partial updates.
5. Optimistic UI. Only for low-risk, reversible actions (likes, toggles, reordering, drafts), with rollback and a visible error on failure. Never for payments, orders, or deletions.
6. Back and forward. Check back/forward cache eligibility, and record the actual reason for any miss (Chrome DevTools: Application > Back/forward cache). `unload` handlers are a common blocker. `Cache-Control: no-store` still blocks it in some browsers; since 2025, Chrome admits such pages unless cookies or authorization change, and keeps them for up to 3 minutes. Keep the cache headers the app needs. A page restored from the cache returns instantly with scroll position and input intact.
7. Failure and recovery. A failed request means that operation failed, or its outcome is unknown. It doesn't prove the device is offline.
   - Tell causes apart: HTTP and application errors (`fetch()` resolves on 404 and 500, so check `response.ok`), network failures, timeouts, and cancellation.
   - `navigator.onLine === false` can justify an offline hint. `true` doesn't prove the service is reachable.
   - Keep the user's input. Offer the recovery the cause calls for: retry, correct the input, sign in again, or check status.
   - Retry an action that changes data only when it's safe to repeat: idempotent by design, deduplicated by the server (an idempotency key), or confirmed not applied. After a lost response, check status before resubmitting.
   - Queue work only when it can be stored and replayed safely. A foreground queue in IndexedDB needs no service worker. Treat Background Sync as optional: it needs a service worker and has limited browser support.
8. Platform features, only where the flow needs them:
   - Web Share (`navigator.share`): call it from a tap and feature-detect. For files, test the actual payload with `navigator.canShare({ files })`, and fall back to download or opening the file, not copy-link. A resolved promise means the data reached the share target or the OS, not that it was posted or saved. `AbortError` covers both cancellation and no available targets, so treat it neutrally. Test dismissal, handoff, and the return to the page, and keep the user's selections and edited text.
   - Vibration (`navigator.vibrate`): Chromium-based Android browsers only; Safari on iOS and current Firefox don't support it. Never the only feedback.
   - Navigation flashes: set `background-color` on `html` and declare `color-scheme`. Add cross-document view transitions where supported.

Verification note
- Agent: lab LCP, CLS, and TBT under throttling; long tasks after scripted taps, and lab INP for those taps; image attributes and priorities; layout-shift sources; back/forward cache eligibility in Chromium; the app's share handling, with `navigator.share` and `navigator.canShare` stubbed.
- Agent, against a local or test backend, never production: error, timeout, and offline handling, by intercepting requests. For a lost response, let the backend apply the request, then fail it in the page.
- Field data: real-user LCP, INP, and CLS. CrUX includes only pages and origins with enough visitors, and only Chrome on Android and desktop, so it says nothing about iPhone users.
- Simulator or device: back/forward cache in Safari; tab discards; the real share sheet and the return to the page.
- Device: speed on real mobile hardware and networks, measured with Chrome remote debugging or Safari's Web Inspector.

Deliver findings and code per the contract. State each fix's expected effect as a direction ("removes the hero image's layout shift"), not an invented number. For actions with recovery findings, add a state table: pending, confirmed, failed, and outcome unknown, with what the user sees and can do in each.
