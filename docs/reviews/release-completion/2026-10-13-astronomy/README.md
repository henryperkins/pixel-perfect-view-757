# Native astronomy and Timing release

The release adds native new/full Moons and global eclipse classes, consented current-location daylight framing, and future transit windows that are outside today’s orb. It keeps member and natal prose on Lovable, with active content release 0.7.1. No paid model calls were made.

Future queries use three disjoint groups of at most three screened natal targets. Each native request has a 120,000-position/four-second limit; the app has an eighteen-second overall limit. All ten bodies and six aspects are included. Sample ranges, repeated exact passes, unknown bounds and capped inventories are reported explicitly. Unknown-time charts receive an unavailable result. Saved reading history is unchanged.

Daylight requires separate DEV-02 current-location and AMB-05 permissions. The member enters a one-degree grid and its timezone; birthplace is never substituted. One encrypted location and one encrypted solar cache are replaced on change, expire within30 days, and participate in export/reset/erasure. Grant epochs prevent late reads or saves from surviving revoke/regrant or Clear. Solar text is loaded after the immutable reading and never enters ranking or provider inputs. A test compared two complete actual member gateway request bodies under different solar contexts and found them byte-identical.

## Verification

- App:764/764 tests, zero skips; TypeScript and scoped lint passed.
- Native service:38/38 tests, including existing natal/episode regressions and source archive offer.
- Independent native ET/hourly qualification:27/27. Phases and solar times stay within60 seconds; longitudes/root/orb-edge checks stay within0.001 degrees. Three full-year batches include real synthetic precise anchors and angles and stay below75,000 evaluations and1.3 seconds locally.
- Browser:10/10 checks on actual components with intercepted services at390px and desktop, including reduced motion, filters, retained panels and location save/clear. [Mobile screenshot](mobile-sky.png) and [desktop screenshot](desktop-sky.png).
- Fresh native/app reviews and fixed races are recorded in[review.json](review.json). Production evidence belongs in the publication receipt, rather than these local checks.

## Evidence and scope

[Manifest](manifest.json) records exact stages and commands. [Native qualification](native-reference/qualification.json) includes frozen inputs, outputs, references, tolerances and source hashes. The reference tool is a separate code path through the same pinned Swiss ephemeris; it does not establish observed timing accuracy independently of Swiss.

The original139-source registry and topology were recovered unchanged in[docs/reference](../../../reference/source-registry-origin.json), including54 launch sources. Current IDs keep their existing meanings; no ID renumbering or fabricated33-source completion occurred. The full meaning-based mapping and remaining original-MVP requirements stay open under Task15.

Writing review/repetition tooling, paid qualification, human editorial sign-off, and live Google assistant acceptance remain separate checklist gates. The inactive writing candidate is not activated by this app release.
