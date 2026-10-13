// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { validateEventRange, DAY } from "./contract.mjs";
export const LUNATION_SOLVER_VERSION = "lunations-eclipses-1";
// Native shadow searches need ephemeris coverage beyond the requested end.
// Reserve a full year, rather than allowing an end-range native fallback.
export const LUNATION_COVERAGE_END = Date.parse("2399-01-01T00:00:00.000Z");
const norm = (a) => ((a % 360) + 360) % 360;
const distance = (a) => norm(a + 180) - 180;
const eclipseKind = (type, mask) =>
  type === "lunar"
    ? mask & 4
      ? "lunar-total"
      : mask & 16
        ? "lunar-partial"
        : mask & 64
          ? "lunar-penumbral"
          : null
    : mask & 32
      ? "solar-hybrid"
      : mask & 4
        ? "solar-total"
        : mask & 8
          ? "solar-annular"
          : mask & 16
            ? "solar-partial"
            : null;
/** Lunar phases use native relative geometry; eclipse classes use native shadow routines. */
export function calculateLunations(
  input,
  engine,
  { maxDurationMs = 4000, now = () => performance.now() } = {},
) {
  const { from, to } = validateEventRange(input, engine.sourceId);
  if (from < engine.coverage.from || to > Math.min(engine.coverage.to, LUNATION_COVERAGE_END))
    throw Error("source_range");
  const started = now(),
    cache = new Map(),
    events = new Map();
  const check = () => {
    if (now() - started >= Math.min(4000, maxDurationMs)) throw Error("time_limit");
  };
  const geometry = (ms) => {
    check();
    ms = Math.round(ms);
    if (cache.has(ms)) return cache.get(ms);
    if (cache.size >= 6000) throw Error("evaluation_limit");
    const sun = engine.position("sun", ms),
      moon = engine.position("moon", ms);
    const p = {
      sunLongitude: sun.longitude,
      moonLongitude: moon.longitude,
      elongationDegrees: norm(moon.longitude - sun.longitude),
    };
    cache.set(ms, p);
    return p;
  };
  const add = (kind, ms, target = null, classification = null) => {
    const at = new Date(Math.round(ms / 1000) * 1000).toISOString(),
      stamp = Date.parse(at);
    if (stamp < from || stamp >= to) return;
    const g = geometry(stamp),
      residual = target === null ? null : Math.abs(distance(g.elongationDegrees - target));
    if (residual !== null && residual > 0.001) throw Error("unqualified_source");
    // A phase/shadow kind has at most one global event on a UTC date. The ID
    // therefore remains stable when query endpoints or root brackets change.
    const id =
      "sky:" +
      createHash("sha256")
        .update(JSON.stringify([LUNATION_SOLVER_VERSION, engine.sourceId, kind, at.slice(0, 10)]))
        .digest("hex")
        .slice(0, 32);
    events.set(id, {
      id,
      kind,
      at,
      ...g,
      targetDegrees: target,
      residualDegrees: residual,
      nativeClassification: classification,
      sourceId: engine.sourceId,
      localVisibility: null,
      uncertaintySeconds: 60,
    });
  };
  const step = DAY / 4,
    begin = Math.max(engine.coverage.from, Math.floor((from - step) / step) * step),
    end = Math.min(engine.coverage.to, to + step);
  for (let a = begin; a < end; a += step) {
    const b = Math.min(end, a + step),
      ga = geometry(a),
      gb = geometry(b);
    for (const [kind, target] of [
      ["new-moon", 0],
      ["full-moon", 180],
    ]) {
      let lo = a,
        hi = b,
        fl = distance(ga.elongationDegrees - target),
        fh = distance(gb.elongationDegrees - target);
      if (fl === 0) {
        add(kind, a, target);
        continue;
      }
      if (!(fl < 0 && fh >= 0) || Math.abs(fh - fl) > 180) continue;
      for (let n = 0; n < 40 && hi - lo > 0.5; n++) {
        const mid = (lo + hi) / 2,
          fm = distance(geometry(mid).elongationDegrees - target);
        if (fm >= 0) {
          hi = mid;
          fh = fm;
        } else {
          lo = mid;
          fl = fm;
        }
      }
      add(kind, (lo + hi) / 2, target);
    }
  }
  for (const type of ["solar", "lunar"]) {
    let cursor = Math.max(engine.coverage.from, from - DAY);
    for (let n = 0; n < 12; n++) {
      check();
      const e = engine.eclipseAfter(type, cursor);
      if (e.at >= to + 1000) break;
      if (e.at <= cursor) throw Error("unqualified_source");
      const kind = eclipseKind(type, e.classification);
      if (!kind) throw Error("unqualified_source");
      add(kind, e.at, null, e.classification);
      cursor = e.at + DAY;
      if (n === 11) throw Error("output_limit");
    }
  }
  const list = [...events.values()].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at) || a.kind.localeCompare(b.kind),
  );
  if (list.length > 40) throw Error("output_limit");
  check();
  return {
    status: "complete",
    contract: "swiss-astronomy-events/1",
    solverVersion: LUNATION_SOLVER_VERSION,
    sourceId: engine.sourceId,
    source: engine.source,
    range: {
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
      boundary: "half-open",
    },
    events: list,
  };
}
