import { useEffect, useRef, useState } from "react";
import {
  createPlaceLookup,
  validPlaceFields,
  type PlaceCandidate,
  type PlaceFields,
} from "@/lib/place-lookup";

const TYPEAHEAD_DEBOUNCE_MS = 350;
const TYPEAHEAD_MIN_CHARS = 2;

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
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (debounce.current) clearTimeout(debounce.current);
      request.invalidate();
    },
    [request],
  );
  function cancelScheduled() {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = null;
  }
  function replaceCandidates(next: PlaceCandidate[]) {
    candidatesRef.current = next;
    setCandidates(next);
  }
  function invalidate(next: "unresolved" | "manual" | "saved" = "unresolved") {
    version.current++;
    cancelScheduled();
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
    cancelScheduled();
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
  async function lookup(query: string = fields.placeLabel) {
    invalidate();
    if (!query.trim()) {
      setError("Enter a city or town to search.");
      return;
    }
    const mine = ++version.current;
    setPending(true);
    setError(null);
    setResolution("unresolved");
    try {
      const result = await request.lookup(query);
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
  /** Debounced typeahead: silently skips short input; never replaces explicit search errors. */
  function scheduleLookup(query: string) {
    cancelScheduled();
    if (query.trim().length < TYPEAHEAD_MIN_CHARS) return;
    debounce.current = setTimeout(() => {
      debounce.current = null;
      void lookup(query);
    }, TYPEAHEAD_DEBOUNCE_MS);
  }
  return {
    lookup,
    scheduleLookup,
    select,
    invalidate,
    candidates,
    pending,
    resolution,
    error,
    ready: !pending && resolution !== "unresolved" && validPlaceFields(fields),
  };
}
