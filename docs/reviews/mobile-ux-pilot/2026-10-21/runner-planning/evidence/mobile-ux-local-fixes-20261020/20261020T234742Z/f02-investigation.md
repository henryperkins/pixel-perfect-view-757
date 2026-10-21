# F-02 investigation: band activation during focus-driven scrolling

**Status: open; no application fix applied.** These are Linux desktop Playwright WebKit 26.6 proxy observations, not physical Safari results. The existing Shell, viewport, gesture and history implementations remain unchanged.

The immediate cause of the observed scroll reset is now isolated: `Shell.tsx`'s `revealFocus` callback runs in a requested animation frame while `document.activeElement` is the entire `MAIN#main-content`. `main.contains(main)` is true, so the callback treats the whole document's main region as the focus-clearance target. In a failing trial, main's rectangle began at `y=-718`; the callback computed and called `window.scrollBy({top:-809, behavior:'instant'})` while the pointer was down on a radio label. Pointer-up then landed on reading prose at `scrollY=0`, and the intended band did not change.

The active element identity, main rectangle, scroll arguments and stack are captured in `f02-main-focus-control.json`. The stack points directly to `revealFocus` in the unchanged Shell. The failing before-fix traces independently point to the same callback. The transient move to main occurs during WebKit mouse activation of the visually hidden native radio/visible label; this run does not establish the same event sequence for physical finger taps.

## Bounded probes and limits

The probes used fresh synthetic member contexts at 390×844, reduced motion, the real routes/components, and the same declared service/bootstrap fixture and Stripe blocking as the pilot. Pass-through scroll/focus wrappers logged timing/stacks and invoked the original functions. This instrumentation can perturb an intermittent timing window; passing counts are observations, not an exclusion of the mechanism.

| Probe | Source state | Passed | Additional setup |
| --- | --- | --- | --- |
| Native Check-in anchor then mouse band selection | Before ordinary fixes | 7/8 | Pass-through tracing only |
| Wait for router resolution and two animation frames after the native anchor | Before ordinary fixes | 3/4 | Extra settling; still failed |
| Use router-managed hash navigation | Before ordinary fixes | 2/4 | Test-only `router.navigate` instead of native anchor activation; still failed |
| Disable router scroll restoration | Before ordinary fixes | 4/4 | Test-only router option; small passing sample does not identify router restoration as the cause |
| Native anchor then mouse selection, including active-element geometry | After F-01/F-03 ordinary fixes | 5/6 | Pass-through tracing only; failing scroll ran with `MAIN#main-content` active |
| Suppress only main-targeted focusin propagation before Shell's handler | After ordinary fixes | 6/6 | Test-only capturing listener; two suppressed main-focus events counted in each trial; real radio/native activation still ran |

The last diagnostic changed only that disposable browser context. It was not added to application source, the checked-in fixture, or the final build. Its result supports the focus-reveal diagnosis; it is not physical-device qualification or a claim that an implemented patch passed. The ordinary focus fix deliberately skips same-page/hash navigation and did not eliminate F-02: a failure remains on the changed local build.

## Conditional proposal, not applied

The smallest candidate is to exclude the main landmark itself from focus-clearance measurement, retaining the existing behavior for actual controls and radio labels. A possible change at the start of `revealFocus` is:

```diff
 const active = document.activeElement;
-if (!(active instanceof HTMLElement) || !mainRef.current?.contains(active)) return;
+const main = mainRef.current;
+if (!(active instanceof HTMLElement) || !main || active === main || !main.contains(active)) return;
```

This diff is **proposed only**. It was not applied or claimed to be verified. The diagnostic event suppression is broader than this guard, so the exact guard still needs its own implementation and regression check if authorized. In particular, retain keyboard/focus clearance for real inputs, links and native radio labels; check real Safari focus/zoom, keyboard open/close, large text, short landscape, toolbar changes, and Android Chrome behavior before target verification.

No new human-check slots were silently added. The existing related Safari principal-journey and Android Chrome entries remain the first target checks. If a separate Safari external-pointer configuration is required and does not fit the unchanged budget, it remains listed beyond budget.
