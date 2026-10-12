/** Closed-form synthetic cosine tracks. Never numerical Swiss qualification. */
export function analyticEpisode({
  count = 3,
  index = 2,
  station = false,
  amplitude = 6,
  shifts = [0, 0, 0],
  longitude = 15,
  branch = "plus",
  aspect = "square",
  firstRetrograde = false,
  birthDisagreement = false,
} = {}) {
  const angle = {
    conjunction: 0,
    sextile: 60,
    square: 90,
    trine: 120,
    quincunx: 150,
    opposition: 180,
  }[aspect];
  const centerTarget = longitude + (branch === "plus" ? angle : -angle),
    direction = firstRetrograde ? -1 : 1,
    shoulder = Math.min(4, amplitude / 2);
  const levels = birthDisagreement
    ? [-8, -3, -6, 0.5, -6, 6, 3, 8]
    : [
        -8,
        -shoulder,
        -amplitude,
        ...Array.from({ length: count }, (_, i) => (i % 2 === 0 ? amplitude : -amplitude)),
        Math.sign(count % 2 === 1 ? 1 : -1) * shoulder,
        Math.sign(count % 2 === 1 ? 1 : -1) * 8,
      ];
  if (birthDisagreement) shifts = [0, 0, 1];
  const values = levels.map((v) => centerTarget + direction * v),
    base = Date.parse("2026-01-01T12:00:00.000Z"),
    span = 100,
    day = 86400000;
  const referenceDay = birthDisagreement ? 450 : station ? 300 : 250 + (index - 1) * 100;
  const point = (t) => {
    const i = Math.max(0, Math.min(values.length - 2, Math.floor(t / span))),
      u = (t - i * span) / span,
      a = values[i],
      b = values[i + 1];
    return {
      at: new Date(base + t * day).toISOString(),
      unwrappedLongitude: a + ((b - a) * (1 - Math.cos(Math.PI * u))) / 2,
      speed: ((b - a) * Math.PI * Math.sin(Math.PI * u)) / (2 * span),
    };
  };
  const refined = (t) => ({ ...point(t), bracket: [point(t - 15 / 86400), point(t + 15 / 86400)] });
  const legs = values.slice(0, -1).map((v, i) => ({
    id: `leg-${i}`,
    start: point(i * span),
    end: point((i + 1) * span),
    direction: values[i + 1] > v ? "direct" : "retrograde",
    startStationId: i ? `station-${i}` : null,
    endStationId: i < values.length - 2 ? `station-${i + 1}` : null,
  }));
  const stations = values.slice(1, -1).map((_, i) => ({
    ...refined((i + 1) * span),
    id: `station-${i + 1}`,
    directionBefore: legs[i].direction,
    directionAfter: legs[i + 1].direction,
  }));
  const crossing = (legIndex, level) =>
    legIndex * span +
    (Math.acos(1 - (2 * (level - values[legIndex])) / (values[legIndex + 1] - values[legIndex])) *
      span) /
      Math.PI;
  function sample(delta, offsetMinutes) {
    const target = centerTarget + delta,
      contacts = [],
      intervals = [];
    for (let i = 0; i < legs.length; i++) {
      const min = Math.min(values[i], values[i + 1]),
        max = Math.max(values[i], values[i + 1]);
      if (min < target && target < max) {
        const t = crossing(i, target);
        contacts.push({
          ...refined(t),
          id: `native-private-${contacts.length + 1}`,
          residualDeg: Math.abs(point(t).unwrappedLongitude - target),
          direction: legs[i].direction,
          branch,
          targetTurn: 0,
          legId: legs[i].id,
          windowId: "",
        });
      }
      if (max < target - 3 || min > target + 3) continue;
      const low = Math.max(min, target - 3),
        high = Math.min(max, target + 3);
      let [from, to] = [crossing(i, low), crossing(i, high)].sort((a, b) => a - b);
      if (intervals.length && Math.abs(intervals.at(-1)[1] - from) < 1e-8) intervals.at(-1)[1] = to;
      else intervals.push([from, to]);
    }
    const windows = intervals.flatMap(([from, to]) => {
      const cs = contacts.filter(
        (c) => Date.parse(c.at) >= base + from * day - 1 && Date.parse(c.at) <= base + to * day + 1,
      );
      if (!cs.length) return [];
      const id = `window-${cs[0].id}`;
      cs.forEach((c) => (c.windowId = id));
      return [{ id, ingress: refined(from), egress: refined(to), contactIds: cs.map((c) => c.id) }];
    });
    const groups = [];
    for (const c of contacts) {
      const group = groups.at(-1),
        li = legs.findIndex((l) => l.id === c.legId);
      if (group && legs.findIndex((l) => l.id === group.at(-1).legId) === li - 1) group.push(c);
      else groups.push([c]);
    }
    const components = groups.map((cs, i) => ({
      id: `component-private-${i}`,
      contactIds: cs.map((c) => c.id),
      leftClosureLegId: legs[legs.findIndex((l) => l.id === cs[0].legId) - 1]?.id ?? null,
      rightClosureLegId: legs[legs.findIndex((l) => l.id === cs.at(-1).legId) + 1]?.id ?? null,
      complete: true,
      reason: null,
    }));
    return {
      offsetMinutes,
      natalLongitude: longitude + delta,
      limit: null,
      contacts,
      stations: structuredClone(stations),
      legs: structuredClone(legs),
      windows,
      components,
    };
  }
  const samples = shifts.map((delta, i) => sample(delta, [-2, 0, 2][i]));
  const source = {
    engine: "swiss-ephemeris",
    engineVersion: "synthetic-1",
    dataId: "analytic-cosine-not-swiss",
    frame: "tropical-apparent-geocentric-true-equinox-of-date",
    timeScale: "UT",
    returnedFlags: 258,
  };
  const reference = point(referenceDay),
    request = {
      contract: "swiss-transit-episode/1",
      solverVersion: "transit-episode-1",
      sourceId: "analytic-test-only",
      transitBody: "saturn",
      aspect,
      targets: samples.map((s) => ({
        offsetMinutes: s.offsetMinutes,
        longitude: s.natalLongitude,
      })),
      referenceAt: reference.at,
      maxOrbDegrees: 3,
    };
  const scan = {
    contract: request.contract,
    solverVersion: request.solverVersion,
    sourceId: request.sourceId,
    source,
    request,
    coverage: { from: legs[0].start.at, to: legs.at(-1).end.at },
    tolerance: { bracketSeconds: 60, rootResidualDeg: 0.000001 },
    reference,
    samples,
  };
  const anchor = {
    version: "transit-anchor-1",
    chartFingerprint: "analytic-private-fingerprint",
    accuracy: "exact",
    status: "screened",
    sampleOffsetsMinutes: [-2, 0, 2],
    sources: [source, source, source],
    anchors: [{ target: "sun", longitudes: samples.map((s) => s.natalLongitude) }],
  };
  const primary = {
    cycle_key: `saturn_${aspect}_sun`,
    transit_body: "saturn",
    natal_point: "sun",
    aspect,
    label: "Saturn square Sun",
    importance: 0.9,
    phase: "exact",
    orb: 0,
    domain: "identity",
    ingress_at: reference.at,
    egress_at: reference.at,
    exact_at: reference.at,
    arc_position: 0.5,
    days_to_exact: 0,
  };
  return { scan, anchor, primary, day: reference.at.slice(0, 10), timezone: "UTC" };
}
