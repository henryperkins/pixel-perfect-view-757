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
