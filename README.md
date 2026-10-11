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
