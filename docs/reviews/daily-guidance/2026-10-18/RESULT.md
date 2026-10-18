# Daily guidance from calculations and consented context

The Today page now includes “Try this today” after the reading. A reviewed theme
from the exact published interpretation selects an original, practical suggestion.
Consented energy shapes its size; low mood can soften its framing. Consented sleep
or stress can supply an optional reflection question. A chosen life focus remains
a label, as promised by the existing consent description.

For example, the published 0.9.2 Jupiter–Sun interpretation supports expansion:

- Default: “Sketch a bigger version of one idea in three bullet points.”
- Consented energy 2/5: “Add one possibility to an idea you choose.”
- With consented stress 5/5, an optional question follows: “Given the stress level
  you recorded, how would you like to approach this step?”

These are local guidance examples, not newly generated member readings.

## Source and consent boundaries

Guidance binds to the returned reading's primary calculation, saved C1/I1 facts,
interpretation plan, and immutable content release. Qualified Swiss geometry is
used consistently with the displayed primary calculation. Source mismatches do
not receive published-source attribution.

All 27 sources in the published 0.9.2 bundle have either a reviewed theme or a
published reflection question. Untagged sources use that exact question with an
applicability condition. Low energy suggests beginning with one sentence. The
Jupiter–Sun expansion mapping is explicitly limited to its reviewed 0.9.2 copy;
future releases do not inherit that exception. A missing or unbound source gets
an openly generic suggestion.

Only current-day, valid, consented values shape guidance. Private notes are not
inspected for meaning. Personal context and guidance stay outside language-model
requests, persisted reading bodies, and assistant sharing. Guidance is rebuilt
for fresh and cached reading responses; the existing final consent and birth-data
fence still applies. Failed refreshes and stale-day responses hide the section.
A pending refresh replaces old guidance with an updating notice, including when
the refresh is waiting for a connection.

No additional provider call is introduced. The existing reading-cache behavior
can still regenerate base prose when a check-in changes; this change does not
redesign that cache.

“Why this suggestion” explains the published source and each context value
actually used. The privacy page and Daily check-in consent description explain
the use of energy and mood.

## Verification

Final checks passed: 1,197 tests passed, 4 existing tests skipped, no failures;
production build, TypeScript, scoped ESLint, formatting, and diff checks passed.

Unit and integration coverage checks source/release/geometry mismatches, cached
responses, publication during generation, consent revocation, member separation,
prior-day and invalid data, relevant score changes, harmless note edits, and the
actual 0.9.2 Jupiter and untagged Saturn sources. Independent editorial and
source/privacy reviews were performed.

The real Today route was rendered with synthetic services in desktop Chromium at
320px and 390px. The suggestion changes with consented energy, the disclosure
works with the keyboard, revoked context disappears, and there is no horizontal
overflow. Both themed guidance and the published-reflection fallback were checked.
Active and paused refreshes were also checked to withhold old guidance.
The test helper's missing service exports were restored so this existing route
fixture could load; no billing actions were exercised.

Browser evidence is in `output/playwright/context-guidance/` in the isolated
worktree. Command logs are under
`/home/ubuntu/.cache/pattern-context-guidance-20261018/`.

This is local synthetic verification. No fresh live account, provider request,
content activation, deployment, physical-device or screen-reader run was made
for this change. It does not establish that the suggestions are useful to each
individual member.
