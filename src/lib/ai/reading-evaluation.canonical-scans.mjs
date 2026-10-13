/** Frozen analytic data for draft-*-2 only. Node v24.21.0; V8 13.6.233.17-node.53.
 * Do not regenerate in place. Historical fixtures retain their runtime calculations.
 * Synthetic evidence only; never Swiss Ephemeris qualification. */
export const CANONICAL_SCANS = {
  "arc-single-pass": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-09-08T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-05-16T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-09-08T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: 0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-3",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-3",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-3",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-opening-three": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-09-08T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-09-08T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: 0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-return-three": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-12-17T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-12-17T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: -0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-closing-three": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2027-03-27T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2027-03-27T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: 0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-return-five": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2027-03-27T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2028-06-19T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2027-03-27T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: 0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
            {
              at: "2027-07-05T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2027-07-05T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2027-07-05T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-4",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-5",
              windowId: "window-native-private-4",
            },
            {
              at: "2027-10-13T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-10-13T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-10-13T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-5",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-6",
              windowId: "window-native-private-5",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-12-02T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-12-02T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-12-02T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-7",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2028-03-11T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2028-03-11T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2028-03-11T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-8",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: "station-7",
            },
            {
              id: "leg-7",
              start: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2028-03-11T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-7",
              endStationId: "station-8",
            },
            {
              id: "leg-8",
              start: {
                at: "2028-03-11T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2028-06-19T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-8",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
            {
              id: "window-native-private-4",
              ingress: {
                at: "2027-06-18T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.1632419427810797,
                bracket: [
                  {
                    at: "2027-06-18T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057044,
                    speed: -0.1632414287367558,
                  },
                  {
                    at: "2027-06-18T20:00:15.000Z",
                    unwrappedLongitude: 107.9999716593403,
                    speed: -0.16324245682054755,
                  },
                ],
              },
              egress: {
                at: "2027-07-22T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.1632419427810797,
                bracket: [
                  {
                    at: "2027-07-22T03:59:45.000Z",
                    unwrappedLongitude: 102.0000283406597,
                    speed: -0.16324245682054755,
                  },
                  {
                    at: "2027-07-22T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: -0.16324142873675576,
                  },
                ],
              },
              contactIds: ["native-private-4"],
            },
            {
              id: "window-native-private-5",
              ingress: {
                at: "2027-09-26T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.1632419427810797,
                bracket: [
                  {
                    at: "2027-09-26T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367558,
                  },
                  {
                    at: "2027-09-26T20:00:15.000Z",
                    unwrappedLongitude: 102.0000283406597,
                    speed: 0.16324245682054755,
                  },
                ],
              },
              egress: {
                at: "2027-10-30T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.1632419427810797,
                bracket: [
                  {
                    at: "2027-10-30T03:59:45.000Z",
                    unwrappedLongitude: 107.9999716593403,
                    speed: 0.16324245682054755,
                  },
                  {
                    at: "2027-10-30T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057044,
                    speed: 0.16324142873675576,
                  },
                ],
              },
              contactIds: ["native-private-5"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: [
                "native-private-1",
                "native-private-2",
                "native-private-3",
                "native-private-4",
                "native-private-5",
              ],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-7",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
            {
              at: "2027-07-05T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2027-07-05T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2027-07-05T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-4",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-5",
              windowId: "window-native-private-4",
            },
            {
              at: "2027-10-13T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-10-13T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-10-13T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-5",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-6",
              windowId: "window-native-private-5",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-12-02T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-12-02T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-12-02T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-7",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2028-03-11T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2028-03-11T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2028-03-11T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-8",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: "station-7",
            },
            {
              id: "leg-7",
              start: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2028-03-11T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-7",
              endStationId: "station-8",
            },
            {
              id: "leg-8",
              start: {
                at: "2028-03-11T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2028-06-19T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-8",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
            {
              id: "window-native-private-4",
              ingress: {
                at: "2027-06-18T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.1632419427810797,
                bracket: [
                  {
                    at: "2027-06-18T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057044,
                    speed: -0.1632414287367558,
                  },
                  {
                    at: "2027-06-18T20:00:15.000Z",
                    unwrappedLongitude: 107.9999716593403,
                    speed: -0.16324245682054755,
                  },
                ],
              },
              egress: {
                at: "2027-07-22T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.1632419427810797,
                bracket: [
                  {
                    at: "2027-07-22T03:59:45.000Z",
                    unwrappedLongitude: 102.0000283406597,
                    speed: -0.16324245682054755,
                  },
                  {
                    at: "2027-07-22T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: -0.16324142873675576,
                  },
                ],
              },
              contactIds: ["native-private-4"],
            },
            {
              id: "window-native-private-5",
              ingress: {
                at: "2027-09-26T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.1632419427810797,
                bracket: [
                  {
                    at: "2027-09-26T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367558,
                  },
                  {
                    at: "2027-09-26T20:00:15.000Z",
                    unwrappedLongitude: 102.0000283406597,
                    speed: 0.16324245682054755,
                  },
                ],
              },
              egress: {
                at: "2027-10-30T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.1632419427810797,
                bracket: [
                  {
                    at: "2027-10-30T03:59:45.000Z",
                    unwrappedLongitude: 107.9999716593403,
                    speed: 0.16324245682054755,
                  },
                  {
                    at: "2027-10-30T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057044,
                    speed: 0.16324142873675576,
                  },
                ],
              },
              contactIds: ["native-private-5"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: [
                "native-private-1",
                "native-private-2",
                "native-private-3",
                "native-private-4",
                "native-private-5",
              ],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-7",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
            {
              at: "2027-07-05T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2027-07-05T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2027-07-05T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-4",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-5",
              windowId: "window-native-private-4",
            },
            {
              at: "2027-10-13T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-10-13T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-10-13T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-5",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-6",
              windowId: "window-native-private-5",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-12-02T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-12-02T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-12-02T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-7",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2028-03-11T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2028-03-11T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2028-03-11T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-8",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: "station-7",
            },
            {
              id: "leg-7",
              start: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2028-03-11T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-7",
              endStationId: "station-8",
            },
            {
              id: "leg-8",
              start: {
                at: "2028-03-11T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2028-06-19T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-8",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
            {
              id: "window-native-private-4",
              ingress: {
                at: "2027-06-18T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.1632419427810797,
                bracket: [
                  {
                    at: "2027-06-18T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057044,
                    speed: -0.1632414287367558,
                  },
                  {
                    at: "2027-06-18T20:00:15.000Z",
                    unwrappedLongitude: 107.9999716593403,
                    speed: -0.16324245682054755,
                  },
                ],
              },
              egress: {
                at: "2027-07-22T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.1632419427810797,
                bracket: [
                  {
                    at: "2027-07-22T03:59:45.000Z",
                    unwrappedLongitude: 102.0000283406597,
                    speed: -0.16324245682054755,
                  },
                  {
                    at: "2027-07-22T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: -0.16324142873675576,
                  },
                ],
              },
              contactIds: ["native-private-4"],
            },
            {
              id: "window-native-private-5",
              ingress: {
                at: "2027-09-26T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.1632419427810797,
                bracket: [
                  {
                    at: "2027-09-26T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367558,
                  },
                  {
                    at: "2027-09-26T20:00:15.000Z",
                    unwrappedLongitude: 102.0000283406597,
                    speed: 0.16324245682054755,
                  },
                ],
              },
              egress: {
                at: "2027-10-30T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.1632419427810797,
                bracket: [
                  {
                    at: "2027-10-30T03:59:45.000Z",
                    unwrappedLongitude: 107.9999716593403,
                    speed: 0.16324245682054755,
                  },
                  {
                    at: "2027-10-30T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057044,
                    speed: 0.16324142873675576,
                  },
                ],
              },
              contactIds: ["native-private-5"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: [
                "native-private-1",
                "native-private-2",
                "native-private-3",
                "native-private-4",
                "native-private-5",
              ],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-7",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-between-passes": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-10-28T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-10-28T12:00:00.000Z",
        unwrappedLongitude: 107,
        speed: 0,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.06283185307179587,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: 0.06283185307086131,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: 0.06283185307086131,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.06283185307179587,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: -0.06283185307086131,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: -0.06283185307086131,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.06283185307179587,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: 0.06283185307086131,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: 0.06283185307086131,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 104,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 103.99999999994795,
                  speed: 5.997155452185895e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 103.99999999999257,
                  speed: -8.56736493133403e-8,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 103,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 103.00000000000743,
                  speed: -8.567364931694135e-8,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: 3.426945972533612e-7,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 107,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: 3.426945972677654e-7,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: -3.426945972533612e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 103,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: -3.426945972677654e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: 3.426945972533612e-7,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 107,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: 3.426945972677654e-7,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 106.99999999999257,
                  speed: -8.56736493133403e-8,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 106,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 106.00000000000743,
                  speed: -8.567364931694135e-8,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 106.00000000005205,
                  speed: 5.997155451933822e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 106,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 106,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 1.346569485605253e-17,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-03-06T14:21:32.809Z",
                unwrappedLongitude: 102,
                speed: 0.099345882657961,
                bracket: [
                  {
                    at: "2026-03-06T14:21:17.809Z",
                    unwrappedLongitude: 101.99998275242862,
                    speed: 0.09934613967743129,
                  },
                  {
                    at: "2026-03-06T14:21:47.809Z",
                    unwrappedLongitude: 102.00001724752676,
                    speed: 0.09934562563553541,
                  },
                ],
              },
              egress: {
                at: "2027-09-29T09:38:27.190Z",
                unwrappedLongitude: 108,
                speed: 0.09934588265796102,
                bracket: [
                  {
                    at: "2027-09-29T09:38:12.190Z",
                    unwrappedLongitude: 107.99998275247324,
                    speed: 0.09934562563553541,
                  },
                  {
                    at: "2027-09-29T09:38:42.190Z",
                    unwrappedLongitude: 108.00001724757138,
                    speed: 0.0993461396774313,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.06283185307179587,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: 0.06283185307086131,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: 0.06283185307086131,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.06283185307179587,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: -0.06283185307086131,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: -0.06283185307086131,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.06283185307179587,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: 0.06283185307086131,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: 0.06283185307086131,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 104,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 103.99999999994795,
                  speed: 5.997155452185895e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 103.99999999999257,
                  speed: -8.56736493133403e-8,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 103,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 103.00000000000743,
                  speed: -8.567364931694135e-8,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: 3.426945972533612e-7,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 107,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: 3.426945972677654e-7,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: -3.426945972533612e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 103,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: -3.426945972677654e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: 3.426945972533612e-7,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 107,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: 3.426945972677654e-7,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 106.99999999999257,
                  speed: -8.56736493133403e-8,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 106,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 106.00000000000743,
                  speed: -8.567364931694135e-8,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 106.00000000005205,
                  speed: 5.997155451933822e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 106,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 106,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 1.346569485605253e-17,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-03-06T14:21:32.809Z",
                unwrappedLongitude: 102,
                speed: 0.099345882657961,
                bracket: [
                  {
                    at: "2026-03-06T14:21:17.809Z",
                    unwrappedLongitude: 101.99998275242862,
                    speed: 0.09934613967743129,
                  },
                  {
                    at: "2026-03-06T14:21:47.809Z",
                    unwrappedLongitude: 102.00001724752676,
                    speed: 0.09934562563553541,
                  },
                ],
              },
              egress: {
                at: "2027-09-29T09:38:27.190Z",
                unwrappedLongitude: 108,
                speed: 0.09934588265796102,
                bracket: [
                  {
                    at: "2027-09-29T09:38:12.190Z",
                    unwrappedLongitude: 107.99998275247324,
                    speed: 0.09934562563553541,
                  },
                  {
                    at: "2027-09-29T09:38:42.190Z",
                    unwrappedLongitude: 108.00001724757138,
                    speed: 0.0993461396774313,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.06283185307179587,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: 0.06283185307086131,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: 0.06283185307086131,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.06283185307179587,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: -0.06283185307086131,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: -0.06283185307086131,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.06283185307179587,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99998909169217,
                  speed: 0.06283185307086131,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00001090830783,
                  speed: 0.06283185307086131,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 104,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 103.99999999994795,
                  speed: 5.997155452185895e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 103.99999999999257,
                  speed: -8.56736493133403e-8,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 103,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 103.00000000000743,
                  speed: -8.567364931694135e-8,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: 3.426945972533612e-7,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 107,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: 3.426945972677654e-7,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: -3.426945972533612e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 103,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: -3.426945972677654e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 103.00000000002974,
                  speed: 3.426945972533612e-7,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 107,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 106.99999999997026,
                  speed: 3.426945972677654e-7,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 106.99999999999257,
                  speed: -8.56736493133403e-8,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 106,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 106.00000000000743,
                  speed: -8.567364931694135e-8,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 106.00000000005205,
                  speed: 5.997155451933822e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 103,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 107,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 106,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 106,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 1.346569485605253e-17,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-03-06T14:21:32.809Z",
                unwrappedLongitude: 102,
                speed: 0.099345882657961,
                bracket: [
                  {
                    at: "2026-03-06T14:21:17.809Z",
                    unwrappedLongitude: 101.99998275242862,
                    speed: 0.09934613967743129,
                  },
                  {
                    at: "2026-03-06T14:21:47.809Z",
                    unwrappedLongitude: 102.00001724752676,
                    speed: 0.09934562563553541,
                  },
                ],
              },
              egress: {
                at: "2027-09-29T09:38:27.190Z",
                unwrappedLongitude: 108,
                speed: 0.09934588265796102,
                bracket: [
                  {
                    at: "2027-09-29T09:38:12.190Z",
                    unwrappedLongitude: 107.99998275247324,
                    speed: 0.09934562563553541,
                  },
                  {
                    at: "2027-09-29T09:38:42.190Z",
                    unwrappedLongitude: 108.00001724757138,
                    speed: 0.0993461396774313,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-truncated-scan": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-12-17T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-12-17T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: -0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: "time_limit",
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-station-tangent": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-12-17T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-12-17T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: -0.00001570796326802397,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.00001570796326802397,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: 0.000015707963267790332,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: 0.000015707963267790332,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.00001570796326802397,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: -0.000015707963267790332,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: -0.000015707963267790332,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.00001570796326802397,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: 0.000015707963267790332,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: 0.000015707963267790332,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 104.99975,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 104.99974999994052,
                  speed: 6.85367776123202e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 104.99975,
                  speed: -2.1418412329046095e-11,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 104.9995,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 104.9995,
                  speed: -2.1418412329946355e-11,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: 8.567364931374939e-11,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 105.0005,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: 8.567364931735043e-11,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: -8.567364931374939e-11,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 104.9995,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: -8.567364931735043e-11,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: 8.567364931374939e-11,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 105.0005,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: 8.567364931735043e-11,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 105.0005,
                  speed: -2.1418412329046095e-11,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 105.00025,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 105.00025,
                  speed: -2.1418412329946355e-11,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 105.00025000005948,
                  speed: 6.853677760943946e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104.99975,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104.99975,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 105.00025,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 105.00025,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 1.53888846321009e-17,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-02-28T13:03:51.541Z",
                unwrappedLongitude: 102,
                speed: 0.12166829045023986,
                bracket: [
                  {
                    at: "2026-02-28T13:03:36.541Z",
                    unwrappedLongitude: 101.99997887701804,
                    speed: 0.12166846181714723,
                  },
                  {
                    at: "2026-02-28T13:04:06.541Z",
                    unwrappedLongitude: 102.00002112295222,
                    speed: 0.12166811907971314,
                  },
                ],
              },
              egress: {
                at: "2027-10-05T10:56:08.458Z",
                unwrappedLongitude: 108,
                speed: 0.12166829045023984,
                bracket: [
                  {
                    at: "2027-10-05T10:55:53.458Z",
                    unwrappedLongitude: 107.99997887704778,
                    speed: 0.12166811907971312,
                  },
                  {
                    at: "2027-10-05T10:56:23.458Z",
                    unwrappedLongitude: 108.00002112298196,
                    speed: 0.12166846181714719,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.00001570796326802397,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: 0.000015707963267790332,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: 0.000015707963267790332,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.00001570796326802397,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: -0.000015707963267790332,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: -0.000015707963267790332,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.00001570796326802397,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: 0.000015707963267790332,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: 0.000015707963267790332,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 104.99975,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 104.99974999994052,
                  speed: 6.85367776123202e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 104.99975,
                  speed: -2.1418412329046095e-11,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 104.9995,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 104.9995,
                  speed: -2.1418412329946355e-11,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: 8.567364931374939e-11,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 105.0005,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: 8.567364931735043e-11,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: -8.567364931374939e-11,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 104.9995,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: -8.567364931735043e-11,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: 8.567364931374939e-11,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 105.0005,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: 8.567364931735043e-11,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 105.0005,
                  speed: -2.1418412329046095e-11,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 105.00025,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 105.00025,
                  speed: -2.1418412329946355e-11,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 105.00025000005948,
                  speed: 6.853677760943946e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104.99975,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104.99975,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 105.00025,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 105.00025,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 1.53888846321009e-17,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-02-28T13:03:51.541Z",
                unwrappedLongitude: 102,
                speed: 0.12166829045023986,
                bracket: [
                  {
                    at: "2026-02-28T13:03:36.541Z",
                    unwrappedLongitude: 101.99997887701804,
                    speed: 0.12166846181714723,
                  },
                  {
                    at: "2026-02-28T13:04:06.541Z",
                    unwrappedLongitude: 102.00002112295222,
                    speed: 0.12166811907971314,
                  },
                ],
              },
              egress: {
                at: "2027-10-05T10:56:08.458Z",
                unwrappedLongitude: 108,
                speed: 0.12166829045023984,
                bracket: [
                  {
                    at: "2027-10-05T10:55:53.458Z",
                    unwrappedLongitude: 107.99997887704778,
                    speed: 0.12166811907971312,
                  },
                  {
                    at: "2027-10-05T10:56:23.458Z",
                    unwrappedLongitude: 108.00002112298196,
                    speed: 0.12166846181714719,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.00001570796326802397,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: 0.000015707963267790332,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: 0.000015707963267790332,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.00001570796326802397,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: -0.000015707963267790332,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: -0.000015707963267790332,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.00001570796326802397,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99999999727292,
                  speed: 0.000015707963267790332,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00000000272708,
                  speed: 0.000015707963267790332,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 104.99975,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 104.99974999994052,
                  speed: 6.85367776123202e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 104.99975,
                  speed: -2.1418412329046095e-11,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 104.9995,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 104.9995,
                  speed: -2.1418412329946355e-11,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: 8.567364931374939e-11,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 105.0005,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: 8.567364931735043e-11,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: -8.567364931374939e-11,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 104.9995,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: -8.567364931735043e-11,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 104.99950000000001,
                  speed: 8.567364931374939e-11,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 105.0005,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 105.00049999999999,
                  speed: 8.567364931735043e-11,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 105.0005,
                  speed: -2.1418412329046095e-11,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 105.00025,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 105.00025,
                  speed: -2.1418412329946355e-11,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 105.00025000005948,
                  speed: 6.853677760943946e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104.99975,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 104.99975,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 104.9995,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 105.0005,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 105.00025,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 105.00025,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 1.53888846321009e-17,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-02-28T13:03:51.541Z",
                unwrappedLongitude: 102,
                speed: 0.12166829045023986,
                bracket: [
                  {
                    at: "2026-02-28T13:03:36.541Z",
                    unwrappedLongitude: 101.99997887701804,
                    speed: 0.12166846181714723,
                  },
                  {
                    at: "2026-02-28T13:04:06.541Z",
                    unwrappedLongitude: 102.00002112295222,
                    speed: 0.12166811907971314,
                  },
                ],
              },
              egress: {
                at: "2027-10-05T10:56:08.458Z",
                unwrappedLongitude: 108,
                speed: 0.12166829045023984,
                bracket: [
                  {
                    at: "2027-10-05T10:55:53.458Z",
                    unwrappedLongitude: 107.99997887704778,
                    speed: 0.12166811907971312,
                  },
                  {
                    at: "2027-10-05T10:56:23.458Z",
                    unwrappedLongitude: 108.00002112298196,
                    speed: 0.12166846181714719,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "arc-birth-window-disagreement": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 16,
          },
        ],
        referenceAt: "2027-03-27T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2027-03-27T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: 0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-10-10T14:36:37.079Z",
              unwrappedLongitude: 105,
              speed: 0.05441398092702645,
              bracket: [
                {
                  at: "2026-10-10T14:36:22.079Z",
                  unwrappedLongitude: 104.99999055308741,
                  speed: 0.05441445213128834,
                },
                {
                  at: "2026-10-10T14:36:52.079Z",
                  unwrappedLongitude: 105.00000944683079,
                  speed: 0.05441350972114588,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-11-15T09:23:22.920Z",
              unwrappedLongitude: 105,
              speed: -0.054413980927026595,
              bracket: [
                {
                  at: "2026-11-15T09:23:07.920Z",
                  unwrappedLongitude: 105.00000944683079,
                  speed: -0.05441350972114603,
                },
                {
                  at: "2026-11-15T09:23:37.920Z",
                  unwrappedLongitude: 104.9999905530874,
                  speed: -0.054414452131288475,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000004835,
                  speed: 5.568787205367121e-7,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 105.5,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 105.49999999995165,
                  speed: 5.568787205601188e-7,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 105.49999999995165,
                  speed: -5.568787205367121e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000004835,
                  speed: -5.568787205601188e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.5,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.5,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-09-06T01:10:37.162Z",
                unwrappedLongitude: 102,
                speed: 0.10179923683969261,
                bracket: [
                  {
                    at: "2026-09-06T01:10:22.162Z",
                    unwrappedLongitude: 101.9999823265251,
                    speed: 0.10179919400135379,
                  },
                  {
                    at: "2026-09-06T01:10:52.162Z",
                    unwrappedLongitude: 102.00001767348233,
                    speed: 0.1017992796750031,
                  },
                ],
              },
              egress: {
                at: "2026-12-19T22:49:22.837Z",
                unwrappedLongitude: 102,
                speed: -0.10179923683969261,
                bracket: [
                  {
                    at: "2026-12-19T22:49:07.837Z",
                    unwrappedLongitude: 102.00001767348233,
                    speed: -0.1017992796750031,
                  },
                  {
                    at: "2026-12-19T22:49:37.837Z",
                    unwrappedLongitude: 101.9999823265251,
                    speed: -0.10179919400135379,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-10-10T14:36:37.079Z",
              unwrappedLongitude: 105,
              speed: 0.05441398092702645,
              bracket: [
                {
                  at: "2026-10-10T14:36:22.079Z",
                  unwrappedLongitude: 104.99999055308741,
                  speed: 0.05441445213128834,
                },
                {
                  at: "2026-10-10T14:36:52.079Z",
                  unwrappedLongitude: 105.00000944683079,
                  speed: 0.05441350972114588,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-11-15T09:23:22.920Z",
              unwrappedLongitude: 105,
              speed: -0.054413980927026595,
              bracket: [
                {
                  at: "2026-11-15T09:23:07.920Z",
                  unwrappedLongitude: 105.00000944683079,
                  speed: -0.05441350972114603,
                },
                {
                  at: "2026-11-15T09:23:37.920Z",
                  unwrappedLongitude: 104.9999905530874,
                  speed: -0.054414452131288475,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-1",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000004835,
                  speed: 5.568787205367121e-7,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 105.5,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 105.49999999995165,
                  speed: 5.568787205601188e-7,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 105.49999999995165,
                  speed: -5.568787205367121e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000004835,
                  speed: -5.568787205601188e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.5,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.5,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-09-06T01:10:37.162Z",
                unwrappedLongitude: 102,
                speed: 0.10179923683969261,
                bracket: [
                  {
                    at: "2026-09-06T01:10:22.162Z",
                    unwrappedLongitude: 101.9999823265251,
                    speed: 0.10179919400135379,
                  },
                  {
                    at: "2026-09-06T01:10:52.162Z",
                    unwrappedLongitude: 102.00001767348233,
                    speed: 0.1017992796750031,
                  },
                ],
              },
              egress: {
                at: "2026-12-19T22:49:22.837Z",
                unwrappedLongitude: 102,
                speed: -0.10179923683969261,
                bracket: [
                  {
                    at: "2026-12-19T22:49:07.837Z",
                    unwrappedLongitude: 102.00001767348233,
                    speed: -0.1017992796750031,
                  },
                  {
                    at: "2026-12-19T22:49:37.837Z",
                    unwrappedLongitude: 101.9999823265251,
                    speed: -0.10179919400135379,
                  },
                ],
              },
              contactIds: ["native-private-1", "native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 16,
          limit: null,
          contacts: [
            {
              at: "2027-04-01T19:55:15.274Z",
              unwrappedLongitude: 106,
              speed: 0.1858591278463685,
              bracket: [
                {
                  at: "2027-04-01T19:55:00.274Z",
                  unwrappedLongitude: 105.99996773277543,
                  speed: 0.18585929919090266,
                },
                {
                  at: "2027-04-01T19:55:30.274Z",
                  unwrappedLongitude: 106.00003226719483,
                  speed: 0.1858589564963054,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-1",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000004835,
                  speed: 5.568787205367121e-7,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 105.5,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 105.49999999995165,
                  speed: 5.568787205601188e-7,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 105.49999999995165,
                  speed: -5.568787205367121e-7,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000004835,
                  speed: -5.568787205601188e-7,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.5,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 105.5,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2027-03-16T16:23:01.409Z",
                unwrappedLongitude: 103,
                speed: 0.17771531752633468,
                bracket: [
                  {
                    at: "2027-03-16T16:22:46.409Z",
                    unwrappedLongitude: 102.99996914667601,
                    speed: 0.17771497482909407,
                  },
                  {
                    at: "2027-03-16T16:23:16.409Z",
                    unwrappedLongitude: 103.00003085338349,
                    speed: 0.17771566021828858,
                  },
                ],
              },
              egress: {
                at: "2027-04-19T17:28:15.114Z",
                unwrappedLongitude: 109,
                speed: 0.1404962946208145,
                bracket: [
                  {
                    at: "2027-04-19T17:28:00.114Z",
                    unwrappedLongitude: 108.99997560822268,
                    speed: 0.1404969800079193,
                  },
                  {
                    at: "2027-04-19T17:28:30.114Z",
                    unwrappedLongitude: 109.00002439165831,
                    speed: 0.14049560922953028,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1"],
              leftClosureLegId: "leg-3",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 16],
        },
      ],
    },
  },
  "arc-synthesis-natal-integration": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-12-17T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-12-17T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: -0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
  "writing-all-evidence": {
    transitEpisodeScan: {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      source: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "analytic-cosine-not-swiss",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
      request: {
        contract: "swiss-transit-episode/1",
        solverVersion: "transit-episode-1",
        sourceId: "analytic-test-only",
        transitBody: "saturn",
        aspect: "square",
        targets: [
          {
            offsetMinutes: -2,
            longitude: 15,
          },
          {
            offsetMinutes: 0,
            longitude: 15,
          },
          {
            offsetMinutes: 2,
            longitude: 15,
          },
        ],
        referenceAt: "2026-12-17T12:00:00.000Z",
        maxOrbDegrees: 3,
      },
      coverage: {
        from: "2026-01-01T12:00:00.000Z",
        to: "2027-12-02T12:00:00.000Z",
      },
      tolerance: {
        bracketSeconds: 60,
        rootResidualDeg: 0.000001,
      },
      reference: {
        at: "2026-12-17T12:00:00.000Z",
        unwrappedLongitude: 105,
        speed: -0.18849555921538758,
      },
      samples: [
        {
          offsetMinutes: -2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 0,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
        {
          offsetMinutes: 2,
          natalLongitude: 15,
          limit: null,
          contacts: [
            {
              at: "2026-09-08T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2026-09-08T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2026-09-08T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-1",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-2",
              windowId: "window-native-private-1",
            },
            {
              at: "2026-12-17T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: -0.18849555921538758,
              bracket: [
                {
                  at: "2026-12-17T11:59:45.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: -0.18849555921258393,
                },
                {
                  at: "2026-12-17T12:00:15.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: -0.18849555921258393,
                },
              ],
              id: "native-private-2",
              residualDeg: 0,
              direction: "retrograde",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-3",
              windowId: "window-native-private-2",
            },
            {
              at: "2027-03-27T12:00:00.000Z",
              unwrappedLongitude: 105,
              speed: 0.18849555921538758,
              bracket: [
                {
                  at: "2027-03-27T11:59:45.000Z",
                  unwrappedLongitude: 104.99996727507653,
                  speed: 0.18849555921258393,
                },
                {
                  at: "2027-03-27T12:00:15.000Z",
                  unwrappedLongitude: 105.00003272492347,
                  speed: 0.18849555921258393,
                },
              ],
              id: "native-private-3",
              residualDeg: 0,
              direction: "direct",
              branch: "plus",
              targetTurn: 0,
              legId: "leg-4",
              windowId: "window-native-private-3",
            },
          ],
          stations: [
            {
              at: "2026-04-11T12:00:00.000Z",
              unwrappedLongitude: 102,
              speed: 0,
              bracket: [
                {
                  at: "2026-04-11T11:59:45.000Z",
                  unwrappedLongitude: 101.99999999996281,
                  speed: 4.2836824658470674e-7,
                },
                {
                  at: "2026-04-11T12:00:15.000Z",
                  unwrappedLongitude: 101.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-1",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2026-07-20T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2026-07-20T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2026-07-20T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-2",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2026-10-28T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2026-10-28T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2026-10-28T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: -0.0000010280837917600837,
                },
              ],
              id: "station-3",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-02-05T12:00:00.000Z",
              unwrappedLongitude: 99,
              speed: 0,
              bracket: [
                {
                  at: "2027-02-05T11:59:45.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: -0.000001028083791803296,
                },
                {
                  at: "2027-02-05T12:00:15.000Z",
                  unwrappedLongitude: 99.00000000008924,
                  speed: 0.0000010280837917600837,
                },
              ],
              id: "station-4",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
            {
              at: "2027-05-16T12:00:00.000Z",
              unwrappedLongitude: 111,
              speed: 0,
              bracket: [
                {
                  at: "2027-05-16T11:59:45.000Z",
                  unwrappedLongitude: 110.99999999991076,
                  speed: 0.000001028083791803296,
                },
                {
                  at: "2027-05-16T12:00:15.000Z",
                  unwrappedLongitude: 110.99999999997769,
                  speed: -2.570209479400209e-7,
                },
              ],
              id: "station-5",
              directionBefore: "direct",
              directionAfter: "retrograde",
            },
            {
              at: "2027-08-24T12:00:00.000Z",
              unwrappedLongitude: 108,
              speed: 0,
              bracket: [
                {
                  at: "2027-08-24T11:59:45.000Z",
                  unwrappedLongitude: 108.00000000002231,
                  speed: -2.57020947950824e-7,
                },
                {
                  at: "2027-08-24T12:00:15.000Z",
                  unwrappedLongitude: 108.00000000003719,
                  speed: 4.283682465667015e-7,
                },
              ],
              id: "station-6",
              directionBefore: "retrograde",
              directionAfter: "direct",
            },
          ],
          legs: [
            {
              id: "leg-0",
              start: {
                at: "2026-01-01T12:00:00.000Z",
                unwrappedLongitude: 97,
                speed: 0,
              },
              end: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              direction: "direct",
              startStationId: null,
              endStationId: "station-1",
            },
            {
              id: "leg-1",
              start: {
                at: "2026-04-11T12:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0,
              },
              end: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-1",
              endStationId: "station-2",
            },
            {
              id: "leg-2",
              start: {
                at: "2026-07-20T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-2",
              endStationId: "station-3",
            },
            {
              id: "leg-3",
              start: {
                at: "2026-10-28T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-3",
              endStationId: "station-4",
            },
            {
              id: "leg-4",
              start: {
                at: "2027-02-05T12:00:00.000Z",
                unwrappedLongitude: 99,
                speed: 0,
              },
              end: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              direction: "direct",
              startStationId: "station-4",
              endStationId: "station-5",
            },
            {
              id: "leg-5",
              start: {
                at: "2027-05-16T12:00:00.000Z",
                unwrappedLongitude: 111,
                speed: 0,
              },
              end: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              direction: "retrograde",
              startStationId: "station-5",
              endStationId: "station-6",
            },
            {
              id: "leg-6",
              start: {
                at: "2027-08-24T12:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0,
              },
              end: {
                at: "2027-12-02T12:00:00.000Z",
                unwrappedLongitude: 113,
                speed: 9.61835346860895e-18,
              },
              direction: "direct",
              startStationId: "station-6",
              endStationId: null,
            },
          ],
          windows: [
            {
              id: "window-native-private-1",
              ingress: {
                at: "2026-08-22T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107965,
                bracket: [
                  {
                    at: "2026-08-22T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942956,
                    speed: 0.1632414287367557,
                  },
                  {
                    at: "2026-08-22T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.16324245682054747,
                  },
                ],
              },
              egress: {
                at: "2026-09-25T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2026-09-25T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2026-09-25T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-1"],
            },
            {
              id: "window-native-private-2",
              ingress: {
                at: "2026-11-30T20:00:00.000Z",
                unwrappedLongitude: 108,
                speed: -0.16324194278107956,
                bracket: [
                  {
                    at: "2026-11-30T19:59:45.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: -0.16324142873675562,
                  },
                  {
                    at: "2026-11-30T20:00:15.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: -0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-01-03T04:00:00.000Z",
                unwrappedLongitude: 102,
                speed: -0.16324194278107954,
                bracket: [
                  {
                    at: "2027-01-03T03:59:45.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: -0.1632424568205474,
                  },
                  {
                    at: "2027-01-03T04:00:15.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: -0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-2"],
            },
            {
              id: "window-native-private-3",
              ingress: {
                at: "2027-03-10T20:00:00.000Z",
                unwrappedLongitude: 102,
                speed: 0.16324194278107956,
                bracket: [
                  {
                    at: "2027-03-10T19:59:45.000Z",
                    unwrappedLongitude: 101.99997165942955,
                    speed: 0.16324142873675562,
                  },
                  {
                    at: "2027-03-10T20:00:15.000Z",
                    unwrappedLongitude: 102.00002834065968,
                    speed: 0.1632424568205474,
                  },
                ],
              },
              egress: {
                at: "2027-04-13T04:00:00.000Z",
                unwrappedLongitude: 108,
                speed: 0.16324194278107954,
                bracket: [
                  {
                    at: "2027-04-13T03:59:45.000Z",
                    unwrappedLongitude: 107.99997165934032,
                    speed: 0.1632424568205474,
                  },
                  {
                    at: "2027-04-13T04:00:15.000Z",
                    unwrappedLongitude: 108.00002834057045,
                    speed: 0.16324142873675562,
                  },
                ],
              },
              contactIds: ["native-private-3"],
            },
          ],
          components: [
            {
              id: "component-private-0",
              contactIds: ["native-private-1", "native-private-2", "native-private-3"],
              leftClosureLegId: "leg-1",
              rightClosureLegId: "leg-5",
              complete: true,
              reason: null,
            },
          ],
        },
      ],
    },
    transitAnchor: {
      version: "transit-anchor-1",
      chartFingerprint: "analytic-private-fingerprint",
      accuracy: "exact",
      status: "screened",
      sampleOffsetsMinutes: [-2, 0, 2],
      sources: [
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
        {
          engine: "swiss-ephemeris",
          engineVersion: "synthetic-1",
          dataId: "analytic-cosine-not-swiss",
          frame: "tropical-apparent-geocentric-true-equinox-of-date",
          timeScale: "UT",
          returnedFlags: 258,
        },
      ],
      anchors: [
        {
          target: "sun",
          longitudes: [15, 15, 15],
        },
      ],
    },
  },
};
