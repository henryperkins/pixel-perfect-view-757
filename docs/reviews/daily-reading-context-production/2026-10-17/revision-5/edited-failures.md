# Versioned edits of the saved fourth-pilot failures

**Authored edits of generated bodies, not generated qualification.** The original captures in [`revision-4/pilot`](../revision-4/pilot/) and the original benchmarks are unchanged; their hashes are rechecked by `tests/reading-context-structure.test.mjs`. Each edit cuts restated premises first. Where the first blind reader blocked an edit for a missing contact or a stock phrase, the fix is listed under other changes. Every edit passed the production validator through the intercepted pilot path.

## R3: `contact-only`

**Original capture** (body SHA-256 `dab6c4c330e3ba2cb927426b9fbc68299ef3f9bafa689f5a96aee8047a2dfb1e`):

> An extra check can look small beside a familiar task you've set an afternoon aside to finish. A familiar responsibility can need more effort than usual, and if the original task already fills the afternoon, that extra check still needs some of the same hours.
>
> If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. Moving the task to a later calendar opening with the extra check still included leaves that demand in place; if the original work already fills the afternoon, the extra check could stay outside the task.

**Edited** (body SHA-256 `4636315664d98daa4e10f8e84e964ae2f6905f89423d6606af802ec72e3f534b`):

An extra check can look small beside a familiar task you've set an afternoon aside to finish. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours.

Moving the task to a later opening only takes the check along with it, but the check could also stay outside the task.

**Cut**

- “A familiar responsibility” — Re-introduced the task already in view as an abstract responsibility; replaced by 'that task'.
- “If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit.” — Restated the mismatch already carried by the check needing the same hours, then announced the limit the final clause shows concretely.
- “calendar” — 'A later opening' is enough; 'calendar' added formality.
- “with the extra check still included leaves that demand in place;” — A formal restatement of what moving the task implies, with an unclear 'that demand' (reader round 1: voice 3); replaced by 'only takes the check along with it'.
- “if the original work already fills the afternoon,” — Repeated the full-afternoon condition a second time; the direction continues the condition stated in paragraph 1.

**Other changes**

- Added 'With Saturn squaring your natal Sun', so the extra effort has its stated contact (reader round 1: meaning 3 without it).
- 'the original task' and 'that extra check' became 'it' and 'the check' after first mention.
- Rewrote the last sentence as 'only takes the check along with it, but the check could also stay outside the task', so the direction reads as an option rather than a correction.

**Where each meaning now lives**

- `I1.effort`: “With Saturn squaring your natal Sun, that task can need more effort than usual”
- `I1.capacity`: “if it already fills the afternoon, the check still needs some of the same hours”
- `I1.calendar`: “Moving the task to a later opening only takes the check along with it”
- `I1.boundary`: “the check could also stay outside the task”

**What each sentence adds**

- 1.1: Observation: the check, the familiar task and its afternoon (unchanged).
- 1.2: Meaning: the contact, its possible extra effort and the conditional mismatch, once each.
- 2.1: Distinction and direction: rescheduling keeps the check; leaving it out changes the task.

## R2: `natal-only`

**Original capture** (body SHA-256 `4b6dddee3ee639132805b6b03d7c75f30ef59aafa7420a56cdbd9a5a4f293f2d`):

> An extra check can look small beside a familiar task, but as transit Saturn squares your natal Sun, a familiar responsibility can need more effort than usual. If the original task already fills the afternoon, an extra check still needs some of the same hours. If it's asking for more than the available hours can hold, what belongs in the task may need a clearer limit, and the extra check could stay outside it.
>
> If several projects compete for that same afternoon, exploring a few and choosing one may be separate stages. Following a few lines of curiosity may help one direction take shape. A page of notes can sit beside an open tab for another idea, holding it without promising it those hours while you choose which one to pursue.

**Edited** (body SHA-256 `4075a965243f5948fbba86ebf9e17dc8fa7df4728ab55f6659617ae0b4ecfb54`):

On a free afternoon, an extra check can look small beside a familiar task. As Saturn squares your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, anything added needs hours that are already spoken for.

If several possible projects compete for that same free afternoon, you may not need to choose between them yet: following a few lines of curiosity may help a direction take shape. A page of notes can hold them without promising them those hours.

**Cut**

- “, but as transit Saturn squares your natal Sun, a familiar responsibility can need more effort than usual” — The astrological clause interrupted the opening observation; it now begins its own sentence without 'transit', and 'a familiar responsibility' becomes 'that task'.
- “If it's asking for more than the available hours can hold, what belongs in the task may need a clearer limit, and the extra check could stay outside it.” — Restated the mismatch, announced the limit abstractly, and added a first keep-it-out move that the closing note repeats (reader round 2: distinctness 3).
- “exploring a few and choosing one may be separate stages.” — Said the same thing as the curiosity sentence that followed (reader round 1: distinctness 3); both are now one sentence.
- “sit beside an open tab for another idea, holding it” — Stacked a second image and a loose 'it' into the final sentence.
- “while you choose which one to pursue” — Repeated the choosing already carried by 'you may not need to choose between them yet'.

**Other changes**

- 'If the original task already fills the afternoon, an extra check still needs some of the same hours' became 'if it already fills the afternoon, anything added needs hours that are already spoken for', joined to the effort sentence, so the second paragraph's projects are among what the afternoon must hold.
- 'Following a few lines of curiosity may help one direction take shape' became 'you may not need to choose between them yet: following a few lines of curiosity may help a direction take shape', so curiosity is the reason not to decide rather than a call to spend the afternoon (reader round 2: direction 3).
- 'holding it without promising it those hours' became 'can hold them without promising them those hours'.
- Restored N1's published condition: 'If several projects compete for that same afternoon' became 'If several possible projects compete for that same free afternoon', and the opening now reads 'On a free afternoon', so the task and the projects share one free afternoon (independent source review: the generated wording dropped 'possible' and 'free' and put the competition in hours already spoken for).

**Where each meaning now lives**

- `I1.effort`: “that task can need more effort than usual”
- `I1.capacity`: “if it already fills the afternoon, anything added needs hours that are already spoken for”
- `I1.boundary`: “A page of notes can hold them without promising them those hours”
- `N1.curiosity`: “following a few lines of curiosity may help a direction take shape”
- `N1.stages`: “If several possible projects compete for that same free afternoon” … “you may not need to choose between them yet”
- `N1.hold`: “A page of notes can hold them without promising them those hours”

**What each sentence adds**

- 1.1: Observation: the check beside the familiar task on a free afternoon, without an interrupting clause.
- 1.2: Meaning: the contact, its possible extra effort and the conditional mismatch for anything added, once each.
- 2.1: Distinction: the natal possibility as a reason not to decide yet, under its own published condition.
- 2.2: Direction: the single optional limit; the projects are kept without the afternoon.

## R1: `transit-only`

**Original capture** (body SHA-256 `0c6862df582c84b47f67dc7941599ffb0c569f4dd91cb6c671323dcee7514c5d`):

> An extra check can look small beside a familiar task, but if the original task already fills the afternoon, that check still needs some of the same hours. A familiar responsibility can need more effort than usual, and if it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. This is the second of three calculated contacts; the first exact contact falls in September 2026.
>
> If an earlier way of handling the task no longer fits, this return offers a chance to try one smaller change to how you do it or where you stop. A stopping point could come before the extra check, keeping the adjustment focused on where the task itself ends.

**Edited** (body SHA-256 `1b9b8aca1d7c5acda76f13ca45fc3f7ff736c5dfe2f155e3c3e613a35bd66fee`):

An extra check can look small beside a familiar task. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours. This is the second of three calculated contacts; the first exact contact falls in September 2026.

If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a whole new plan: stopping before the extra check, for instance.

**Cut**

- “A familiar responsibility” — Re-introduced the task as an abstract responsibility; replaced by 'that task'.
- “, and if it asks for more than the available hours can hold, what belongs in the task may need a clearer limit” — Repeated the capacity premise in abstract words after the first sentence had made it concrete.
- “offers a chance to try” — A stock opportunity formula (reader round 1: voice 3); rephrased as 'you could use this return to try'.
- “to how you do it or where you stop” — Named the stopping point once in general terms before naming it again concretely.
- “A stopping point could come before the extra check, keeping the adjustment focused on where the task itself ends.” — Named the stopping point a second time and explained it a third; one concrete instance remains.

**Other changes**

- Moved ', but if the original task already fills the afternoon, that check still needs some of the same hours' after the effort claim, as 'if it already fills the afternoon, the check still needs some of the same hours'.
- Added 'With Saturn squaring your natal Sun', so the extra effort, 'calculated contacts' and 'this return' have a referent (reader round 1: meaning 3 without it).
- Rephrased P2's 'this return offers a chance to try' as 'you could use this return to try', keeping its condition and meaning.
- Added 'rather than a whole new plan' to state what 'smaller' is smaller than; this needs source review.

**Where each meaning now lives**

- `I1.effort`: “With Saturn squaring your natal Sun, that task can need more effort than usual”
- `I1.capacity`: “if it already fills the afternoon, the check still needs some of the same hours”
- `A1.chronology`: “This is the second of three calculated contacts; the first exact contact falls in September 2026.”
- `P2.adjustment`: “If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a whole new plan”
- `I1.boundary`: “stopping before the extra check, for instance”

**What each sentence adds**

- 1.1: Observation: the check beside the familiar task.
- 1.2: Meaning: the contact, its possible extra effort and the conditional mismatch, once each.
- 1.3: Calculated chronology, copied exactly, now right after the contact it counts.
- 2.1: Direction: what the return offers, one smaller change, with a concrete instance.
