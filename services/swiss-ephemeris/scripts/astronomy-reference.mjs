// SPDX-License-Identifier: AGPL-3.0-or-later
// Independent capture tool. No candidate engine, track or solver imports.
import sweph from "sweph";
import { referencePosition } from "./reference.mjs";
const DAY = 86400000,
  norm = (n) => ((n % 360) + 360) % 360,
  delta = (n) => norm(n + 180) - 180;
const jd = (ms) => {
  const d = new Date(ms);
  return sweph.utc_to_jd(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
    1,
  ).data[1];
};
const utc = (j) => {
  const d = sweph.jdut1_to_utc(j, 1);
  return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, 0) + d.second * 1000;
};
const geometry = (at) => {
  const sun = referencePosition("sun", at).longitude,
    moon = referencePosition("moon", at).longitude;
  return { sunLongitude: sun, moonLongitude: moon, elongationDegrees: norm(moon - sun) };
};
export function referenceLunations(from, to) {
  const a = Date.parse(from),
    b = Date.parse(to),
    events = [];
  const add = (kind, at) => {
    const ms = Math.round(at / 1000) * 1000;
    if (ms >= a && ms < b) events.push({ kind, at: new Date(ms).toISOString(), ...geometry(ms) });
  };
  for (let x = a - 3600000; x < b; x += 3600000)
    for (const [kind, target] of [
      ["new-moon", 0],
      ["full-moon", 180],
    ]) {
      let lo = x,
        hi = x + 3600000,
        fl = delta(geometry(lo).elongationDegrees - target),
        fh = delta(geometry(hi).elongationDegrees - target);
      if (fl === 0) {
        add(kind, lo);
        continue;
      }
      if (!(fl < 0 && fh >= 0) || Math.abs(fh - fl) > 180) continue;
      while (hi - lo > 50) {
        const m = Math.floor((lo + hi) / 2);
        if (delta(geometry(m).elongationDegrees - target) >= 0) hi = m;
        else lo = m;
      }
      add(kind, (lo + hi) / 2);
    }
  for (const type of ["solar", "lunar"]) {
    let cursor = a - DAY;
    for (let i = 0; i < 12; i++) {
      const r =
        type === "solar"
          ? sweph.sol_eclipse_when_glob(jd(cursor), 2, 0, false)
          : sweph.lun_eclipse_when(jd(cursor), 2, 0, false);
      if (r.flag <= 0) throw Error("reference_eclipse");
      const at = utc(r.data[0]);
      if (at >= b + 1000) break;
      const kind =
        type === "solar"
          ? r.flag & 32
            ? "solar-hybrid"
            : r.flag & 4
              ? "solar-total"
              : r.flag & 8
                ? "solar-annular"
                : "solar-partial"
          : r.flag & 4
            ? "lunar-total"
            : r.flag & 16
              ? "lunar-partial"
              : "lunar-penumbral";
      add(kind, at);
      cursor = at + DAY;
    }
  }
  return [...new Map(events.map((e) => [e.kind + e.at, e])).values()].sort(
    (x, y) => Date.parse(x.at) - Date.parse(y.at) || x.kind.localeCompare(y.kind),
  );
}
export function referenceSolar(input) {
  // referencePosition initializes the pinned native ephemeris directory.
  referencePosition("sun", Date.parse(input.from));
  const events = {};
  for (const [key, mode] of [
    ["sunriseUtc", 1],
    ["sunsetUtc", 2],
  ]) {
    const r = sweph.rise_trans(
      jd(Date.parse(input.from)),
      0,
      "",
      2,
      mode,
      [input.longitude, input.latitude, 0],
      1013.25,
      15,
    );
    if (![0, -2].includes(r.flag)) throw Error("reference_solar");
    const at = r.flag === -2 ? null : Math.round(utc(r.data) / 1000) * 1000;
    events[key] =
      at !== null && at >= Date.parse(input.from) && at < Date.parse(input.to)
        ? new Date(at).toISOString()
        : null;
  }
  return events;
}
