# Daily synthesis local validation

Candidate: `builtin-0.5.0`, schema version 2. The adjacent candidate JSON contains
its complete bundle, SHA-256 publication checksum, source and rule keys, code
identity, and offline evidence. It is an inactive local artifact, not a persisted
or activated release. The adjacent rollback artifact retains the complete
pre-feature `builtin-0.4.0` source bundle; the actual production prior release has
not been inspected or altered. Signed ingest uses its existing HMAC protocol;
these artifacts use the admin inactive-publication SHA-256 scheme.

Node.js: 24.21.0. Dependencies were installed and reconciled with the existing
frozen `bun.lock`; no dependency manifest or lockfile was changed.

- `npm test`: 298/298 passing after independent-review fixes.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; no deployment was run.
- Lint on every explicitly owned code/test path: 0 errors, 0 warnings.
- Repository-wide `npm run lint`: failed with 7,554 errors and 6 warnings. The
  `d7a77f6` baseline has 7,558 errors and 6 warnings. Comparison of normalized
  file/rule/message/severity records found no new or changed failing files; the
  two edited release routes are now clean. Existing failures remain outside the
  owned paths, including checked-in skill scripts and untouched application code.
- `git diff --check`: passed.
- Offline `synthetic-daily-3` replay: 16 cases, 15 intercepted attempts accepted,
  one quiet-day skip. All human scores remain null; no external model was called.

Focused lanes ran for facts/language/diagnostics/request policy, persistence/cache/
privacy/quality, evidence rendering, content lifecycle, and synthetic evaluation.
New graph, citation, archive, and catalogue-contract tests were observed failing
before implementation, then passing. Full suite output is retained in this
plan's ignored `.superpowers/sdd` workspace.

Independent review found three lifecycle bugs and one evidence-label issue. Six
new regressions were observed failing, then the focused lane passed 27/27. Partial
legacy catalogues no longer inherit new theme approvals; empty graphs are rejected
before writes or activation; overlapping signed ingests reuse the winner or return
409; permitted rule keys with spaces display without their technical prefix.
The active-pointer workflow retains its existing two sequential updates; this
change does not add a transaction.

A second review found three more defects. Drafting asked the model to rewrite the
reviewed exact-aspect entries, so a complete reply removed every synthesis rule.
One repeated or over-length drafted entry discarded the whole draft. Retrying a
signed ingest after a failed activation returned success with no release active.
Drafting now requests only the family slots and drops unusable entries one at a
time. An identical replay that finds its row inactive now completes the activation.
Both new regressions were observed failing on the previous code. Afterwards,
`npm test` (299/299), `npx tsc --noEmit`, owned-path lint, `npm run build`, and
`git diff --check` passed. The candidate's `codeSha256` was recomputed with a
stated scheme because the original scheme was not recorded. Still open from that
review: check every production release against the stricter validator before
deployment, and add the affected keys, theme tags and rule relationships to the
admin draft preview.

Chromium inspected the actual `TodayEvidence` component and application CSS on
an isolated synthetic page at `http://127.0.0.1:5194/__synthesis`, at 1440×900 and
390×844. Keyboard Enter moved focus from paragraph to `S1` and all four saved
parent targets. Reduced motion was enabled; both widths had no horizontal
scroll overflow. The archived-boundary case retained four parent links and no
fabricated paragraph link. Console errors/warnings: 0. Screenshots and CLI
artifacts are in `/tmp/pattern-synthesis-ui`. This is component-fixture browser
coverage, not a live signed-in account check or mobile-device certification.

Actual-model baseline/candidate runs on identical v3 fixtures, separately pinned
code/content identities, and blinded writing scores remain pending. Selected
cases need at least 4/5 for specificity, grounding, and synthesis coherence, with
no unsupported substantive claims or invented personal events. Independent and
unmatched cases must invent no joint premise. Publication, activation, deployment,
and live-production verification remain pending. No production records, active
pointers, saved readings, or feedback were changed by this local qualification.
