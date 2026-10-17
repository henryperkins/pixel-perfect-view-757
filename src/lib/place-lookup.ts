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

const LOOKUP_FAILURE =
  "We couldn't look up that place. Check your connection and try again, or enter coordinates manually.";
const NO_MATCH =
  "No matching places found. Check the spelling, try another name for the same place, or enter coordinates manually.";

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

function placeCandidate(value: unknown): PlaceCandidate | null {
  if (!value || typeof value !== "object") return null;
  const hit = value as Record<string, unknown>;
  if (
    typeof hit["name"] !== "string" ||
    !hit["name"].trim() ||
    typeof hit["latitude"] !== "number" ||
    typeof hit["longitude"] !== "number" ||
    typeof hit["timezone"] !== "string"
  )
    return null;
  const label = [hit["name"], hit["admin2"], hit["admin1"], hit["country"]]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .map((part) => part.trim())
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
  const fields = {
    placeLabel: label,
    latitude: String(hit["latitude"]),
    longitude: String(hit["longitude"]),
    timezone: hit["timezone"].trim(),
  };
  // Validate before rounding so an out-of-range value cannot round into range.
  if (!validPlaceFields(fields)) return null;
  fields.latitude = hit["latitude"].toFixed(4);
  fields.longitude = hit["longitude"].toFixed(4);
  return {
    ...fields,
    label,
    id: JSON.stringify([label, fields.latitude, fields.longitude, fields.timezone]),
  };
}

export function createPlaceLookup(fetcher: typeof fetch = fetch) {
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
        const res = await fetcher(
          `https://geocoding-api.open-meteo.com/v1/search?count=5&name=${encodeURIComponent(placeLabel.trim())}`,
          { signal: controller.signal },
        );
        if (mine !== generation) return { status: "stale" };
        if (!res.ok) throw new Error(LOOKUP_FAILURE);
        json = await res.json();
      } catch {
        if (mine !== generation) return { status: "stale" };
        throw new Error(LOOKUP_FAILURE);
      }
      if (mine !== generation) return { status: "stale" };
      const results =
        json && typeof json === "object" ? (json as Record<string, unknown>)["results"] : null;
      const unique = new Map<string, PlaceCandidate>();
      if (Array.isArray(results)) {
        for (const hit of results.slice(0, 5)) {
          const candidate = placeCandidate(hit);
          if (candidate) unique.set(candidate.id, candidate);
        }
      }
      const candidates = [...unique.values()];
      if (!candidates.length) throw new Error(NO_MATCH);
      return { status: "candidates", candidates };
    },
  };
}
