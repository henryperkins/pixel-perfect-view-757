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
      <p className={`technical text-muted-foreground ${className}`}>
        Natal positions from the Swiss Ephemeris service ·{" "}
        <span className="font-mono text-xs text-foreground">{state.engine}</span>
        {state.primaryTransitGeometry ? (
          <>
            . Primary transit geometry and orb ·{" "}
            <span className="font-mono text-xs text-foreground">
              {state.primaryTransitGeometry.engine}
            </span>
          </>
        ) : null}
        {state.transitEngine ? (
          <>
            .{" "}
            {state.primaryTransitGeometry
              ? "Other transit geometry and orbs are approximate"
              : "Current transit geometry and orb are approximate"}{" "}
            · <span className="font-mono text-xs text-foreground">{state.transitEngine}</span>
          </>
        ) : null}
        {state.eventTiming ? (
          <>
            . Primary event timing ·{" "}
            <span className="font-mono text-xs text-foreground">{state.eventTiming.engine}</span>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div role="status" className={`border-l-2 border-l-primary bg-evidence px-4 py-3 ${className}`}>
      <p className="technical text-evidence-foreground">
        Approximate ephemeris — degraded precision
      </p>
      <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">
        {state.degradedReason ??
          "The Swiss Ephemeris service was unavailable, so positions come from the in-app analytical engine."}{" "}
        Positions are accurate to roughly arc-minutes, so degree-exact and fast-Moon claims below
        should be read as indicative rather than precise.
      </p>
      <p className="mt-1.5 font-mono text-xs text-muted-foreground">
        Engine <span className="text-foreground">{state.engine}</span>
        {state.transitEngine ? (
          <>
            {" · transit scan "}
            <span className="text-foreground">{state.transitEngine}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
