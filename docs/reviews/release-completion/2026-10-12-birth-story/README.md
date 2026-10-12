# Birth save and existing-chart story recovery

Tasks 6–7 implement atomic birth/snapshot/features/profile/audit writes, owner-bound form revisions, and inline field/precision/support feedback. Calculation or write failure preserves the prior chart; stale or overlapping saves fail visibly. Today and Timing fence the captured birth revision through asynchronous work, including the member model call, without retry.

Missing legacy transit anchors recover independently from natal rescreening using the same bounded Swiss pipeline. A persisted lease and six-hour attempt backoff prevent duplicate work. Recovery merges only its metadata, verifies birth fingerprint/ciphertext before saving, preserves newer natal fields, and leaves historical readings unchanged. Corrupt present evidence fails integrity; unknown time and unqualified sources supply no story. Saved-only assistant readers never calculate. Operation timestamps/tokens stay out of reading identity.

Fresh review reproduced and closed old rescreen overwrite, failed-marker metadata erasure, stale Timing claims, duplicate failed central requests and active-lease takeover. Six added race regressions cover these and a held member model result; model attempts are not retried. Final checks: 653 tests, 651 passed, two existing skips, zero failures; typecheck, scoped lint, build, whitespace and ten rendered browser checks passed. Browser checks cover changed fields/source, unknown suppression, unchanged save, failure draft, stale form, explicit reload, 390px and reduced motion.

Main push/publication, live birth/legacy-chart checks and cleanup remain pending. Active content stays 0.7.1. No paid qualification or model request was made. Human writing sign-off, Google assistant acceptance, source-registry reconciliation and later product work remain separate gates.

Rollback application: 5bc7e4b6cab2995a8af8558bcbf5d18f60340683, deployment d1471321-9293-4240-88b0-fa3752f24d77. No migration or Worker deploy is required for this slice. Preserve chart/reading history on code rollback.
