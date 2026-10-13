// SPDX-License-Identifier: AGPL-3.0-or-later
// Independent qualification tool: never imports the candidate engine or solver.
import sweph from "sweph";
import { fileURLToPath } from "node:url";
const angles = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  quincunx: 150,
  opposition: 180,
};
const bodies = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
};
const near = (lon, target) => lon + 360 * Math.round((target - lon) / 360);
let initialized = false;
export function referencePosition(body, ms) {
  const d = new Date(ms);
  if (!initialized) {
    sweph.set_ephe_path(
      process.env.SE_EPHE_PATH || fileURLToPath(new URL("../data/ephe/", import.meta.url)),
    );
    initialized = true;
  }
  const converted = sweph.utc_to_jd(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
    1,
  );
  if (converted.flag !== 0) throw new Error("reference_time_conversion");
  // ET is independently selected here; the candidate uses UT + calc_ut.
  const p = sweph.calc(converted.data[0], bodies[body], 258);
  if (p.flag !== 258 || !p.data.every(Number.isFinite)) throw new Error("reference_source");
  return { longitude: p.data[0], speed: p.data[3] };
}

export function enumerateReference(
  r,
  position = referencePosition,
  { from, to, stepMs = 3600000 },
) {
  const raw = [];
  for (let at = from; ; at = Math.min(to, at + stepMs)) {
    const p = position(r.transitBody, at);
    const lon = raw.length ? near(p.longitude, raw.at(-1)[1]) : p.longitude;
    raw.push([at, lon, p.speed]);
    if (at === to) break;
  }
  const refine = (a, b, f) => {
    let fa = f(a),
      fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    for (let i = 0; i < 80 && b - a > 500; i++) {
      const secant = Math.round((a * fb - b * fa) / (fb - fa));
      const mid =
        secant > a + (b - a) * 0.1 && secant < b - (b - a) * 0.1 ? secant : Math.floor((a + b) / 2);
      const fm = f(mid);
      if (fm === 0) return mid;
      if (fa * fm < 0) {
        b = mid;
        fb = fm;
      } else {
        a = mid;
        fa = fm;
      }
    }
    return Math.abs(fa) < Math.abs(fb) ? a : b;
  };
  const stations = [];
  let previous = raw.find((p) => Math.abs(p[2]) > 1e-12);
  for (const p of raw) {
    if (!previous || p[0] <= previous[0] || Math.abs(p[2]) <= 1e-12) continue;
    if (previous[2] * p[2] < 0) {
      const at = refine(previous[0], p[0], (t) => position(r.transitBody, t).speed);
      stations.push({
        at,
        longitude: near(position(r.transitBody, at).longitude, p[1]),
        directionBefore: previous[2] > 0 ? "direct" : "retrograde",
        directionAfter: p[2] > 0 ? "direct" : "retrograde",
      });
    }
    previous = p;
  }
  const samples = r.targets.map((target) => {
    const branches =
      angles[r.aspect] === 0 || angles[r.aspect] === 180 ? ["plus"] : ["plus", "minus"];
    const contacts = [];
    const root = (a, b, level) =>
      refine(a, b, (t) => near(position(r.transitBody, t).longitude, level) - level);
    for (let i = 1; i < raw.length; i++)
      for (const branch of branches) {
        const a = raw[i - 1],
          b = raw[i],
          base = target.longitude + (branch === "plus" ? angles[r.aspect] : -angles[r.aspect]);
        for (
          let turn = Math.ceil((Math.min(a[1], b[1]) - base) / 360);
          turn <= Math.floor((Math.max(a[1], b[1]) - base) / 360);
          turn++
        ) {
          const level = base + 360 * turn,
            at = root(a[0], b[0], level);
          if (
            contacts.some(
              (c) => c.branch === branch && c.turn === turn && Math.abs(c.at - at) < 1000,
            )
          )
            continue;
          const speed = position(r.transitBody, at).speed;
          contacts.push({
            at,
            level,
            branch,
            turn,
            direction: speed > 0 ? "direct" : "retrograde",
          });
        }
      }
    contacts.sort((a, b) => a.at - b.at);
    const windows = [];
    for (const level of new Set(contacts.map((c) => c.level))) {
      const edges = [];
      for (let i = 1; i < raw.length; i++)
        for (const side of [-1, 1]) {
          const a = raw[i - 1],
            b = raw[i],
            edge = level + side * r.maxOrbDegrees;
          if ((a[1] - edge) * (b[1] - edge) > 0) continue;
          const at = root(a[0], b[0], edge);
          if (edges.some((e) => Math.abs(e.at - at) < 1000)) continue;
          edges.push({ at, enter: position(r.transitBody, at).speed * side < 0 });
        }
      edges.sort((a, b) => a.at - b.at);
      let inside = Math.abs(raw[0][1] - level) < r.maxOrbDegrees,
        ingress = null;
      const save = (egress) => {
        const members = contacts.filter(
          (c) =>
            c.level === level && c.at >= (ingress ?? -Infinity) && c.at <= (egress ?? Infinity),
        );
        if (members.length) windows.push({ ingress, egress, contacts: members.map((c) => c.at) });
      };
      for (const e of edges) {
        if (e.enter) ingress = e.at;
        else save(e.at);
        inside = e.enter;
      }
      if (inside) save(null);
    }
    windows.sort((a, b) => (a.ingress ?? -Infinity) - (b.ingress ?? -Infinity));
    const legOf = (at) => stations.filter((s) => s.at < at).length;
    const groups = [];
    for (const c of contacts) {
      const group = groups.at(-1),
        last = group?.at(-1);
      if (last && last.level === c.level && legOf(c.at) === legOf(last.at) + 1) group.push(c);
      else groups.push([c]);
    }
    const legs = [raw[0][1], ...stations.map((s) => s.longitude), raw.at(-1)[1]];
    const components = groups.map((cs) => {
      const left = legOf(cs[0].at) - 1,
        right = legOf(cs.at(-1).at) + 1,
        level = cs[0].level;
      const closes = (i) =>
        i > 0 && i < legs.length - 2 && (legs[i] - level) * (legs[i + 1] - level) > 0;
      const ws = windows.filter((w) => cs.some((c) => w.contacts.includes(c.at)));
      return {
        contacts: cs.map((c) => c.at),
        complete:
          closes(left) && closes(right) && ws.every((w) => w.ingress !== null && w.egress !== null),
      };
    });
    const ambiguous = stations.some((s) =>
      branches.some((branch) => {
        const base = target.longitude + (branch === "plus" ? angles[r.aspect] : -angles[r.aspect]);
        return Math.abs(s.longitude - base - 360 * Math.round((s.longitude - base) / 360)) <= 0.001;
      }),
    );
    return { offsetMinutes: target.offsetMinutes, contacts, windows, components, ambiguous };
  });
  return {
    tool: "independent-dense-swiss-et-1",
    swissVersion: sweph.version(),
    stepMs,
    coverage: { from, to },
    stations,
    samples,
    raw,
  };
}
