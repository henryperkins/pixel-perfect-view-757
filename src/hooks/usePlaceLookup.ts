import { useEffect, useRef, useState } from "react";
import {
  createPlaceLookup,
  validPlaceFields,
  type PlaceCandidate,
  type PlaceFields,
} from "@/lib/place-lookup";
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
  const candidatesRef = useRef<PlaceCandidate[]>([]);
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<"unresolved" | "manual" | "lookup" | "saved">(
    initialResolution,
  );
  useEffect(
    () => () => {
      version.current++;
      candidatesRef.current = [];
      request.invalidate();
    },
    [request],
  );
  function replaceCandidates(next: PlaceCandidate[]) {
    candidatesRef.current = next;
    setCandidates(next);
  }
  function invalidate(next: "unresolved" | "manual" | "saved" = "unresolved") {
    version.current++;
    request.invalidate();
    setPending(false);
    setError(null);
    setResolution(next);
    replaceCandidates([]);
  }
  function select(candidate: PlaceCandidate) {
    // Consult the current request's list, including before React has rerendered
    // after an edit, so an obsolete result cannot replace newer input.
    const selected = candidatesRef.current.find((item) => item.id === candidate.id);
    if (!selected) return false;
    version.current++;
    request.invalidate();
    replaceCandidates([]);
    setPending(false);
    setError(null);
    onResolve({
      placeLabel: selected.placeLabel,
      latitude: selected.latitude,
      longitude: selected.longitude,
      timezone: selected.timezone,
    });
    setResolution("lookup");
    return true;
  }
  async function lookup() {
    invalidate();
    if (!fields.placeLabel.trim()) {
      setError("Enter a city or town to search.");
      return;
    }
    const mine = ++version.current;
    setPending(true);
    setError(null);
    setResolution("unresolved");
    try {
      const result = await request.lookup(fields.placeLabel);
      if (mine === version.current && result.status === "candidates") {
        replaceCandidates(result.candidates);
      }
    } catch (failure) {
      if (mine === version.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "We couldn't look up that place. Try again, or enter coordinates manually.",
        );
    } finally {
      if (mine === version.current) setPending(false);
    }
  }
  return {
    lookup,
    select,
    invalidate,
    candidates,
    pending,
    resolution,
    error,
    ready: !pending && resolution !== "unresolved" && validPlaceFields(fields),
  };
}
