# Natal synthesis template fix and re-review

**The fixed synthesis template passes its targeted re-review. The lightweight writing
gate still fails** because three raw model drafts (duty, Moon fallback and synthesis)
remain below the gate. Revising them requires new model calls and an explicit operator
request. Both candidates remain inactive.

The [targeted subset review](../2026-10-12-lightweight-subset-review/README.md) failed
the natal synthesis template with coherence 3 and synthesis coherence 2. S1 appeared
alone as paragraph 2: its Jupiter–Mars parent never appeared, and neither contact was
named. Under the [lightweight policy](../lightweight-readiness.md), the fix is reviewed
only on the affected cases, plus deterministic regressions.

## Source change

Commit `9316cbf` changes `composeNatalTemplate` (`src/lib/content/natal-template.ts`) and
its caller. Paragraph 2 of a lens-plus-synthesis template now gives the Saturn–Sun
contact sentence, then the Jupiter–Mars contact sentence, then S1, all as published
copy:

> Saturn's square to the Sun highlights where expectations outpace available capacity,
> showing where a routine or responsibility needs clearer boundaries. Jupiter's trine to
> Mars frames moments when effort encounters little friction, making it natural to take
> on a larger piece of work or pursue an emerging opening. Giving a plan more scope can
> increase the structure needed to carry it. A task whose ambitions are growing beyond
> its agreed limits offers one place to notice that tension.

Selecting I2's contact sentence is bound to the exact published I2 and S1 text. Edited
or unfamiliar copy keeps every I2 sentence. With a selected transit story, the story's
bounded paragraph is kept, so S1 follows only the Jupiter–Mars sentence there.
Paragraph 1, N1's placement and the saved-reading contract (`consumedNatalTemplate`
reads paragraph 1 only) are unchanged. The live built-in bundle never selects a natal
lens, so its readings are unaffected.

Three new or updated tests failed before the change and pass after it. They cover the
exact paragraph for both synthesis cases, edited I2 or S1 copy, and the story path's
order. The application suite passes **508/508** with no skips. Typecheck, Prettier,
scoped ESLint and the production build pass; the build keeps its existing warnings.
Logs are under
`/home/ubuntu/.local/state/pixel-perfect-view-757/natal-qualification/20261012-synthesis-template/`.

## Deterministic regression

An [offline capture](template-capture-receipt.json) from clean commit `9316cbf`
regenerated all **114 template bodies** with fetch blocked and credentials removed (zero
model requests). It compared them with the round-3 capture. The
[capture helper](capture-templates.mjs) is the round-3 helper with only its revision,
comparison base and expected changes updated. It asserts the following:

- Exactly four bodies changed, all lens-plus-synthesis templates:
  `natal-synthesis-integration` and `arc-synthesis-natal-integration` in the natal and
  transit candidates.
- In each, paragraph 1 and any later paragraphs are byte-identical. Paragraph 2 is the
  previous paragraph with only its published parent sentences placed before it.
- Every built-in body and the other seven natal-positive bodies are unchanged. So are
  all facts, headlines, reflection prompts, configurations and the 38 suppression
  contexts.

[Templates](templates.json) `cdb7aca1…99dd`, tracked source `a1c6588c…33ed` (171 files),
helper `7cbdc634…3c96`.

## Re-review

One fresh AI context, `natal-synthesis-recheck`, reviewed the two changed natal-candidate
bodies. They have the same text and different facts: one contact is exact in 3 days,
the other exact today. The packet embedded the unchanged reviewer instructions and
masked citations, with no contrast or repetition sets. It said nothing about a fix or
an earlier judgment.

| Case                              | Scope                   | Score tuple   | Result |
| --------------------------------- | ----------------------- | ------------- | ------ |
| `natal-synthesis-integration`     | Lightweight subset case | 5/5/4/3/4/4/4 | Pass   |
| `arc-synthesis-natal-integration` | Affected outside subset | 5/5/4/3/4/4/4 | Pass   |

Tuples are specificity / grounding / voice / repetition / coherence / lens integration /
synthesis coherence. There are no substantive findings. The reviewer found both parents
now feed the supplied tension, with no invented joint premise and both contacts in their
roles. It left two non-gating clarity suggestions for later usefulness work:

- Restore N1's own order in paragraph 1, so it ends on the sampling-versus-choosing
  distinction rather than the curiosity premise.
- Signal the move into the synthesis so that “that tension” has a stated antecedent,
  for example “Taken together, the two contacts frame a tension: …”.

## Gate status

The subset review's original judgments stay unchanged. Counting the fixed template,
current samples pass **11/14: all seven templates and 4/7 raw drafts**. The quiet
template is safe and both duty/freedom contrasts are supported. The remaining failures
are the duty raw draft (lens integration 3), the Moon-fallback raw draft (“can offer”
strengthened to “offers”) and the synthesis raw draft (coherence and synthesis
coherence 3). Revised drafts need new model calls, which require an explicit operator
request, a separate output directory and truthful source identity.

The same fix also changed two **transit-candidate** bodies. They are recorded in the
[collection manifest](collection-manifest.json) and remain unreviewed; that candidate
needs its own small review. The live built-in synthesis template has a similar shape:
S1 follows I1, and Jupiter–Mars appears only in an “Also in range” line. It was not
changed or reviewed here.

## Provenance

- [Packet](packet.json) `e8915e27…625d`, item set `bdaca3df…837a`, two items.
  [Assignment](assignment-after-unblinding.json) and [manifest](collection-manifest.json)
  were written by [build-recheck.mjs](build-recheck.mjs).
- [Task text](reviewer-prompt.txt) `8d159bb3…72b0`, [full message](reviewer-dispatch-message.txt)
  and [dispatch record](reviewer-dispatch.json), dispatched 2026-10-12T04:49:29.941Z to a
  Claude Code general-purpose subagent, not a fork. It self-reports `claude-opus-5-5`,
  the coordinator's own model family.
- [Review](review.json) `9dd050f7…9e98` was frozen at 04:58:21.655Z
  ([receipt](reviewer-frozen-receipt.json)) before the coordinator read it or the
  checker opened the assignment ([unblinding receipt](unblinding-receipt.json)). No
  score or finding was edited.
- The [tool audit](reviewer-tool-audit.json) shows three calls: the reviewer read its
  packet, wrote its review and read it back. It read no other file and ran no command.
  It declared only its packet as input, naming the session environment context it was
  shown. The capture helper stayed outside the repository until the review was frozen.
- [check-recheck.mjs](check-recheck.mjs) applies the subset checker's item checks to
  this packet and wrote [the result](recheck-result.json) `ac8d37db…77a7`. Re-running
  it reproduces that file byte for byte. Seven offline fake-review checks confirmed it
  passes valid reviews, fails low scores and substantive findings, and rejects
  malformed artifacts.

This is an AI assessment of deterministic template prose, not human approval. No model
calls, provider, content bundle, account, cache, publication or deployment changed.
