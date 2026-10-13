# Synthesis coverage and editorial matrix

The current freeze is `builtin-0.8.0-synthesis-r3`, canonical bundle SHA-256 `74ff431c504094711f6db6778ea0d03d0d5e4ff4035f5e67d70e0c5278fde187`, using `synthetic-daily-7` (50 fixed cases). [Candidate coverage](coverage-candidate-r3-synthetic-daily-7.json), [directed matrix](directed-pair-matrix-r3.json), and [0.7.1 comparison](coverage-0.7.1-synthetic-daily-7.json) are new artifacts; earlier v6/r2/source-freeze files remain historical proposals, with their own hashes and narrower fixture populations.

The candidate has 81 sources, 79 concrete non-wildcard sources and 112 directed rules. Fifty-five exact-aspect additions preserve their complete revised family mechanism/question. Positive aliases require both parent mechanisms and questions to match their recorded origin byte-for-byte. The 110 positive directions derive from separately reviewed ordered mechanisms; the two existing explicit independent directions remain. Source changes invalidate frozen pair decisions through both source and rule hashes. Possible/impossible classification cannot be silently changed by a decision import.

All 6,162 ordered concrete-source directions are enumerated: 110 positive proposals, two existing independent rules, 2,754 calculation/resolver-impossible directions and 3,296 pending semantic decisions. A same contact cannot supply two aspects, and exact precedence prevents family-level aliases from coexisting when all aspect slots are covered. Unmatched possible pairs stay pending; no blanket independence is approved.

The v7 candidate population yields 11 selected, one explicit independent, two unmatched and 36 insufficient plans. The same population under 0.7.1 yields ten selected, one independent, three unmatched and 36 insufficient. These are structural synthetic selection counts, not member coverage or prose qualification. Each positive direction has a source-bound frame in the separate inactive writing candidate.

AI source review approved frame authoring and separately reviewed compact sentences/questions. The later r3 conditional/question corrections received the core writing review. This does not complete the remaining matrix or establish human approval: `humanReviewCompleted:false` remains binding. Full matrix decisions and final writing qualification remain Task 12/13 gates.

Reproduce with new paths only:

```sh
node scripts/synthesis-coverage.mjs --bundle candidate --output NEW_COVERAGE.json --matrix NEW_MATRIX.json
node scripts/synthesis-coverage.mjs --bundle baseline --output NEW_BASELINE.json
```

The CLI uses checked-in synthetic plans and actual assembly without models, member data or physical ephemeris qualification. Existing paths are never overwritten; partial newly created outputs are removed if writing fails.
