# Revision 4 pilot qualification

**No modes qualify.** All three fully captured generated bodies pass the automatic capture and source gates, but fail the frozen reader gate. The fourth case timed out without a captured generated body; the fifth was not requested. Those two cases are ungraded, not examples of bad writing or passes.

Source SHA: `966d6cd33d3a7d685681749c8966e12ee7682cde`  
Run ID: `8d5d7931-1040-4a93-9c28-164df447e337`  
Plan hash: `c28e305c61b231033d96814da4d96ecc013f3749018d161c63852a9beeca5dbc`  
`qualifiedModes: []` · `humanReviewCompleted: false` · activation off · authenticated Today proof deferred.

## Completion and gates

The pilot is **incomplete: 4 attempts, 3 fully captured generated bodies, 5 planned cases**. The run’s `completed: 4` includes processing the timeout; it is not four generated bodies or five-of-five completion. There are three automatic acceptances, zero automatic rejections, one unavailable result and one unrequested case.

Qualification requires all of: automatic acceptance with lossless non-truncated generated capture; every reader dimension at least 4; source pass with zero unsupported claims and no omitted selected meanings; and context integration at least 4 where added context is applicable. Scores are not averaged. The frozen grades and thresholds are unchanged.

| Planned case | Blind label | Generated capture | Reader R/M/D/D/V | Source / unsupported / context | Qualification |
| --- | --- | --- | --- | --- | --- |
| contact-only | R3 | Accepted; lossless | 4/4/4/4/3; fail | Pass / 0 / N/A | Reader gate failed |
| natal-only | R2 | Accepted; lossless | 4/4/4/4/3; fail | Pass / 0 / 4/5 | Reader gate failed |
| transit-only | R1 | Accepted; lossless | 4/3/4/3/3; fail | Pass / 0 / 4/5 | Reader gate failed |
| natal-and-transit | — | Timeout; no candidate body | Not reviewed | Not reviewed | Unavailable; ungraded |
| synthesis-natal-and-transit | — | Not requested | Not reviewed | Not reviewed | Unrequested; ungraded |

Reader score order: recognition, meaning, direction, distinctness, voice. Contact-only has one selected interpretation, so added-context integration is not applicable. Its null context score is neither upgraded to 4 nor used to claim multi-source integration.

All three source reviews find zero unsupported claims and zero omitted selected meanings. Transit-only and natal-only earn context integration 4/5. That source-completeness judgment does not revise R1’s reader-level meaning/distinctness scores. The source reviewer separately flags natal-only’s explicit technical geometry despite `technicalDetails=false` as an editorial brief mismatch; the geometry is grounded, so it is not counted as an unsupported claim.

## Reader blockers

- **Contact-only / R3:** recognition 4, meaning 4, direction 4, distinctness 4, voice 3. Repeated capacity premises and explanatory restatement miss the voice bar.
- **Natal-only / R2:** recognition 4, meaning 4, direction 4, distinctness 4, voice 3. Immediate verbal repetition, an interrupted opening and a crowded closing sentence miss the voice bar.
- **Transit-only / R1:** recognition 4, meaning 3, direction 4, distinctness 3, voice 3. The return’s reader-level meaning is thin; repeated boundary explanations also miss the voice bar.

Exact quotation evidence and full rationales remain in the unchanged reader review. The controlled shared-contact scenes are not treated as consecutive days.

## Availability and operational decision

Natal-and-transit has `candidate: null`, diagnostic `unavailable/timeout`, and template fallback output. That authored template is not a generated body, and its final template-quality pass does not qualify generated writing. No reader or source score is assigned. Synthesis-natal-and-transit was never requested after the halt; it likewise has no score or quality verdict.

Activation remains off. No activation is performed by this qualification, and `qualifiedModes` is empty. Authenticated Today proof remains deferred. No temporary authored override is used to create proof. Both independent reviews are AI reviews; human review remains incomplete.

## Cost accounting

Accounted reservation/estimate total: **2,980,256 micros ($2.980256)**. The three captured attempts contribute 49,808 + 66,502 + 63,946 = **180,256 micros ($0.180256)**. The timed-out fourth contributes an unresolved conservative reservation of **2,800,000 micros ($2.80)**. No fifth request is represented. These are ledger estimates/reservations, not an invoice or verified final charge; `invoiceVerified` is false.

## Exact input hashes

The following SHA-256 values identify the evidence combined here. Capture bodies exactly match both their candidate paragraph joins and mapped blind reader bodies; their body hashes also match the independent grounding review.

| Evidence | SHA-256 |
| --- | --- |
| `summary.json` | `2ada4cc5072f4a1b9c0966a78524de8c63de5e19e514bc61f409399c09515fc3` |
| `run.json` | `5db4eef97691962ae7e621a8cba3a2853181f64c741939d9dd446ad37b3b64e9` |
| `captured-readings.md` | `5f408dc170903dd20e7ab5e40f4067da1651d35c523c640f231197f8fac15b0c` |
| `01-contact-only.json` | `e9895ca3c208b780df3dd988e81a9aaa6219d8b9913fbd17d50b6b4a1c38e1c6` |
| `02-natal-only.json` | `bfc0f78784ff681c13291ac49fd75a48dfd5795ec76ad08ed3a53ae0af44e67b` |
| `03-transit-only.json` | `a030dd8e15e3680f58f343724bbd50a78e37c5a3140b973574ebf25874670f84` |
| `04-natal-and-transit.json` | `ad92b4ba5dffa0c67db6f458bb2e7b9eb62faa822e0759fbc54bda2038d043b4` |
| `reader-review.md` | `9b2edcb4bd70a7566c25edb0757dcac00b38473124836f3fe80082a4d9150b9a` |
| `reader-scores.json` | `b7c5a829db19f417f941dfab1f95d9497ca6f590074207babb7b9a95ce1865ec` |
| `grounding-review.md` | `88af5f360c3468d5bf78d8c457260e12d5aab1e843ecd992b0d12009a3753404` |
| `grounding-scores.json` | `920e2e2acefd88103f758d5b3acf2d12cc8e8c9798ef3230b7736358afb3d7dc` |
| `reader-packet.md` | `910d431f821e3bf465740f9c93d7cad6756da7036a61c12d06cb77016f14f91c` |
| `source-review-packet.md` | `bcdcc124ad52e2d37d4479d095165c086fec11bff76dccb97887cf571868b9f2` |
| `blind-mapping.json` | `a5eab2a9aa93f31a993aa636158a4828015545ef33071d90e576dec92dc0c4ba` |
| `benchmark-readings.md` | `75258c2eabec3625cd49b72374c3fcdc4b2d2d769bd6b383403a77b4a6e6ebf2` |

| Case | Exact generated body SHA-256 |
| --- | --- |
| contact-only / R3 | `dab6c4c330e3ba2cb927426b9fbc68299ef3f9bafa689f5a96aee8047a2dfb1e` |
| natal-only / R2 | `4b6dddee3ee639132805b6b03d7c75f30ef59aafa7420a56cdbd9a5a4f293f2d` |
| transit-only / R1 | `0c6862df582c84b47f67dc7941599ffb0c569f4dd91cb6c671323dcee7514c5d` |

The reader packet, source packet and original authored standard hashes match the frozen reviews and capture summary. Frozen reader/source review files were verified unchanged before aggregation. No raw capture, prior review, source, benchmark or generated body was edited. This aggregation made no provider or network calls.
