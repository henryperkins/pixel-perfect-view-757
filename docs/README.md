# Documentation index

Use the root guides for product intent and implementation guidance. Dated plans,
reviews and captures record what was proposed or checked at that time; they do
not establish current deployment, payment readiness or active content versions.

## Start here

| Document | Purpose |
| --- | --- |
| [Product](../PRODUCT.md) | Confirmed capabilities, audience and product constraints |
| [Application overview](../README.md) | Development, verification commands and reading implementation context |
| [Architecture rules](../AGENTS.md) | Invariants that changes must preserve |
| [Design](../DESIGN.md) | Visual direction and interaction conventions |
| [Roadmap](../roadmap.md) | Task status and recorded verification limits; old service blockers need fresh checks |
| [Reading integrity](../READING-INTEGRITY.md) | Reading safeguards and validation limits |
| [Reading evaluation](../READING-EVALUATION.md) | Synthetic evaluation and writing-review methods |
| [Assistant integrations](assistant-integrations.md) | Consent-scoped external assistant setup and access |

## Chart and relocation implementation references

These links point to source and tests, not additional user-facing guides.

- [Birthplace geocoding](../src/lib/place-geocode.server.ts)
- [Chart accuracy page](../src/routes/_authenticated/accuracy.tsx)
- [Relocation page](../src/routes/_authenticated/relocation.tsx)
- [Relocation calculations](../src/lib/astro/astrocartography.ts)
- [Relocation editorial interpretations](../src/lib/astro/relocation-editorial.ts)
- [Public chart comparison](../src/routes/chart-comparison.tsx)
- [Reference captures](../src/lib/astro/chart-reference.json) and
  [comparison calculations](../src/lib/astro/chart-comparison.ts)
- [Relocation tests](../tests/astrocartography.test.mjs) and
  [reference comparison tests](../tests/chart-comparison.test.mjs)

The independent reference cases measure specific numerical comparisons, not a
universal accuracy guarantee. Editorial line/crossing meanings remain distinct
from chart data; crossing bands do not certify traditional parans.

## Historical plans and evidence

Historical records remain in place to preserve links, provenance and exact-byte
captures. An unchecked item in an old checklist is not automatically a current
task, and a publication receipt proves only the release it identifies.

- [Reviews](reviews/): dated audits, screenshots, validation results, activation
  receipts and frozen captures.
  - [Membership audit — 2026-10-17](reviews/membership/2026-10-17-audit.md)
  - [Membership repair verification — 2026-10-17](reviews/membership/2026-10-17-repair-verification.md)
  - [Membership go-live check — 2026-10-17](reviews/membership/2026-10-17-go-live-check.md)
  - [Transit source qualification](reviews/daily-transit-story/source-qualification.md)
  - [Mobile review evidence](reviews/mobile-ux-pilot/)
- [Specifications](superpowers/specs/): feature designs from their named dates.
- [Plans](superpowers/plans/): implementation and review checklists, including
  [release completion — 2026-10-12](superpowers/plans/2026-10-12-release-completion-checklist.md).
- [Release artifacts](superpowers/releases/): candidate bundles and validation
  records, not a declaration of which content is currently active.
- [Original references](reference/): imported platform topology and source-registry
  material from the original v0.2 specification, not the current architecture inventory.
- [Root release plan](../RELEASE-PLAN.md) and
  [Today checklist](../TODAY-UI-CHECKLIST.md): planning/checklist context to read
  alongside later evidence rather than as a current service-health report.

Before changing a historical conclusion, check the current implementation and
obtain fresh authorized service evidence when live state matters. Do not rewrite
frozen captures or infer production status from local tests alone.