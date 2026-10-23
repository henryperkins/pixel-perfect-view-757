export type PlaceFields = {
  placeLabel: string;
  latitude: string;
  longitude: string;
  timezone: string;
};
export type PlaceCandidate = PlaceFields & {
  id: string;
  label: string;
};

export const PLACE_LOOKUP_FAILURE =
  "We couldn't look up that place. Check your connection and try again, or enter coordinates manually.";
export const PLACE_NO_MATCH =
  "No matching places found. Check the spelling, try another name for the same place, or enter coordinates manually.";

/** Server search outcomes travel as data so error text never crosses the wire. */
export type PlaceSearchResult =
  { status: "ok"; candidates: PlaceCandidate[] } | { status: "no_match" } | { status: "failed" };

export function validPlaceFields(fields: PlaceFields) {
  if (
    !fields.placeLabel.trim() ||
    !fields.latitude.trim() ||
    !fields.longitude.trim() ||
    !fields.timezone.trim()
  )
    return false;
  const latitude = Number(fields.latitude),
    longitude = Number(fields.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  )
    return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: fields.timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate and normalize one candidate, whether built server-side from a
 * geocoder hit or re-checked client-side after crossing the wire.
 */
export function placeCandidate(value: unknown): PlaceCandidate | null {
  if (!value || typeof value !== "object") return null;
  const hit = value as Record<string, unknown>;
  const rawLatitude = hit["latitude"],
    rawLongitude = hit["longitude"];
  if (
    typeof hit["placeLabel"] !== "string" ||
    !hit["placeLabel"].trim() ||
    typeof hit["label"] !== "string" ||
    !hit["label"].trim() ||
    (typeof rawLatitude !== "string" && typeof rawLatitude !== "number") ||
    (typeof rawLongitude !== "string" && typeof rawLongitude !== "number") ||
    typeof hit["timezone"] !== "string"
  )
    return null;
  const latitude = Number(rawLatitude),
    longitude = Number(rawLongitude);
  const fields = {
    placeLabel: hit["placeLabel"].trim(),
    latitude: String(rawLatitude).trim(),
    longitude: String(rawLongitude).trim(),
    timezone: hit["timezone"].trim(),
  };
  // Validate before rounding so an out-of-range value cannot round into range.
  if (!validPlaceFields(fields)) return null;
  fields.latitude = latitude.toFixed(4);
  fields.longitude = longitude.toFixed(4);
  return {
    ...fields,
    label: hit["label"].trim(),
    id: JSON.stringify([hit["label"].trim(), fields.latitude, fields.longitude, fields.timezone]),
  };
}

export type PlaceLookupTransport = (query: string, signal: AbortSignal) => Promise<unknown>;

/** The default transport resolves through our server so provider keys stay private. */
const serverTransport: PlaceLookupTransport = async (query) => {
  const m = await import("./place-lookup.functions");
  return m.searchBirthPlaces({ data: query });
};

export function createPlaceLookup(transport: PlaceLookupTransport = serverTransport) {
  let generation = 0,
    controller: AbortController | null = null;
  return {
    invalidate() {
      generation++;
      controller?.abort();
      controller = null;
    },
    async lookup(
      placeLabel: string,
    ): Promise<{ status: "stale" } | { status: "candidates"; candidates: PlaceCandidate[] }> {
      const mine = ++generation;
      controller?.abort();
      controller = new AbortController();
      let json: unknown;
      try {
        json = await transport(placeLabel.trim(), controller.signal);
        if (mine !== generation) return { status: "stale" };
      } catch {
        if (mine !== generation) return { status: "stale" };
        throw new Error(PLACE_LOOKUP_FAILURE);
      }
      const result = (json ?? {}) as Partial<PlaceSearchResult>;
      if (result.status === "failed") throw new Error(PLACE_LOOKUP_FAILURE);
      const results =
        result.status === "ok" && Array.isArray(result.candidates) ? result.candidates : [];
      const unique = new Map<string, PlaceCandidate>();
      for (const hit of results.slice(0, 5)) {
        const candidate = placeCandidate(hit);
        if (candidate) unique.set(candidate.id, candidate);
      }
      const candidates = [...unique.values()];
      if (!candidates.length) throw new Error(PLACE_NO_MATCH);
      return { status: "candidates", candidates };
    },
  };
}
