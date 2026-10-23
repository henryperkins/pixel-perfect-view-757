import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const LIGHT_STYLE = "mapbox://styles/mapbox/light-v11";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function markerColor() {
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  return primary || "#3b5f4b";
}

/**
 * Confirmation preview for a resolved birth place. Rendered lazily so the
 * map bundle stays out of the initial chunk; positions itself without
 * animation so nothing moves for reduced-motion readers.
 */
export default function BirthPlaceMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const position = useRef({ latitude, longitude });
  position.current = { latitude, longitude };
  const token = import.meta.env["VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN"] as string | undefined;

  useEffect(() => {
    if (!container.current || !token) return;
    mapboxgl.accessToken = token;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = new mapboxgl.Map({
      container: container.current,
      style: isDark() ? DARK_STYLE : LIGHT_STYLE,
      center: [position.current.longitude, position.current.latitude],
      zoom: 9,
      fadeDuration: reduced ? 0 : 300,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    markerRef.current = new mapboxgl.Marker({ color: markerColor() })
      .setLngLat([position.current.longitude, position.current.latitude])
      .addTo(map);
    mapRef.current = map;
    const theme = new MutationObserver(() => {
      map.setStyle(isDark() ? DARK_STYLE : LIGHT_STYLE);
    });
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
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setLngLat([longitude, latitude]);
    map.jumpTo({ center: [longitude, latitude] });
  }, [latitude, longitude]);

  if (!token) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-sm border border-rule">
      <div
        ref={container}
        className="h-56 w-full"
        role="region"
        aria-label={`Map preview of ${label}`}
      />
    </div>
  );
}
