# Pattern

Pattern is a personal astrology and wellness app. It calculates natal charts and
timing windows, shows the facts behind its readings, and keeps an encrypted record
of reflection notes and journal entries.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pixel-perfect-view-757.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/16964b03-ff4a-4ee1-b4a5-76757e94bec3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Check-in verification

With Node.js 24 and the development dependencies installed, run:

```sh
npm run test:check-in
```

The regression suite runs the application's records client, check-in server code,
and encryption against a disposable local SQLite database initialized from
`d1/schema.sql`. It uses generated test keys and fixture accounts, forbids external
application requests, and removes the database when finished. It does not verify a
live signed-in account or modify production records.

`d1/schema.sql` is the bootstrap schema for fresh installations. `CREATE TABLE IF
NOT EXISTS` does not upgrade existing tables: check existing D1 columns before
applying equivalent schema changes. Today reads `daily_readings.language_mode`,
`language_model`, and `language_meta`; Journal reads `life_events.body_ct`,
`cycle_key`, and `feature_key`. These nullable columns are now declared in the
bootstrap schema. This update does not run a production migration.

## Reading verification

Run all local regressions, or just the reading and calendar checks:

```sh
npm test
npm run test:reading
```

Reading tests use the actual server, registry, encryption and SQL against disposable
SQLite storage. Model responses are intercepted fixtures; no live model, account,
ephemeris service or production database is called. Browser checks use isolated
fixtures with the actual page components.

Check-in bands and local-time context stay out of external language requests.
Consented context and reflection adjustments are assembled locally. The model
receives the same eligible cycles as the template, along with published editorial
references. Output checks enforce shape, citation coverage and bounded astronomical
contradictions; citation IDs do **not** prove arbitrary semantic support.

See [the reading integrity notes](READING-INTEGRITY.md) for the audit findings and
the remaining validation limits.

## Reading measurement

The admin Reading quality panel at `/content` reports the most recent 300 persisted
daily generation outcomes. New readings record bounded rejection codes and
prompt/validator versions in the existing `language_meta` field. Cached reads add
no observation. Attempt-based fallback rates exclude quiet days, missing primary interpretations, missing
configuration and rows without valid diagnostics; historical outcomes are not
guessed or regenerated. Gateway response bodies and exception text are excluded.

Admins can also choose **Run synthetic evaluation** in that panel to run the 28
fixed cases on demand using the production language pipeline and a chosen
evaluation copy: current active copy, the natal-free built-in baseline, or the
inactive natal candidate. Choosing a copy never publishes or activates it.
It makes up to 27 model calls and one quiet-day check, shows actual drafts and
fallback reasons, and downloads a report for before/after comparison. These
synthetic results stay separate from saved readings and live generation counts;
no birth record, check-in or private note is used. No production schema change
is required. Stop and partial-download controls preserve completed cases.

Numeric resonance scores appear in aggregate cohorts only while the reader's
separate **Reading quality feedback** source (USR-15) is enabled. Private saves
never enable it, and revocation excludes saved scores from future reports. Notes
and labels are not read. Cohort counts and coverage describe selected feedback,
not proof of writing quality.

```sh
npm run eval:reading -- --bundle natal-candidate --output /tmp/pattern-baseline.json
```

The [fixed evaluation guide](READING-EVALUATION.md) explains 28 synthetic cases,
explicit `--bundle builtin|natal-candidate` selection, offline candidate replay,
extraction and source-bound replay of downloaded reports, before/after comparisons,
and the AI writing-review lane that currently stands in for deferred human review.
Handwritten validator fixtures do not establish a live model fallback rate or a
quality score. No production schema change or model call is needed for this work.

## Daily reading synthesis

The strongest three eligible contacts each receive their published meaning when
copy exists. A deterministic plan selects at most one reviewed relationship between
the strongest two: tension or reinforcement produces `S1`; independent and unmatched
pairs retain separate meanings. Exact-aspect copy precedes family fallbacks, and
an active interpretation array is authoritative. Legacy releases inherit no new
built-in themes or pair rules. The model and template use the same selected graph.

The evidence panel distinguishes calculated cycles, published meanings, and published
synthesis. Saved `S1` evidence includes its exact text, rule, content version, and
`C1/I1/C2/I2` parents. Cached readings use their saved metadata; old readings and
feedback are preserved. Missing primary copy records `skipped/no_interpretation`
and returns the deterministic body without a provider request.

This implementation is a local release candidate. Actual-model baseline/candidate
runs on the v3 fixtures and blinded writing review remain pending. See the
[synthesis checklist](docs/superpowers/plans/2026-10-11-daily-reading-synthesis-checklist.md)
and [candidate manifest](docs/superpowers/releases/2026-10-11-daily-synthesis-candidate.json).

## Daily natal lens

The inactive local candidate `builtin-0.6.0` (schema 3) adds 60 individually authored
personal-body/sign possibilities and two compound Moon entries to the unchanged transit
copy. It is not the built-in fallback: without an active release, readings use
`builtin-0.5.0`, which has no catalogue, so deploying code never switches lenses on.
Publishing and activating the candidate as a release is the only switch.

One deterministic lens can qualify the primary cycle's practical distinction, and it
follows the day's contact. The transited personal body's own rules lead (service
aspect, then exact-time Placidus house, then sign); Moon rules in the same order are
the fallback when that body has no screened, published match. An empty or legacy
active catalogue stays authoritative.

Birth saves screen service positions at the recorded UTC time and the two declared
uncertainty boundaries (±2/15/60 minutes). Signs need a 1° boundary margin; exact-time
Placidus houses need a 0.5° cusp margin; aspects use unrounded service orbs and
geometry. This is a three-sample screen, not interval certification or a measurement
of temperament. Unknown time, degraded samples and missing copy omit the lens while
ordinary transit readings continue. While an active release carries a catalogue,
Today re-runs a missing, stale-version or retryably failed screen (the same three
service requests) before assembling the reading, at most once per six hours per reader
and never for an unknown time. Failed attempts change nothing but the attempt time.

Only the selected conditional meaning goes to the daily model as `N1`; selectors
and natal geometry stay local. Derived wording remains personal information. A
reading without a lens carries no lens instructions. Assessments,
selected copy and exact saved origins are DEK-encrypted. Cached and archived owner
reads, evidence links and exports restore the saved evidence; an export marks one
unreadable saved row in place instead of failing. Erasure removes the evidence with
chart/reading rows, chapter essays and the account key, and keeps no birth
fingerprint in the retained audit trail. Admin quality sees only IDs and bounded
codes. Prompt `daily-astro-body-8`, validator `daily-reference-5`, plan
`daily-natal-lens-2` and reliability `natal-reliability-1` preserve the one-call,
20-second daily budget and the separate natal essay/question contract.

The [catalogue review](docs/reviews/daily-natal-lens/catalogue-review.md) and
[local validation record](docs/superpowers/releases/2026-10-11-daily-natal-validation.md)
record implementation evidence. Independent editorial approval, actual-model paired
writing qualification, publication and deployment remain open.
