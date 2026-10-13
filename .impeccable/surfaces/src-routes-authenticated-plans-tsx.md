---
version: 1
slug: "src-routes-authenticated-plans-tsx"
primary_target: "src/routes/_authenticated/plans.tsx"
related_targets: ["src/components/pattern/MembershipSettings.tsx","src/components/pattern/AccountSecurity.tsx","src/routes/auth.tsx","src/routes/reset-password.tsx","src/routes/confirm-email.tsx"]
---

# Membership and account access

Mode: Operate. Members choose a test plan, recover their account, manage renewal, and connect a read-only assistant. Keep Pattern's existing Shell, Button controls, and chapter disclosure behavior.

## Direction contract

THESIS: Make account access and membership decisions understandable within the existing settings flow.

OWN-WORLD: Inherit warm paper, sage, Lora headings, restrained monospace prices, hairlines, and existing Button variants.

STORY: Understand trial and renewal terms, choose a plan, read full chapters, then manage access and identity.

FIRST VIEWPORT: Plans leads with a short explanation and trial terms, followed by two billing choices; settings begins with membership status and account security.

FORM: Precise local extension, no concept seed; parallel price sections collapse into a single mobile column.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Realized surface decisions

- Plans places trial and renewal terms between hairline rules before equal monthly
  and yearly sections. Prices use monospace; each section ends with a full-width
  Button. The two columns stack below the existing `sm` breakpoint.
- Context & privacy places membership status and renewal controls before email
  and password controls, followed by the existing context settings. Cancellation
  opens an inline confirmation that repeats when chapter access ends.
- Email & password includes a ghost "Check email delivery" Button. Delivery is
  fetched only on request, with no automatic polling; recent provider events,
  an empty result, or unavailable status appear inline beneath the controls.
- Sign-in, recovery, and email confirmation use a narrow, centered form within
  the signed-out Shell. Visible labels, inline status and error messages, and the
  existing Button variants carry each step and its route back to sign-in.
- This extension introduces no global visual rules or shipping imagery.
  `DESIGN.md` remains the accurate record of the inherited visual world.
