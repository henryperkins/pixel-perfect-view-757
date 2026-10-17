# Remaining original release-validation cases

The original five-case run stopped after Mercury was accepted and Venus was rejected with a valid authored fallback. Its two attempts and $0.061926 conservative accounting remain intact. This continuation covers only the three original unattempted cases; it does not retry either attempted case or create a new budget.

The parent plan and ledger are pinned by exact file hashes. Original source hashes, request/input identities and captured accounting are rechecked. Combined limits remain five total provider attempts and $5 conservative accounting. The original runner, plan, ledger and results are never written.

`node scripts/continue-editorial-release.mjs --verify` performs only offline checks. `--run` explicitly attempts at most the three remaining cases in order. An exclusive continuation run.json lock prevents repeat execution. Completed model or validated authored-fallback outcomes allow progress; transport/usage uncertainty, local failure and budget exhaustion halt the continuation.

Completion with any fallback is labelled completed_with_fallbacks. Each output retains its acceptance/rejection diagnosis; authored fallback is never counted as accepted model prose. Production getToday and persistence proof remain separate.
