// SPDX-License-Identifier: AGPL-3.0-or-later
import { utcInstant, DAY } from "./contract.mjs";
export const SOLAR_SOLVER_VERSION = "solar-civil-day-1";
const localDay = (ms, zone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  return ["year", "month", "day"].map((k) => parts.find((p) => p.type === k).value).join("-");
};
/** Standard pressure/temperature and sea-level upper limb; no weather inference. */
export function calculateSolarContext(input, engine) {
  const keys = ["contract", "sourceId", "day", "timeZone", "from", "to", "latitude", "longitude"];
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== keys.length ||
    Object.keys(input).some((k) => !keys.includes(k)) ||
    input.contract !== "swiss-solar-context/1" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.day) ||
    typeof input.timeZone !== "string" ||
    input.timeZone.length > 80 ||
    !Number.isFinite(input.latitude) ||
    Math.abs(input.latitude) > 90 ||
    !Number.isFinite(input.longitude) ||
    Math.abs(input.longitude) > 180
  )
    throw Error("invalid_request");
  if (input.sourceId !== engine.sourceId) throw Error("unqualified_source");
  const from = utcInstant(input.from),
    to = utcInstant(input.to);
  if (from < engine.coverage.from || to > engine.coverage.to) throw Error("source_range");
  if (to - from < (21 * DAY) / 24 || to - from > (27 * DAY) / 24) throw Error("invalid_request");
  try {
    if (
      localDay(from, input.timeZone) !== input.day ||
      localDay(from - 1, input.timeZone) === input.day ||
      localDay(to - 1, input.timeZone) !== input.day ||
      localDay(to, input.timeZone) === input.day
    )
      throw Error("invalid_request");
  } catch {
    throw Error("invalid_request");
  }
  const rise = engine.solarEvent(from, input.latitude, input.longitude, "rise"),
    set = engine.solarEvent(from, input.latitude, input.longitude, "set");
  const inside = (at) => at !== null && at >= from && at < to;
  const sunrise = inside(rise) ? rise : null,
    sunset = inside(set) ? set : null;
  let daylight = "ordinary",
    minutes;
  if (rise === null && set === null) {
    const upper = engine.solarEvent(from, input.latitude, input.longitude, "upper");
    if (upper === null) throw Error("unqualified_source");
    daylight = engine.sunAboveHorizon(upper, input.latitude, input.longitude)
      ? "polar_day"
      : "polar_night";
    minutes = daylight === "polar_day" ? (to - from) / 60000 : 0;
  } else if (sunrise !== null && sunset !== null)
    minutes = (sunset - sunrise + (sunset < sunrise ? to - from : 0)) / 60000;
  else if (sunrise !== null) minutes = (to - sunrise) / 60000;
  else if (sunset !== null) minutes = (sunset - from) / 60000;
  else
    minutes = engine.sunAboveHorizon((from + to) / 2, input.latitude, input.longitude)
      ? (to - from) / 60000
      : 0;
  return {
    contract: "swiss-solar-context/1",
    solverVersion: SOLAR_SOLVER_VERSION,
    sourceId: engine.sourceId,
    source: engine.source,
    day: input.day,
    timeZone: input.timeZone,
    range: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
    daylight,
    sunriseUtc: sunrise === null ? null : new Date(Math.round(sunrise / 1000) * 1000).toISOString(),
    sunsetUtc: sunset === null ? null : new Date(Math.round(sunset / 1000) * 1000).toISOString(),
    daylightMinutes: Math.round(minutes),
    precision: "native-for-supplied-location",
    convention: "apparent-upper-limb; sea-level; 1013.25hPa; 15C",
    uncertaintySeconds: 60,
  };
}
