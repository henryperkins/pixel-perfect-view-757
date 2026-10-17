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

## Current readiness before authorizing

The [source follow-up](source-fix-1/report.md) fixes both named omissions and records source passes on the changed compositions. Its exact current material hash is in the JSON; any future preview must bind these bytes and the exact reviewed commit. Authored evidence does not qualify generated readings.

- **Synthesis still fails the reader bar:** distinctness 3 and voice 3 on final wording. The synthesis-only paragraph proposal remains unimplemented.
- **Natal-and-transit now has a final-wording reader failure:** voice 3 because the formal exact chronology lacks a sufficient practical connection. The two natal-only bodies pass all reader dimensions at 4.
- **Source review passes on final wording.** Eight current authored bodies have matching source passes; six have matching reader passes. No final body is awaiting a reader verdict. The intermediate source failures and differing reviewer rulings are preserved in the follow-up.
- **Two runtime fallbacks still need revision before any natal activation.** Natal-only and natal-and-transit reuse benchmark wording without N1's `possible` and `free`; those bodies are unchanged here.
- **The five-case pilot remains deferred and unauthorized.** The existing thresholds, $5 ceiling, provider, deadline and no-retry policy remain unchanged. Fresh explicit authorization is required before any provider request or run-related deployment.
