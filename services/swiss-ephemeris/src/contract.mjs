// SPDX-License-Identifier: AGPL-3.0-or-later
export const DAY = 86400000;
export const ASPECTS = Object.freeze({
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  quincunx: 150,
  opposition: 180,
});
export const iso = (ms) => new Date(Math.round(ms)).toISOString();
export const time = (p) => Date.parse(p.at);
export const direction = (speed) => (speed > 0 ? "direct" : "retrograde");
export const plain = (p) => ({
  at: p.at,
  unwrappedLongitude: p.unwrappedLongitude,
  speed: p.speed,
});
export function utcInstant(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  )
    throw Error("invalid_request");
  const ms = Date.parse(value);
  const canonical = value.includes(".") ? value : value.slice(0, -1) + ".000Z";
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== canonical)
    throw Error("invalid_request");
  return ms;
}
export function validateEventRange(r, sourceId) {
  const keys = ["contract", "sourceId", "from", "to"];
  if (
    !r ||
    typeof r !== "object" ||
    Array.isArray(r) ||
    Object.keys(r).length !== keys.length ||
    Object.keys(r).some((k) => !keys.includes(k)) ||
    r.contract !== "swiss-astronomy-events/1"
  )
    throw Error("invalid_request");
  if (r.sourceId !== sourceId) throw Error("unqualified_source");
  const from = utcInstant(r.from),
    to = utcInstant(r.to);
  if (from >= to || to - from > 366 * DAY) throw Error("invalid_request");
  return { from, to };
}
export function validateRequest(r, sourceId) {
  const keys = [
    "contract",
    "solverVersion",
    "sourceId",
    "transitBody",
    "aspect",
    "targets",
    "referenceAt",
    "maxOrbDegrees",
  ];
  const invalid = () => {
    throw new Error("invalid_request");
  };
  if (
    !r ||
    typeof r !== "object" ||
    Array.isArray(r) ||
    Object.keys(r).length !== keys.length ||
    Object.keys(r).some((k) => !keys.includes(k))
  )
    invalid();
  if (
    r.contract !== "swiss-transit-episode/1" ||
    r.solverVersion !== "transit-episode-1" ||
    typeof r.sourceId !== "string" ||
    r.sourceId.length > 160 ||
    !r.sourceId
  )
    invalid();
  if (
    !["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(r.transitBody) ||
    !Object.hasOwn(ASPECTS, r.aspect) ||
    !Number.isFinite(r.maxOrbDegrees) ||
    r.maxOrbDegrees <= 0 ||
    r.maxOrbDegrees > 3
  )
    invalid();
  if (
    typeof r.referenceAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(r.referenceAt) ||
    !Number.isFinite(Date.parse(r.referenceAt)) ||
    iso(Date.parse(r.referenceAt)).slice(0, 19) !== r.referenceAt.slice(0, 19)
  )
    invalid();
  if (
    !Array.isArray(r.targets) ||
    r.targets.length !== 3 ||
    !r.targets.every(
      (t) =>
        t &&
        typeof t === "object" &&
        Object.keys(t).length === 2 &&
        Object.hasOwn(t, "offsetMinutes") &&
        Object.hasOwn(t, "longitude") &&
        Number.isFinite(t.longitude) &&
        t.longitude >= 0 &&
        t.longitude < 360,
    ) ||
    ![2, 15, 60].some((n) => r.targets.every((t, i) => t.offsetMinutes === [-n, 0, n][i]))
  )
    invalid();
  if (r.sourceId !== sourceId) throw new Error("unqualified_source");
  return r;
}
