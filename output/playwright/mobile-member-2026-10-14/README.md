# Mobile member qualification evidence

Local implementation, 2026-10-14, based on `e8eee400592848033df1e36d3fef6a123ad9b5c8`. No deployment or physical-device result is represented here.

- [Completion checklist and real-device plan](../../../docs/superpowers/plans/2026-10-14-mobile-member-flow-completion-checklist.md)
- [Reproduce the synthetic browser checks](../../../tests/helpers/mobile-ui/browser-cases.md)
- [Commands and unit/build/typecheck/lint summary](verification-summary.json)
- [Implementation and fixture checksums](source-checksums.json)
- [Chromium 155.0.8059.12 behavioral/layout/focus results](chromium-results.json)
- [Desktop WebKit 26.6 behavioral/layout/focus results](webkit-results.json)
- [Chromium capture measurements](chromium-captures.json) and [WebKit capture measurements](webkit-captures.json)

Each engine passes 54 behavioral checks, 72 route/viewport/text cases, and 40 focus samples. The long-URL probe retains its complete text at a 320 px page width; reduced-motion probes report no running animations and automatic scroll behavior. Capture measurements confirm 48 px check-in bands and Save, landscape Timing filters in normal flow, and a scroll-locked deletion dialog focused on Cancel.

Screenshots use synthetic text only. The `text-stress-320` images use a 32 px root font; they are not screenshots of physical 200% phone zoom. The `check-in-390` images show an acknowledged device checkpoint. `delete-320` and `delete-landscape` show the same controlled dialog at narrow and short viewports. These are **Render** evidence. Keyboard/browser chrome, physical safe areas, assistive technology and grip usability remain untested. LCP, INP and CLS are **not measured**.
