interface EphemerisState {
  engine: string;
  precision: "high" | "approximate";
  degraded: boolean;
  degradedReason: string | null;
  transitEngine?: string;
  primaryTransitGeometry?: {
    engine: string;
    sourceId: string;
    cycleKey: string;
    referenceAt: string;
  } | null;
  eventTiming?: { engine: string; sourceId: string; solverVersion: string } | null;
}

/** Keep a material reading limit visible even when the source record is collapsed. */
export function TransitPrecisionNotice({
  state,
  className = "",
}: {
  state: EphemerisState | null | undefined;
  className?: string;
}) {
  if (!state?.transitEngine || (state.degraded && !state.primaryTransitGeometry)) return null;
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {state.primaryTransitGeometry
        ? "The main contact’s angle and orb use the timing calculation. Other transit angles and orbs are approximate."
        : "Transit angles and orbs are approximate."}
    </p>
  );
}

/**
 * Visible degraded state when the high-precision Swiss Ephemeris service was
 * not the source of the positions behind a claim.
 */
export function EphemerisNotice({
  state,
  className = "",
}: {
  state: EphemerisState | null | undefined;
  className?: string;
}) {
  if (!state) return null;

  if (!state.degraded) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        Natal positions come from the Swiss Ephemeris.
        {state.primaryTransitGeometry ? (
          <> The main contact’s angle and orb use that qualified timing.</>
        ) : null}
        {state.transitEngine ? (
          <>
            {" "}
            {state.primaryTransitGeometry
              ? "Other transit geometry and orbs are approximate."
              : "Current transit geometry and orb are approximate."}
          </>
        ) : null}
        {state.eventTiming ? <> Primary event timing uses the qualified timing service.</> : null}
      </p>
    );
  }

  return (
    <div role="status" className={`border border-rule bg-evidence px-4 py-3 ${className}`}>
      <p className="text-sm font-medium text-evidence-foreground">
        Approximate positions — reduced precision
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {state.degradedReason ??
          "The Swiss Ephemeris service was unavailable, so positions come from the in-app approximation."}{" "}
        Positions are accurate to roughly arc-minutes, so degree-exact and fast-Moon claims should
        be read as indicative rather than precise.
      </p>
    </div>
  );
}
