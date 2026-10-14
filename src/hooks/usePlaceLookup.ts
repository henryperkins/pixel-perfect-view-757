import { useEffect, useRef, useState } from "react";
import { createPlaceLookup, validPlaceFields, type PlaceFields } from "@/lib/place-lookup";
export function usePlaceLookup({
  fields,
  onResolve,
  initialResolution = "unresolved",
}: {
  fields: PlaceFields;
  onResolve: (fields: PlaceFields) => void;
  initialResolution?: "saved" | "unresolved";
}) {
  const [request] = useState(() => createPlaceLookup());
  const version = useRef(0);
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<"unresolved" | "manual" | "lookup" | "saved">(
    initialResolution,
  );
  useEffect(
    () => () => {
      version.current++;
      request.invalidate();
    },
    [request],
  );
  function invalidate(next: "unresolved" | "manual" | "saved" = "unresolved") {
    version.current++;
    request.invalidate();
    setPending(false);
    setError(null);
    setResolution(next);
  }
  async function lookup() {
    if (!fields.placeLabel.trim()) return;
    const mine = ++version.current;
    setPending(true);
    setError(null);
    setResolution("unresolved");
    try {
      const result = await request.lookup(fields.placeLabel);
      if (mine === version.current && result.status === "resolved") {
        onResolve(result.fields);
        setResolution("lookup");
      }
    } catch (failure) {
      if (mine === version.current)
        setError(
          failure instanceof Error ? failure.message : "Lookup failed. Enter coordinates manually.",
        );
    } finally {
      if (mine === version.current) setPending(false);
    }
  }
  return {
    lookup,
    invalidate,
    pending,
    resolution,
    error,
    ready: !pending && resolution !== "unresolved" && validPlaceFields(fields),
  };
}
