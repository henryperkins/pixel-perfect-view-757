/** Synthetic service-marked geometry; never evidence of live Swiss accuracy. */
export function syntheticNatalSamples(chartModule, ephemerisModule, options = {}) {
  const accuracy = options.accuracy ?? "exact";
  const band = chartModule.TIME_ACCURACY_MINUTES[accuracy];
  const input = {
    utcISO: "1990-01-01T12:00:00.000Z",
    latitude: 30,
    longitude: 0,
    timezone: "UTC",
    accuracy,
  };
  return [-band, 0, band].map((offsetMinutes, index) => {
    const positions = Object.fromEntries(
      ephemerisModule.BODIES.map((body, i) => {
        const lon =
          options[body]?.[index] ?? (body === "moon" ? 285 : body === "saturn" ? 166 : 15 + i * 30);
        return [
          body,
          {
            body,
            lon,
            sign: ephemerisModule.signOf(lon),
            degree: ephemerisModule.degreeInSign(lon),
            lat: 0,
            speed: 1,
            retrograde: false,
          },
        ];
      }),
    );
    const ephemeris = {
      positions,
      engine: "swiss-ephemeris",
      engineVersion: "synthetic-1",
      precision: "high",
      degraded: false,
      degradedReason: null,
      houses: {
        system: "placidus",
        cusps: Array.from({ length: 12 }, (_, i) => (120 + i * 30) % 360),
      },
      angles: { ascendant: 120, midheaven: 30 },
      aspects:
        options.aspects === false
          ? undefined
          : [
              {
                a: "moon",
                b: "saturn",
                aspect: "trine",
                orb: Math.abs(
                  Math.abs(ephemerisModule.signedDelta(positions.moon.lon, positions.saturn.lon)) -
                    120,
                ),
                applying: false,
              },
            ],
    };
    const birth = {
      ...input,
      utcISO: new Date(Date.parse(input.utcISO) + offsetMinutes * 60_000).toISOString(),
    };
    return { offsetMinutes, ephemeris, chart: chartModule.computeChart(birth, ephemeris) };
  });
}

export function natalCycle(overrides = {}) {
  return {
    cycle_key: "saturn_square_sun",
    transit_body: "saturn",
    natal_point: "sun",
    aspect: "square",
    label: "Saturn square Sun",
    importance: 0.8,
    phase: "approaching",
    orb: 1,
    days_to_exact: 3,
    domain: "work",
    ingress_at: "2026-10-01T00:00:00Z",
    exact_at: "2026-10-14T00:00:00Z",
    egress_at: "2026-10-28T00:00:00Z",
    arc_position: 0.3,
    ...overrides,
  };
}
export const natalContext = {
  granted: new Set(["USR-01", "USR-02"]),
  tone: "plain",
  depth: "standard",
  localBucket: null,
  checkIn: null,
  wellness: null,
};

/** Publishes the reviewed natal candidate as the active release, as an operator would. */
export async function activateNatalCandidate(h) {
  const { NATAL_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  await h.records().from("content_releases").insert({
    version: NATAL_CANDIDATE_BUNDLE.version,
    bundle: NATAL_CANDIDATE_BUNDLE,
    checksum: "local-natal-candidate",
    is_active: true,
  });
  return NATAL_CANDIDATE_BUNDLE;
}

/**
 * Today's transiting Saturn squares the seeded Sun. By default the Sun's earlier
 * boundary sample sits in the previous sign, so the Sun is unscreened and the
 * deterministic Capricorn Moon fallback (with its Saturn trine) is selected whatever
 * the date. `ownTarget: true` keeps the Sun screened so its own sign lens leads.
 */
export async function seedNatalReading(h, options = {}) {
  const chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  const screen = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.ts");
  const sun = h.ephemerisModule.norm360(
    h.ephemerisModule.positionOf(
      "saturn",
      h.ephemerisModule.toJulianDay(new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`)),
    ).lon - 90,
  );
  const sunBefore = h.ephemerisModule.norm360(Math.floor(sun / 30) * 30 - 0.5);
  const samples = syntheticNatalSamples(chart, h.ephemerisModule, {
    sun: options.ownTarget ? [sun, sun, sun] : [sunBefore, sun, sun],
    ...options,
  });
  const fingerprint = options.fingerprint ?? "synthetic-natal-snapshot";
  const manifest = screen.assessNatalReliability(samples, fingerprint, options.accuracy ?? "exact");
  // This narrow snapshot fixes daily contacts, while the proof retains full service samples.
  const centerChart = {
    ...samples[1].chart,
    points: { sun: samples[1].chart.points.sun, moon: samples[1].chart.points.moon },
  };
  const seeded = await h.seedChart(h.records(), options.user ?? h.userA, {
    fingerprint,
    chart: centerChart,
    accuracy: options.accuracy ?? "exact",
    ...(options.legacy ? {} : { natalReliability: manifest }),
  });
  if (options.activate !== false) await activateNatalCandidate(h);
  return { ...seeded, manifest, sun };
}

export function natalReadingResponse(request) {
  const hasNatal = request.messages[1].content.includes("N1:");
  return Response.json({
    choices: [
      {
        message: {
          content: JSON.stringify({
            paragraphs: [
              {
                text: "A responsibility can ask for more effort than its scope suggests. A clear boundary offers a comparison for this contact.",
                facts: ["C1", "I1"],
              },
              {
                text: "Dependable structure can offer support for a manageable commitment. Useful support may differ from taking on every obligation.",
                facts: hasNatal ? ["N1", "C1", "I1"] : ["C1", "I1"],
              },
            ],
          }),
        },
      },
    ],
  });
}
