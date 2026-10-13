# Offline diagnosis of the halted repair pilot

The repair baseline's Neptune request reached the application's 60-second abort deadline before response headers arrived. The captured evidence and six offline boundary probes support that diagnosis. They do not establish whether network transit, provider queueing, reasoning or generation caused the wait. No serving correction is substantiated by this investigation.

This follow-up examines the published implementation `9348a243e35b6af2ba1925a3265d0211f9a7bed4` and its halted campaign `1bdd2ec1-ea11-4051-9f39-03528177a0b8`. It compares the original pilot only at its distinct source `82efe38df4c5ee571d6c583de144498c93f596f1`. The original failed editorial review and the repair campaign's unavailable response remain historical evidence. This investigation makes **zero model calls**.

## What the comparison resolves

| Observation | Evidence and implication |
| --- | --- |
| Application timer fired | Neptune started at 21:45:54.360 UTC and aborted at 21:46:54.360 UTC. Headers, body, HTTP status, response ID and usage are null. Provider receipt of this failed request remains unconfirmed. |
| Workflow did not impose this deadline | `SyntheticEvaluationWorkflow` allows five minutes per case and zero retries. The separate 240-second fetch timer in the same file belongs to retention, not synthetic evaluation. The app stored a classified failure and halted the campaign. |
| Neptune worked in the original round | Original baseline completed in 24.400 seconds; original candidate completed in 25.971 seconds. Those used prompt 13 and the original fixture identity. They cannot replace the failed prompt-15 observation. |
| Payload growth is bounded | Reconstructed native Neptune payload increased from 9,932 to 11,097 bytes. The stored adapter request is 11,138 bytes, below its 65,536-byte limit. The four current requests have the same schema and system text. This excludes an application input-limit failure for these bytes. |
| Neptune facts did not change | Baseline configuration and facts are identical across rounds. Its user text differs only by the three reviewed prompt instructions. The technical Saturn case also changes T1 wording. Prompt growth is a hypothesis, not a measured latency cause. |
| Transport settings did not change | All 12 archived attempts request the same Gemini model, a 60-second deadline and `maxOutputTokens: 65536`, with no explicit thinking override. Eleven returned successfully; one is censored at the deadline. The observations do not constitute a controlled before/after latency experiment. |
| Successful reasoning usage is substantial | The three repair successes report 13,686 thinking tokens and 680 response tokens. That is 95.3% thinking among their generated tokens. It supplies no thinking measurement for the failed attempt. |
| Attempt disposition remains correct | The baseline halted after four attempts. No candidate requests, retries or replacement outputs followed. Conservative accounting stays $3.100932, including the full $2.80 unknown-result reservation; invoiced charges remain unavailable. |

Native payload sizes/hashes are reconstructed from the pinned adapter and verified against intercepted adapter fetches for all four repair cases. They are not raw live HTTP captures. Saved source and prepared requests match exactly in those checks.

## Offline verification

Run `node docs/reviews/content-draft-effectiveness/2026-10-13-timeout-diagnosis/diagnose.mjs`. The script verifies source/evidence hashes, compares all 12 archived attempts, prepares the four saved-baseline requests, checks the LOW/MEDIUM native controls, and runs the real language adapter against blocked-network fixtures. It rejects changes to the source files used for diagnosis.

| Mocked boundary | Recorded result |
| --- | --- |
| Immediate valid response | Accepted; headers and body recorded; signal not aborted. |
| Pending fetch before headers | Timeout; signal aborted; no headers/body/status. Matches the live failure's recorded boundary. |
| Headers received, body pending | Timeout; HTTP 200 and headers retained; no completed body. |
| Provider HTTP 504 | Timeout; HTTP 504/body retained; application signal not aborted. |
| Network exception | Network failure; no headers/body; signal not aborted. |
| Malformed response JSON | JSON failure; HTTP 200/body retained; signal not aborted. |

Each scenario makes exactly one intercepted Enterprise fetch and zero gateway failover fetches. All failure fixtures retain the deterministic template and full unknown-usage reservation. The probes shorten Node's timer to 25ms while verifying that the adapter requests 60,000ms. They test classification and cancellation paths, not live latency or workerd timing parity. Archived successful response text used as a mock fixture is never stored as a replacement pilot output.

## Next experiment, pending a new paid scope

Google documents `MEDIUM` as Gemini 3.8 Flash's default and permits `LOW`, `MEDIUM` and `HIGH`; it recommends lower thinking levels for latency-sensitive work. That supports **testing** an explicit LOW setting against MEDIUM. The actual effective thinking level is not reported by the captured responses, so the documentation does not prove the timed-out request's setting or cause. [Official developer guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash).

[The concrete proposal](next-experiment.json) declares four planned observations: the same saved baseline's Neptune and Saturn cases, each once at LOW and MEDIUM, at most four attempts and a new $5 conservative-accounting cap. Hold the model, source text, prompt, schema, input/output bounds and deadline fixed; change only the explicit thinking control. Record latency and usage alongside unblinded source checks, then prepare neutral packets for two fresh reviewers of any complete level pairs. One observation per case/level can guide the next decision but cannot establish reliability, broad writing qualification or the cause of the historical timeout.

The deployed controls are insufficient for that exact scope: the existing Enterprise experiment freezes 24 attempts over six different cases, and the four-case content comparison uses the member policy without a thinking override. A separate reviewed closed manifest and guarded campaign must be implemented before this proposal can execute. Do not repurpose either historical campaign or silently trim the 24-call plan.

Keep the 60-second serving deadline during the experiment. A longer timer would alter a second variable and increase the wait experienced by members without identifying the latency cause. A future setting change must be separately versioned and qualified against writing and cache/source identities before member serving changes. Both historical campaigns and existing release gates remain intact.

There is no scheduled campaign, new numeric paid authorization, content approval, activation or publication in this follow-up. The remaining allowance in the halted repair campaign cannot authorize this experiment. Aggregate provider latency/cancellation metrics for 21:44–21:47 UTC could add read-only context if available; without request IDs, attribution to the individual Neptune attempt would remain limited.

Evidence: [machine-readable diagnosis](diagnostic.json), [reproducible probe](diagnose.mjs), [validation and preservation](validation.json), [implementation review](implementation-review.md), [halted round](../2026-10-13-repair-pilot/README.md), and [release checklist](../../../superpowers/plans/2026-10-13-content-draft-effectiveness-checklist.md).
