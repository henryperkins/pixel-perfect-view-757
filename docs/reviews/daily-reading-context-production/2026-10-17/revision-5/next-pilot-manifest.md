# Proposed next pilot (not authorized)

**This is a proposal. It needs fresh, explicit authorization before any provider request.** The halted fourth campaign, including its unused fifth slot, stays closed. Nothing here, in the offline reviews, or in an earlier approval authorizes spend or activation. Exact identities are in [next-pilot-manifest.json](next-pilot-manifest.json).

## Scope

One run of campaign `daily-context-pilot-5` on case set `daily-context-1`, in order: contact-only, natal-only, transit-only, natal-and-transit, synthesis-natal-and-transit. It uses Gemini Enterprise, `gemini-enterprise/gemini-3.8-flash`, through the member production adapter and the Workflow. Transport is unchanged from the fourth pilot: a 60-second deadline, 65,536 maximum output tokens, provider-default thinking, no retry, no provider switch, and a halt on the first unavailable result.

## Budget

The ceiling is $5, with five attempts. Each attempt reserves $2.80 until complete usage arrives. It is then estimated conservatively at input × 2 + (output + thinking) × 20 micros. If all five complete, the expected accounting is about $0.20–$0.35. The fourth pilot's completed bodies cost $0.050–$0.067 each, with roughly three times the input. The worst case is about $3.10: four bodies plus one unresolved timeout reservation, after which the controller halts. These are reservations, not invoices.

## Before dispatch

1. Deploy the reviewed commit and confirm the serving identity. Record the full suite, TypeScript, ESLint and production build for that commit.
2. Confirm active release `0.9.0` is unchanged, `writer_rollout` is NULL, and no `daily-context-pilot-5` run exists. Confirm earlier context runs and results still match their fingerprints.
3. Preview the plan. It must show five cases, an attempt limit of 5, the $5 ceiling, Gemini Enterprise, and the material, brief, claims, writer, adapter and fallback hashes in the JSON. Start only with that preview's plan hash.
4. Grant temporary admin access for the run only, and revoke it afterwards.

## Gates (unchanged thresholds)

Every captured body must pass three separate gates.

- **Automatic:** accepted model output, captured losslessly.
- **Source:** an independent source review with zero unsupported claims, no omitted selected meaning, and context integration of at least 4 where more than one meaning applies.
- **Reader:** a blind reader review, frozen before any mapping, with recognition, meaning, direction, distinctness and voice each at least 4.

The two reviewers are separate, see only their own packets, and freeze before seeing each other's results. These are AI reviews; no human review is claimed.

A mode qualifies only on its own complete capture passing all three gates. Unavailable or unrequested cases receive no grade and cannot qualify. A partial run cannot qualify the five-case set.

## After the run

No activation happens in the pilot. Enabling any qualified mode, model or authored, is a separate authorized step: a new rollout policy row carrying this candidate's identity, then authenticated member verification.

## Known risks before authorizing

- **Synthesis is at risk.** No authored synthesis reference reached the reader bar in four rounds; distinctness stayed at 3. Its generated reading can still qualify on its own capture, and the other four modes do not depend on it. A narrow contract change for that graph is proposed in [structure-revision.md](structure-revision.md) and is not implemented. If one run should be able to qualify all five modes, defer this pilot until that proposal is reviewed; the candidate identity would then change.
- **Two compositions fail the offline source gate.** Natal-only omits I1's boundary on the task, and synthesis omits I2's "or pursue an emerging opening". Fix and re-review both before authorizing; the material hash will then change.
- **Four authored bodies were not re-read.** The source fix changed the natal-only reference and edit, natal-and-transit, and synthesis after their last reader review.
- **Two runtime fallbacks need revision before any natal activation.** The natal-only and natal-and-transit fallbacks reuse the original benchmark wording, which drops N1's "possible" and "free". They are not served while `writer_rollout` is off, and they are unchanged here.
