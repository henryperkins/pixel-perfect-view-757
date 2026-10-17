# Independent production review

**Passed; no material concerns found in the captured production evidence.** This was a read-only review of the saved deployment, activation, member, database, reload, and export captures. No network request, provider call, or production mutation was made during this review.

The [deployment receipt](production/deployment.json) identifies app source `2bfa7b3f8e6ad13e2184249ebaf65160d353d2ff`. Its committed member route contains the reviewed authored-only `0.9.0` branch. The [activation receipt](production/activation.json) and captured database rows agree: `0.9.0` is active, and `0.7.1` remains stored and inactive. Recomputing the prepared bundle's canonical checksum gives `d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f`, matching staging, publication, and activation identities.

## Member result

Independently compared [member-reading.json](production/member-reading.json) and [member-proof.json](production/member-proof.json) with the raw Today, browser-reload, owner-export, and database captures:

- Reading `27676be2-2455-45f0-b1aa-57fa2b086617` selects `jupiter_trine_sun` and the exact reviewed entry `editorial-jupiter-trine-sun-technical`. Its headline, two authored paragraphs, and independent reflection match the bundle exactly.
- The body contains precisely those two paragraphs plus the existing birth-time uncertainty caveat. No generated replacement or extra editorial paragraph appears. Unknown time is recorded, angle claims are suppressed, the natal lens is absent, and the transit story is omitted.
- Both authored paragraphs cite `C1` and `I1`. `C1` identifies Jupiter trine natal Sun; `I1` identifies `soft:jupiter:sun`, depends on `C1`, and belongs to `0.9.0`. The saved editorial digest independently recomputes to `f29133048f815e8088ddedc4e2d53653391814342bdf04057a70b60a866b2e11`.
- One saved reading row has `language_mode: template`, no model, and `authored_editorial` / `skipped` / `attempted: false` with no request duration. Its body ciphertext field is nonempty; the editorial evidence is stored in `daily_writing_ct`, with authored paragraphs and reflection absent from clear language metadata. The successful owner export restores the encrypted reading and evidence.
- The first and reloaded reading objects and language evidence are deeply equal. Owner export restores the same body, paragraphs, reflection, and language evidence, with one reading and zero unreadable readings.

The configured Gemini model name remains in diagnostic policy metadata; it does not identify a completed request. The explicit no-attempt metadata agrees with the deployed authored branch. This review did not inspect provider billing logs.

The [Chromium screenshot](production/today.png) visually agrees with the captured headline, authored body, uncertainty caveat, and reflection. This is desktop render evidence at 1440×1000, not physical-device evidence. Its SHA-256 matches the proof receipt. Natal positions are disclosed as Swiss Ephemeris; current transit geometry is disclosed separately as the approximation engine.

## Scope and preservation

This proves one eligible synthetic account's actual hosted member path. It does not prove live delivery of all nine entries, default plain-tone changes, or member benefit; the broader routing coverage remains regression evidence. The authored text satisfies the earlier [editorial review](editorial-review.md).

The [cleanup receipt](production/cleanup.json) records removal of the synthetic session, role, profile, and reading while retaining the disabled operator, published draft, and two publication audit records. It also records unchanged historical pilot evidence and active `0.9.0`. Cleanup was performed by the release operator, not this reviewer.

Raw comparison inputs under `/tmp/pattern-release-20261017/` were pinned by SHA-256:

| Input | SHA-256 |
| --- | --- |
| `today-first.json` | `8b63df64bf0e11a49febe41d6fd6ee71c7988c3c0261691d086d9dc49ea1fd72` |
| `today-after-reload.json` | `5bf6e0cc99ce6e25f5821a5faec27d3d1419fd40b7721dc43d46718fd25f804b` |
| `exported.json` | `d72926ead52836eadfd0f4394262bc6e17e7848bb9b717d77c631f10d650fa40` |
| `live-db-proof.txt` | `ac3ae5e2804b5ffa7fb1c4d0ebe7628bfd08dabf03beb2ee7cabe24c9dacab1c` |
