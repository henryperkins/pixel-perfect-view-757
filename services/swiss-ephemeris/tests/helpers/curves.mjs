export const DAY = 86400000;
export const BASE = Date.parse("2026-01-01T00:00:00Z");
const source = {
  engine: "swiss-ephemeris",
  engineVersion: "analytic-test",
  dataId: "analytic-test",
  frame: "tropical-apparent-geocentric-true-equinox-of-date",
  timeScale: "UT",
  returnedFlags: 258,
};
export const request = (patch = {}) => ({
  contract: "swiss-transit-episode/1",
  solverVersion: "transit-episode-1",
  sourceId: "analytic-test",
  transitBody: "saturn",
  aspect: "conjunction",
  targets: [-2, 0, 2].map((offsetMinutes) => ({ offsetMinutes, longitude: 10 })),
  referenceAt: new Date(BASE).toISOString(),
  maxOrbDegrees: 1,
  ...patch,
});
/** Hand-defined half-cosine legs. Crossings are 100 days apart; outer legs
 * terminate at stations on the same side, proving closure independently. */
export function curve({ count = 3, amplitude = 5, longitude = 10 } = {}) {
  const start = (-(count - 1) / 2) * 100 - 250;
  const values = [-3 * amplitude, -amplitude / 2, -amplitude];
  for (let i = 0; i < count; i++) values.push(i % 2 === 0 ? amplitude : -amplitude);
  values.push(amplitude / 2, 3 * amplitude);
  return {
    source,
    sourceId: "analytic-test",
    coverage: { from: BASE - 2000 * DAY, to: BASE + 2000 * DAY },
    position(_body, at) {
      const d = (at - BASE) / DAY;
      const idx = Math.max(0, Math.min(values.length - 2, Math.floor((d - start) / 100)));
      const u = (d - start - idx * 100) / 100,
        a = values[idx],
        b = values[idx + 1];
      // Continue the outer lobes away from target with yearly reversals.
      let value, speed;
      if (d < start || d > start + (values.length - 1) * 100) {
        const left = d < start,
          edge = left ? start : start + (values.length - 1) * 100;
        value =
          (left ? -3 : 3) * amplitude +
          (left ? -1 : 1) * amplitude * (1 - Math.cos(((d - edge) * Math.PI) / 100));
        speed =
          (((left ? -1 : 1) * amplitude * Math.PI) / 100) * Math.sin(((d - edge) * Math.PI) / 100);
      } else {
        value = a + ((b - a) * (1 - Math.cos(Math.PI * u))) / 2;
        speed = (((b - a) * Math.PI) / 200) * Math.sin(Math.PI * u);
      }
      return { longitude: (((longitude + value) % 360) + 360) % 360, latitude: 0, speed };
    },
  };
}
