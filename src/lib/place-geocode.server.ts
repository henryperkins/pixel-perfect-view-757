/**
 * Birth place geocoding via the Lovable connector gateway (Mapbox Geocoding
 * v6) plus an offline timezone dataset. The provider key never reaches the
 * browser; candidates arrive normalized and are re-validated client-side.
 */

import tzlookup from "tz-lookup";
import { placeCandidate, type PlaceCandidate, type PlaceSearchResult } from "./place-lookup.ts";

const MAPBOX_API_BASE = "https://api.mapbox.com";
const GATEWAY_MAPBOX_BASE = "https://connector-gateway.lovable.dev/mapbox";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Map a Mapbox v6 GeoJSON feature to a validated candidate, or null. */
export function mapboxFeatureCandidate(feature: unknown): PlaceCandidate | null {
  if (!feature || typeof feature !== "object") return null;
  const f = feature as Record<string, unknown>;
  const properties = (f["properties"] ?? {}) as Record<string, unknown>;
  const geometry = (f["geometry"] ?? {}) as Record<string, unknown>;
  const coordinates = geometry["coordinates"];
  if (
    geometry["type"] !== "Point" ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    typeof coordinates[0] !== "number" ||
    typeof coordinates[1] !== "number"
  )
    return null;
  const longitude = coordinates[0],
    latitude = coordinates[1];
  const name = text(properties["name"]);
  if (!name) return null;
  const context = (properties["context"] ?? {}) as Record<string, unknown>;
  const contextName = (key: string) => {
    const entry = context[key];
    if (!entry || typeof entry !== "object") return null;
    return text((entry as Record<string, unknown>)["name"]);
  };
  const label = [name, contextName("district"), contextName("region"), contextName("country")]
    .filter((part): part is string => Boolean(part))
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
  if (!label) return null;
  let timezone: string;
  try {
    timezone = tzlookup(latitude, longitude);
  } catch {
    return null;
  }
  return placeCandidate({
    label,
    placeLabel: label,
    latitude,
    longitude,
    timezone,
  });
}

export async function searchPlaceCandidates(
  query: string,
  fetcher: typeof fetch = fetch,
): Promise<PlaceSearchResult> {
  const connectionApiKey = getEnv("MAPBOX_API_KEY");
  const params = new URLSearchParams({
    q: query,
    limit: "5",
    language: "en",
    types: "place,locality",
    access_token: connectionApiKey,
  });
  const url = `${MAPBOX_API_BASE}/search/geocode/v6/forward?${params.toString()}`;
  let json: unknown;
  try {
    const res = await fetcher(url.replace(MAPBOX_API_BASE, GATEWAY_MAPBOX_BASE), {
      headers: {
        "X-Connection-Api-Key": connectionApiKey,
        "Lovable-API-Key": getEnv("LOVABLE_API_KEY"),
      },
    });
    if (!res.ok) throw new Error(`geocode responded ${res.status}`);
    json = await res.json();
  } catch (error) {
    console.error("birth place geocode failed", error);
    return { status: "failed" };
  }
  const features =
    json && typeof json === "object" ? (json as Record<string, unknown>)["features"] : null;
  const unique = new Map<string, PlaceCandidate>();
  if (Array.isArray(features)) {
    for (const feature of features.slice(0, 5)) {
      const candidate = mapboxFeatureCandidate(feature);
      if (candidate) unique.set(candidate.id, candidate);
    }
  }
  const candidates = [...unique.values()];
  if (!candidates.length) return { status: "no_match" };
  return { status: "ok", candidates };
}
