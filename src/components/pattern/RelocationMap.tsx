import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { AngleKind, CartoLine } from "@/lib/astro/astrocartography";

const LIGHT_STYLE = "mapbox://styles/mapbox/light-v11";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";
const SOURCE = "carto-lines";
export const ANGLE_TOKEN: Record<AngleKind, string> = {
  MC: "--chart-1",
  IC: "--chart-2",
  AC: "--chart-3",
  DC: "--chart-4",
};

function isDark() {
  return document.documentElement.classList.contains("dark");
}

/** Resolve a theme token (oklch) to rgb, which Mapbox styles accept. */
function tokenRgb(token: string, fallback: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!raw) return fallback;
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

function featureCollection(lines: CartoLine[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: lines.map((l) => ({
      type: "Feature",
      properties: { id: l.id, angle: l.angle, label: `${l.label} ${l.angle}` },
      geometry: { type: "MultiLineString", coordinates: l.segments },
    })),
  };
}

export default function RelocationMap({
  lines,
  selected,
  onPick,
}: {
  lines: CartoLine[];
  selected: { latitude: number; longitude: number; label: string } | null;
  onPick: (latitude: number, longitude: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const token = import.meta.env["VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN"] as string | undefined;

  useEffect(() => {
    if (!container.current || !token) return;
    mapboxgl.accessToken = token;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = new mapboxgl.Map({
      container: container.current,
      style: isDark() ? DARK_STYLE : LIGHT_STYLE,
      center: [0, 25],
      zoom: 0.9,
      projection: "equirectangular",
      renderWorldCopies: false,
      fadeDuration: reduced ? 0 : 300,
      attributionControl: false,
      cooperativeGestures: true,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const install = () => {
      if (map.getSource(SOURCE)) return;
      map.addSource(SOURCE, { type: "geojson", data: featureCollection(linesRef.current) });
      const color: mapboxgl.ExpressionSpecification = [
        "match",
        ["get", "angle"],
        "MC",
        tokenRgb(ANGLE_TOKEN.MC, "#4f8a5b"),
        "IC",
        tokenRgb(ANGLE_TOKEN.IC, "#4a8a92"),
        "AC",
        tokenRgb(ANGLE_TOKEN.AC, "#a77a3a"),
        tokenRgb(ANGLE_TOKEN.DC, "#8a5a7a"),
      ];
      map.addLayer({
        id: SOURCE,
        type: "line",
        source: SOURCE,
        paint: { "line-color": color, "line-width": 2, "line-opacity": 0.85 },
      });
      map.addLayer({
        id: `${SOURCE}-labels`,
        type: "symbol",
        source: SOURCE,
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "label"],
          "text-size": 11,
          "symbol-spacing": 320,
        },
        paint: { "text-color": color, "text-halo-width": 1.5, "text-halo-color": isDark() ? "#111" : "#fff" },
      });
    };
    map.on("style.load", install);
    map.on("click", (e) => pickRef.current(e.lngLat.lat, e.lngLat.lng));
    mapRef.current = map;
    const theme = new MutationObserver(() => map.setStyle(isDark() ? DARK_STYLE : LIGHT_STYLE));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      theme.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const src = mapRef.current?.getSource(SOURCE) as mapboxgl.GeoJSONSource | undefined;
    src?.setData(featureCollection(lines));
  }, [lines]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (!selected) return;
    markerRef.current = new mapboxgl.Marker({ color: tokenRgb("--primary", "#3b5f4b") })
      .setLngLat([selected.longitude, selected.latitude])
      .addTo(map);
  }, [selected]);

  if (!token)
    return (
      <p className="border border-rule p-4 text-sm text-muted-foreground">
        The world map isn’t available right now. You can still search a city below.
      </p>
    );
  return (
    <div className="overflow-hidden rounded-sm border border-rule">
      <div
        ref={container}
        className="h-[340px] w-full sm:h-[460px]"
        role="region"
        aria-label="World map of your planetary lines. Tap or click a spot to explore it."
      />
    </div>
  );
}
