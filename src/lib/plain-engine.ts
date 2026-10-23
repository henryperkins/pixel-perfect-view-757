/** Reader-facing names for calculation sources. Raw engine identifiers stay out of the interface. */
export function plainEngineLabel(engine: string | null | undefined): string {
  if (!engine) return "Unrecorded";
  const value = engine.toLowerCase();
  if (value.startsWith("swiss")) return "Swiss Ephemeris";
  if (
    value.includes("kepler") ||
    value.includes("approx") ||
    value.includes("analytical") ||
    value.includes("in-app")
  )
    return "Approximate fallback";
  return "Recorded calculation";
}

export function plainPrecision(precision: string | null | undefined): string {
  if (precision === "high") return "High";
  if (precision === "approximate") return "Approximate";
  return precision || "Unrecorded";
}

export function plainAccuracy(accuracy: string | null | undefined): string {
  switch (accuracy) {
    case "exact":
      return "Recorded to the minute";
    case "near":
      return "Within about 15 minutes";
    case "hour":
      return "Within about an hour";
    case "unknown":
      return "Unknown · noon assumed";
    default:
      return accuracy ? accuracy.replace(/[_-]+/g, " ") : "Unrecorded";
  }
}

/** Reader-facing explanation of a fallback calculation; raw transport text stays in logs. */
export function plainDegradedReason(reason: string | null | undefined): string {
  if (!reason) {
    return "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.";
  }
  const value = reason.toLowerCase();
  if (value.includes("not configured")) {
    return "High-precision positions were not configured, so this chart uses the in-app approximate engine.";
  }
  if (
    value.includes("http") ||
    value.includes("unreachable") ||
    value.includes("timeout") ||
    value.includes("did not respond") ||
    value.includes("fetch")
  ) {
    return "The Swiss Ephemeris service was unavailable, so this chart uses the in-app approximate engine.";
  }
  if (
    value.includes("omitted") ||
    value.includes("recognisable") ||
    value.includes("recognizable") ||
    value.includes("incomplete")
  ) {
    return "The Swiss Ephemeris service returned incomplete positions, so this chart uses the in-app approximate engine.";
  }
  if (value.includes("in-app") || value.includes("approximate")) {
    return "This chart was computed with the in-app approximate engine.";
  }
  return "This chart uses the in-app approximate engine.";
}
