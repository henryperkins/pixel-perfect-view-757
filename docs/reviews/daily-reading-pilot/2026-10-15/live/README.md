# Published editorial pilot — interrupted after one output

The application was committed, pushed, deployed, and verified at `c4847a6674fc918609b3d234f3326e61f29e9072`. The authorized pilot started once. It captured one accepted Gemini Enterprise response before Cloudflare's Workflow failed internally. The planned nine-output pilot is incomplete; the candidate remains inactive and unqualified.

- [Exact captured reading](captured-reading.md)
- [AI reader review](reader-review.md)
- [Offline source review and correction scope](source-review.md)
- [Final evidence export](captured-evidence.json), including the request, response, source plan, transport, validator result, and cost ledger
- [Frozen deployed plan](plan.json), [preflight](preflight.json), and [publication receipt](publication.json)
- [Cloudflare Workflow status](workflow-status.json), [administrative closeout receipt](run-terminal-receipt.json), and [access cleanup receipt](cleanup-receipt.json)

## Execution

Run: `a7b75991-14eb-422e-b892-3a6cfd9ca596`. Candidate: `0.9.0-editorial-pilot.1`, hash `ac78d4b47d8b0930f2b2d6d560948869284bbc032834a1c195d061a7a1f29cb4`. Plan hash: `a12441bd3778229bd8f746e39be2cb5bb67f3a730ff2d92108d1929b043d36fd`.

The budget was at most five model attempts and $5, plus four deterministic quiet outputs. Actual use: one model attempt, one saved output, and $0.0474 in conservative accounting, not an invoice. The other four model cases and all four quiet positions were not executed by this run. Existing offline quiet previews are separate evidence.

The provider request started at 07:21:18.558 UTC. Cloudflare recorded `WorkflowInternalError: Attempt failed due to internal workflows error` at 07:21:30.684, ending its first step (`case 0-1`). The already-started Gemini response finished successfully at 07:21:34.005: HTTP 200, finish reason STOP, 15,447 ms, response ID `7n7QatHuKomKl7oP9Kao0Qg`. The application persisted and accepted it. There was no reservation or request for position 1.

This establishes an internal Workflow failure and a successful first provider response. It does not establish the underlying cause of Cloudflare's internal error. No Workflow restart, evaluation-step replay, replacement campaign, provider retry, or provider switch occurred.

## Closeout

The app continued to show `running` because its status polling only reads saved application state. Stop was clicked once, moving it to `stopping`. With the Workflow already terminal, no callback remained to finish that transition. A guarded D1 maintenance update changed exactly this run's status to `error`, recorded the reason, and updated its timestamp. The guard required the exact operator, Workflow, plan hash, candidate mode, completed count, and sole captured position-0 result. This was administrative maintenance, not an automatic product recovery feature.

The final export's results and ledger are identical to the [pre-stop export](captured-evidence-before-stop.json). The temporary operator's admin role and session were revoked; password login remains disabled. Its disabled user row remains solely to preserve the evaluation records. The same browser was then redirected from `/content` to `/auth`, and the temporary browser was closed.

Active member content remains version `0.7.1`, ID `edcc53cf-d19a-415b-a8a2-a66040846b1d`, checksum `20b793acda524da945b07ec32b2ed795f31e273c533ff6b4e9c4f96ef821eeac`. No content release was published or activated.

## Writing result and next work

The captured body contains a useful observation about editing a point out of a message, but begins with catalogue prose and an orb measurement. Independent AI review rates its voice 3/5 and recommends revision. Automated acceptance did not establish the requested tone or semantic grounding. Human review remains open.

Before another paid pilot, resolve the old interpretation prose competing with the approved editorial material, and add a tested way to reconcile a terminal Workflow error without replaying a case. Preserve this campaign and its identities; any revised candidate needs a new frozen plan and explicitly bounded run. Do not score absent cases or activate this candidate from this partial result.

## Verification boundaries

Before publication, the implementation passed 939 tests with four skips and no failures, TypeScript, scoped ESLint, production build, 34 focused editorial tests after the final copy edits, and the zero-network preparation verifier. Hosted checks established the exact deployed source SHA, candidate/plan identity, one real provider response, retained exports, and revoked temporary access. None establishes member response, full-context qualification, or editorial approval.

The implementation source is `c4847a6`; any later evidence-only commit does not change which source produced this run. The preparation manifest remains historical offline evidence and is not rewritten as a completed live result.
