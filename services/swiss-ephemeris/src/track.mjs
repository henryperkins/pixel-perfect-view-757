// SPDX-License-Identifier: AGPL-3.0-or-later
import { DAY, iso, time, plain, direction } from "./contract.mjs";
const unwrap = (longitude, near) => longitude + 360 * Math.round((near - longitude) / 360);
const sign = (x) => (Math.abs(x) < 1e-12 ? 0 : Math.sign(x));

/** Cache only positions inside one request; no derived-anchor persistence. */
export function makeTrack(
  engine,
  body,
  { now = () => performance.now(), maxEvaluations = 20000, maxDurationMs = 4000 } = {},
) {
  const started = now(),
    cache = new Map();
  const check = () => {
    if (now() - started >= Math.min(4000, maxDurationMs)) throw new Error("time_limit");
  };
  const raw = (ms) => {
    check();
    ms = Math.round(ms);
    if (ms < engine.coverage.from || ms > engine.coverage.to) throw new Error("source_range");
    if (cache.has(ms)) return cache.get(ms);
    if (cache.size >= Math.min(20000, maxEvaluations)) throw new Error("evaluation_limit");
    const p = engine.position(body, ms);
    if (
      !Number.isFinite(p.longitude) ||
      p.longitude < 0 ||
      p.longitude >= 360 ||
      !Number.isFinite(p.speed) ||
      Math.abs(p.speed) > 10
    )
      throw new Error("unqualified_source");
    cache.set(ms, p);
    return p;
  };
  const point = (ms, near) => {
    const p = raw(ms);
    return {
      at: iso(ms),
      unwrappedLongitude: unwrap(p.longitude, near ?? p.longitude),
      speed: p.speed,
    };
  };
  const between = (ms, a, b) =>
    point(
      ms,
      a.unwrappedLongitude +
        ((b.unwrappedLongitude - a.unwrappedLongitude) * (ms - time(a))) / (time(b) - time(a)),
    );
  function refine(a, b, value, tolerance = 1e-7) {
    let fa = value(a),
      fb = value(b),
      best = Math.abs(fa) < Math.abs(fb) ? a : b;
    if (!(fa * fb < 0)) throw new Error("ambiguous_station_contact");
    for (let i = 0; i < 80; i++) {
      check();
      const middle = Math.floor((time(a) + time(b)) / 2);
      if (middle <= time(a) || middle >= time(b)) break;
      const p = between(middle, a, b),
        fp = value(p);
      if (Math.abs(fp) < Math.abs(value(best))) best = p;
      if (time(b) - time(a) <= 30000 && Math.abs(value(best)) <= tolerance)
        return { ...plain(best), bracket: [plain(a), plain(b)] };
      if (fp === 0) {
        const radius = Math.max(1, Math.min(10000, Math.floor((time(b) - time(a)) / 4)));
        const left = between(middle - radius, a, b),
          right = between(middle + radius, a, b);
        if (value(left) * value(right) < 0) {
          a = left;
          b = right;
          fa = value(a);
          fb = value(b);
          continue;
        }
        throw new Error("ambiguous_station_contact");
      }
      if (fa * fp < 0) {
        b = p;
        fb = fp;
      } else {
        a = p;
        fa = fp;
      }
      if (time(best) < time(a) || time(best) > time(b)) best = Math.abs(fa) < Math.abs(fb) ? a : b;
    }
    if (time(b) - time(a) <= 60000 && Math.abs(value(best)) <= tolerance && value(a) * value(b) < 0)
      return { ...plain(best), bracket: [plain(a), plain(b)] };
    throw new Error("ambiguous_station_contact");
  }
  function scan(from, to) {
    const grid = [point(from)];
    // Half-day initial cells. Their midpoints also check motion/curvature;
    // uncertain cells recursively refine before any monotonicity claim.
    function cell(a, b, depth = 0) {
      const mid = between(Math.floor((time(a) + time(b)) / 2), a, b);
      const speeds = [a.speed, mid.speed, b.speed],
        signs = speeds.map(sign);
      const deviation = Math.abs(
        mid.unwrappedLongitude - (a.unwrappedLongitude + b.unwrappedLongitude) / 2,
      );
      const bend = Math.abs(mid.speed - (a.speed + b.speed) / 2);
      const unresolved =
        signs[0] === signs[1] &&
        signs[1] === signs[2] &&
        signs[0] !== 0 &&
        Math.min(...speeds.map(Math.abs)) < 2 * bend;
      if ((unresolved || deviation > 0.001 || bend > 0.001) && time(b) - time(a) > 60000) {
        if (depth >= 16) throw new Error("ambiguous_station_contact");
        cell(a, mid, depth + 1);
        cell(mid, b, depth + 1);
      } else grid.push(mid, b);
    }
    for (let ms = from; ms < to;) {
      const next = Math.min(to, ms + DAY / 2),
        a = grid.at(-1),
        b = point(next, a.unwrappedLongitude);
      cell(a, b);
      ms = next;
    }
    const stations = [];
    let last = grid.find((p) => sign(p.speed) !== 0);
    if (!last) throw new Error("ambiguous_station_contact");
    for (const p of grid) {
      if (time(p) <= time(last) || sign(p.speed) === 0) continue;
      if (sign(last.speed) !== sign(p.speed)) {
        // Analytic Swiss speeds have a small numerical noise floor. This
        // remains twice as strict as the wire validator's 1e-7 deg/day bound.
        const station = refine(last, p, (p) => p.speed, 5e-8);
        if (!stations.length || time(station) - time(stations.at(-1)) > 60000)
          stations.push({
            ...station,
            id: `s${stations.length}`,
            directionBefore: direction(last.speed),
            directionAfter: direction(p.speed),
          });
        else throw new Error("ambiguous_station_contact");
      }
      last = p;
    }
    if (stations.length > 40) throw new Error("output_limit");
    const ends = [grid[0], ...stations, grid.at(-1)];
    const legs = ends.slice(0, -1).map((start, i) => ({
      id: `l${i}`,
      start: plain(start),
      end: plain(ends[i + 1]),
      direction: direction(ends[i + 1].unwrappedLongitude - start.unwrappedLongitude),
      startStationId: i ? stations[i - 1].id : null,
      endStationId: i < stations.length ? stations[i].id : null,
    }));
    for (const leg of legs) {
      const s = leg.direction === "direct" ? 1 : -1;
      const points = grid.filter((p) => time(p) >= time(leg.start) && time(p) <= time(leg.end));
      if (
        points.some(
          (p, i) =>
            p.speed * s < -1e-7 ||
            (i && (p.unwrappedLongitude - points[i - 1].unwrappedLongitude) * s < -1e-6),
        )
      )
        throw new Error("ambiguous_station_contact");
    }
    return { stations, legs, grid };
  }
  return { point, between, refine, scan, check, evaluations: () => cache.size };
}
