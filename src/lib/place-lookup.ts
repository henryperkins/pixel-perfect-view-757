export type PlaceFields = {
  placeLabel: string;
  latitude: string;
  longitude: string;
  timezone: string;
};
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
    ): Promise<{ status: "stale" } | { status: "resolved"; fields: PlaceFields }> {
      const mine = ++generation;
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetcher(
          `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(placeLabel.trim())}`,
          { signal: controller.signal },
        );
        if (mine !== generation) return { status: "stale" };
        if (!res.ok) throw new Error("Lookup failed. Enter coordinates manually.");
        const json = await res.json();
        if (mine !== generation) return { status: "stale" };
        const hit = json?.results?.[0];
        if (
          !hit ||
          typeof hit.name !== "string" ||
          typeof hit.latitude !== "number" ||
          typeof hit.longitude !== "number" ||
          typeof hit.timezone !== "string"
        )
          throw new Error("No match. Enter coordinates manually.");
        const fields = {
          placeLabel: typeof hit.country === "string" ? `${hit.name}, ${hit.country}` : hit.name,
          latitude: hit.latitude.toFixed(4),
          longitude: hit.longitude.toFixed(4),
          timezone: hit.timezone,
        };
        if (!validPlaceFields(fields))
          throw new Error("Invalid coordinates. Enter coordinates manually.");
        return { status: "resolved", fields };
      } catch (error) {
        if (mine !== generation) return { status: "stale" };
        throw error;
      }
    },
  };
}
