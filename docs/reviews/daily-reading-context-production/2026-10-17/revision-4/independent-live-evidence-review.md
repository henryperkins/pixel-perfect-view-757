# Independent revision 4 live evidence audit

**Evidence integrity passes; five-case coverage is incomplete and activation remains held.** This is an offline audit of saved hosted receipts, not a new provider or production database operation. No body was regraded here.

Run `8d5d7931-1040-4a93-9c28-164df447e337` halted after four attempted positions. Source `966d6cd33d3a7d685681749c8966e12ee7682cde` and frozen plan `c28e305c61b231033d96814da4d96ecc013f3749018d161c63852a9beeca5dbc` agree across deployment/pre-dispatch receipts, preview, saved ledger, database export and all four public case captures. Frozen material, brief, claims, source bundle, benchmark, adapter and runtime-fallback hashes match the reviewed committed bytes and request projections.

| Case | Attempt | Recorded outcome | Accounted amount |
| --- | ---: | --- | ---: |
| contact-only | 1 | Lossless model body; automatically accepted | $0.049808 |
| natal-only | 2 | Lossless model body; automatically accepted | $0.066502 |
| transit-only | 3 | Lossless model body; automatically accepted | $0.063946 |
| natal-and-transit | 4 | 60-second timeout; no body or usage | $2.800000 |
| synthesis-natal-and-transit | None | Not requested after controller halt | $0.000000 |

There are **three full lossless structured model-paragraph captures**, three unique response IDs, one stored unavailable timeout result and no fifth result. The fourth attempt began at `2026-10-17T10:05:13.352Z` and aborted at `2026-10-17T10:06:13.352Z`, exactly 60 seconds later, before any recorded headers or body. Its actual model, response ID and usage are unknown. The timeout cause is unestablished. The controller halted without a recorded retry or provider switch. Matching durable rows and the source's zero-retry/single-provider controls establish the recorded campaign boundary; no vendor-wide usage audit is claimed.

Known-usage reservation accounting is **180,256 micros ($0.180256)** for the first three attempts. The unresolved fourth reservation is **2,800,000 micros ($2.800000)**, giving **2,980,256 micros ($2.980256)** against the $5 ceiling. These are conservative accounting estimates, not an invoice or proof of the timeout's actual charge. `completed=4` counts stored dispositions, not four generated bodies. The corrected summary records three accepted, zero rejected drafts, one unavailable attempt and one unrequested case.

The recorded browser closure was at `2026-10-17T10:04:08.255286Z`, 125 milliseconds after the first request began. The first response and all three later request starts followed closure. That supports continued server execution after the browser closed, within the saved timestamp evidence.

All 153 historical tracked report/artifact files independently match pre-revision `02e32f5` bytes. Saved final receipts also match baseline fingerprints for three historical evaluation runs (`9ca91c115780d07f5aa9fa1433024de4cadc74ed21dfdbecaaa39197cbe5efe7`) and 15 results (`97652e7c7641c90b7c1dbef708797c30e1d5beceee690be19861609eb4e742f4`). The raw historical rows were not independently re-fetched or rehashed by this reviewer.

The frozen report scope explicitly says partial captures cannot qualify the complete set. No explicit requirement that a run be complete before separately qualifying a fully captured mode was found; the pre-dispatch process says to enable only qualifying modes. That textual inference supplies no new authorization, and missing/timeout modes cannot qualify. In this run the distinction does not alter the release decision: separate source review records three passes with zero unsupported claims, while separate blind reader review records zero passes. All three voice scores are 3 against the unchanged minimum of 4; transit-only also has meaning and distinctness below 4. This audit verified packet/body identity and score arithmetic without regrading the writing. **No individual mode qualifies.**

Final saved receipts retain the exact baseline active release with `writer_rollout=null`; neither authored nor model activation occurred. Temporary sessions and admin role are revoked, the profile is removed, and the disabled operator record remains solely to own the halted run and its four results. There are no operator birth/chart/Today/consent/cycle/context rows. Authenticated member proof is deferred because no generated mode qualified. No temporary authored policy, Today call or sixth uncached model request occurred or is approved by this report.

The final release report, verification summary and qualification aggregate agree with the exact capture, cost and review evidence. Whole-suite and build log hashes match the saved verification record; no tests or build were rerun by this evidence audit. The public database receipt matches the exact byte lengths and SHA256 values of the four stored result strings. The final HTTP 200 serving receipt retains the same source/deployment identity and expressly proves source identity only. Public and private session-cleanup receipts match, and the local storage-state file is absent.

The reproducible offline command was:

```sh
node /tmp/pattern-context-production-private-4-20261017/independent-live-audit.mjs
```

It passed all local assertions. Exact input, script and evidence hashes and the full verification limits are recorded in the companion JSON. All provider, network, production database, deployment and activation calls made by this reviewer: **zero**.
