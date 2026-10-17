# Fourth-pilot timeout: saved transport evidence

**The cause is unknown, and this revision does not change the provider, the 60-second deadline, the no-retry rule or the halt-on-timeout controller.** This note analyses saved receipts only. No provider or network call was made.

Run `8d5d7931-1040-4a93-9c28-164df447e337` sent four Gemini Enterprise requests about 2.3–2.8 seconds apart:

| Case | Request characters | Input / output / thinking tokens | Seconds to headers | Outcome |
| --- | ---: | ---: | ---: | --- |
| contact-only | 9,582 | 2,144 / 202 / 2,074 | 16.9 | 200, `STOP` |
| natal-only | 11,321 | 2,531 / 224 / 2,848 | 22.3 | 200, `STOP` |
| transit-only | 10,997 | 2,493 / 248 / 2,700 | 18.5 | 200, `STOP` |
| natal-and-transit | 12,736 | unknown (about 2,860 estimated input) | none | aborted at exactly 60.000 s |

What the receipts establish:

- The request is not streamed. In every successful attempt, headers and body were recorded at the same instant, so a response arrives only after generation, including thinking, has finished. A timeout before headers cannot distinguish long generation from provider queueing or a stalled connection.
- The fourth request was about 12% larger than the natal-only request that finished in 22.3 seconds. At the slowest observed rate (134.5 generated tokens per second), 60 seconds allows about 8,070 generated tokens, roughly 2.6 times the largest observed total (3,072). Input growth alone does not explain it.
- No status, response ID, reported model, finish reason or usage exists for the fourth attempt. Its actual cost is unknown. The $2.80 is the controller's conservative reservation, not a charge.

The revision-5 requests are about a third of the earlier size (estimated 780–1,205 input tokens versus 2,140–2,860) and carry far fewer competing instructions. That may shorten thinking, but it is not evidence about this timeout and is not claimed as a fix. A recurrence would still halt the run with the same reservation; see the [proposed next pilot](next-pilot-manifest.md).

Machine-readable figures and capture hashes are in [timeout-analysis.json](timeout-analysis.json).
