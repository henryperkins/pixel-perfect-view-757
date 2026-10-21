# Design

Record of the incumbent visual world ("Scientific Editorial"), as implemented in
`src/styles.css` and `src/components/pattern/Shell.tsx`. This documents what exists;
it does not propose a replacement.

## Visual world

A field notebook printed on warm paper. Editorial serif prose for anything the user
reads as meaning, monospace for anything that is a measured value, hairline rules
instead of shadows and cards-on-cards. Restraint is the point: the interface should
read as an instrument's output, not a lifestyle product.

Anti-references: mystical gradients, starfields, glowing orbs, purple-on-black
horoscope aesthetics, oversized emoji, playful illustration.

## Tokens

All colour lives in `src/styles.css` as oklch custom properties mapped into Tailwind
via `@theme inline`. Components use semantic utilities only — never raw hex or
`text-white`/`bg-black`.

- Surfaces: `--background` warm off-white paper, `--card` a shade lighter,
  `--secondary`/`--muted` for quiet fills.
- Ink: `--foreground` warm near-black, `--muted-foreground` for secondary text.
- Accent: `--primary` botanical sage-green (oklch hue 155); `--accent` pale sage (oklch hue 138) for state chips and quiet highlights.
- Structure: `--rule` hairline for every divider and card border.
- Control boundaries: `--input` follows `--muted-foreground` in both palettes,
  keeping editable areas distinct from decorative hairlines.
- Evidence: `--evidence` / `--evidence-foreground` — the dedicated surface for
  provenance, calculated facts and technical disclosure blocks.
- `--destructive` for failure states only.
- `--scrim` warm ink overlay behind dialogs, sheets and drawers (`bg-scrim`), redefined
  darker for `.dark`.
- `--radius` 0.25rem. Corners stay nearly square; `rounded-sm` is the default.
- Dark theme tokens are fully specified under `.dark` in `src/styles.css`, though the live app currently renders in warm light paper. The root and `.dark` also set the matching native `color-scheme` for form controls.

## Typography

- `--font-serif` Lora — headings and reading prose (`.prose-reading`).
- `--font-sans` Nunito Sans — UI text, labels, controls, navigation.
- `--font-mono` JetBrains Mono — calculated values, hashes/checksums, engine metrics, timestamps.
- Technical labels: base `.technical` uses uppercase letter-spaced mono for instrument/telemetry readouts; `.flow-page .technical` softens this to Nunito Sans normal-case for narrative editorial contexts.

Rule: if a value came out of a calculation, measurement, or engine checksum, it is set in mono; explanatory labels and descriptive copy remain in sans.

Short notes that sit under a hero (the landing principles) open with a run-in lead:
`<b>` at weight 600 in `--foreground`, the rest of the sentence in `--muted-foreground`,
each note under a hairline rule rather than a typed bullet.

Headings `h1`–`h4` use `text-wrap: balance`; paragraphs, list items and definitions use
`text-wrap: pretty`. Explanatory text inside wide columns (Privacy, the Journal intro,
calculator notes and sources) stops at a 62ch measure. Placeholders use
`--muted-foreground` and hold examples only; "· optional" and privacy notes sit in the
label or help text.

## Layout

- Sticky blurred header with the Pattern wordmark, tagline, active-route underline
  and `aria-current`; hamburger navigation below `md`.
- Content pages use a three-part editorial grid on wide screens
  (`Rail` · article · secondary rail) and collapse to a single column on mobile,
  with the calculation rail moved below the content.
- `Rail` + `Field` carry calculation status: day, engine, precision, contract
  version, refresh time, row counts, time accuracy.
- Sections are numbered where a page has a sequence ("1 · Active windows").
- Wide tables become stacked rows on mobile rather than horizontal scroll. The natal
  placement table is the exception: it keeps a pinned first column and scrolls sideways
  inside a focusable, labelled region.
- Time travel controls wrap with enlarged text. Its date uses a full row when the
  heading container is narrow, while the date field retains room for the native value.

## Components and patterns

- **Action targets** — Button controls, including anchor-based `asChild` actions,
  keep a 44px minimum height and width. The brand home link keeps the same minimum
  height, and root recovery actions use Button.
- **Evidence disclosure** — collapsed "Evidence & provenance" region on the
  `--evidence` surface, listing celestial facts, orbs, phases and source lanes.
- **Cycle card** — plain-language sentence ("Saturn pressing on your Sun"), a
  strength chip (Major / Prominent / Background) and a phase chip
  (Building / Exact / Fading), then a mono line of exact values.
- **Timeline bar** — proportional opens · peak · closes track with a today marker.
- **Band picker** — 1–5 monospace squares for mood, energy, sleep, stress.
- **EphemerisNotice** — states precision and any degradation inline.
- **Disclosure marker** — every `<summary>` carries the shared `+` / `−` marker in a
  small sage circle (`.pattern-shell summary::before`).
- **Contrast ledger** (`/transit-chart-calculator`) — hairline table of topic ·
  sun-sign horoscope · Pattern, with the Pattern column on the `--evidence` surface
  and its figures in mono at `0.92em` of the surrounding text. Below 640px each row
  stacks into labelled blocks.
- **Worked steps** — numbered derivation on the `--evidence` surface: a label, the
  mono value right-aligned, and a one-line detail beneath. Values come from the same
  rule functions the app calculates with.
- **Native selects** — `appearance: none` with a lucide `ChevronDown` in `--primary`.
- States: `animate-pulse` skeletons with `aria-busy`, bordered `role="alert"` panels
  with Retry, and empty panels that explain why empty is a valid result.

## Motion

`animate-rise` on content entry, colour transitions on interactive elements. A worked
value that changes after an edit settles once with a brief colour change. Nothing
loops, nothing parallaxes, nothing celebrates.

## Copy rules

Sentence case. Plain language first, exact values one disclosure away. Phases are
named Building / Exact / Fading in the interface and kept as raw engine values
(`approaching` / `exact` / `separating`) in technical blocks. Never a promise about
outcomes.

Failure copy shows the server's member-written message, or the page's own recovery
sentence when the failure carries browser transport or runtime wording
(`userFacingError` in `src/lib/user-facing-error.ts`). It never claims an outcome the
client cannot know: an unconfirmed delete or reset says it "wasn't confirmed".
