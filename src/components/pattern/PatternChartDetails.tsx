import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";

import { Field } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { bodyName, type PatternData } from "./pattern-view";

const ASPECT_ORDER = ["conjunction", "opposition", "square", "trine", "sextile", "quincunx"];
const ASPECT_LABEL: Record<string, string> = {
  conjunction: "Blended",
  opposition: "Pulled apart",
  square: "Friction",
  trine: "Easy flow",
  sextile: "Light support",
  quincunx: "Quincunx",
};
const ASPECT_MEANING: Record<string, string> = {
  conjunction: "Same place in the sky — the two blend and act as one.",
  opposition: "Facing each other — a pull between two needs.",
  square: "At right angles — friction that asks for a decision.",
  trine: "In easy flow — capacity that comes naturally.",
  sextile: "Mild support — works when you reach for it.",
  quincunx: "150° between two bodies.",
};
const ASPECT_DEG: Record<string, number> = {
  conjunction: 0,
  opposition: 180,
  square: 90,
  trine: 120,
  sextile: 60,
  quincunx: 150,
};

function AngleGlyph({ kind }: { kind: string }) {
  const degrees = ASPECT_DEG[kind];
  const radians = (((degrees ?? 0) - 90) * Math.PI) / 180;
  const x = 18 + 14 * Math.cos(radians);
  const y = 18 + 14 * Math.sin(radians);
  return (
    <svg viewBox="0 0 36 36" className="pattern-angle-glyph" aria-hidden="true">
      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.25" />
      {degrees !== undefined ? (
        <>
          <line x1="18" y1="18" x2="18" y2="4" stroke="currentColor" />
          <line x1="18" y1="18" x2={x} y2={y} stroke="currentColor" />
          <circle cx="18" cy="4" r="2.5" fill="currentColor" />
          <circle cx={x} cy={y} r="2.5" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}

function PatternConnections({ data }: { data: PatternData }) {
  const [kind, setKind] = useState("all");
  // The backend also sends a 20-row preview; this view uses the complete calculated list.
  const aspects = data.allAspects;
  const present = new Set<string>(aspects.map((aspect) => aspect.aspect));
  const kinds = ASPECT_ORDER.filter((value) => present.has(value)).concat(
    [...present].filter((value) => !ASPECT_ORDER.includes(value)),
  );
  const selected = kind === "all" || present.has(kind) ? kind : "all";

  return (
    <div>
      <p className="pattern-detail-copy">
        Pairs that interact in your chart. The orb is the distance from an exact angle; a smaller
        number means a closer connection.
      </p>
      {aspects.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No connections inside the orb limits for this chart.
        </p>
      ) : (
        <>
          {kinds.length > 1 ? (
            <div className="pattern-options" role="group" aria-label="Connection type">
              {["all", ...kinds].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  aria-pressed={selected === value}
                  aria-controls="pattern-connections"
                  onClick={() => setKind(value)}
                >
                  {value === "all" ? "All connections" : (ASPECT_LABEL[value] ?? bodyName(value))}
                </Button>
              ))}
            </div>
          ) : null}
          <div id="pattern-connections" className="pattern-connection-groups">
            {kinds
              .filter((value) => selected === "all" || value === selected)
              .map((value) => {
                const rows = aspects
                  .filter((aspect) => aspect.aspect === value)
                  .sort((a, b) => a.orb - b.orb);
                return (
                  <div key={value} className="pattern-connection-group">
                    <div className="flex items-center gap-3">
                      <AngleGlyph kind={value} />
                      <div className="min-w-0">
                        <h4>
                          {ASPECT_LABEL[value] ?? bodyName(value)}
                          <span className="ml-2 font-sans text-xs text-muted-foreground">
                            {rows.length}
                          </span>
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {ASPECT_MEANING[value] ?? "Measured angle between two bodies."}
                        </p>
                      </div>
                    </div>
                    <ul>
                      {rows.map((aspect, index) => (
                        <li key={`${aspect.a}-${aspect.b}-${index}`}>
                          <span>
                            {bodyName(aspect.a)} <span className="text-muted-foreground">·</span>{" "}
                            {bodyName(aspect.b)}
                          </span>
                          <span className="pattern-orb">
                            <span>Orb</span> {aspect.orb.toFixed(2)}°
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}

export function PatternChartDetails({ data }: { data: PatternData }) {
  const placementsId = useId();
  const placementsRef = useRef<HTMLDivElement>(null);
  const hasPlacements = data.placements.length > 0;
  const [columns, setColumns] = useState({ overflowing: false, previous: false, more: false });

  useEffect(() => {
    const region = placementsRef.current;
    if (!region) return;
    const measure = () => {
      const end = Math.max(0, region.scrollWidth - region.clientWidth);
      const offset = Math.abs(region.scrollLeft);
      const next = {
        overflowing: region.clientWidth > 0 && end > 1,
        previous: offset > 1,
        more: offset < end - 1,
      };
      setColumns((current) =>
        current.overflowing === next.overflowing &&
        current.previous === next.previous &&
        current.more === next.more
          ? current
          : next,
      );
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(region);
    const table = region.querySelector("table");
    if (table) observer?.observe(table);
    const foldout = region.closest("details");
    foldout?.addEventListener("toggle", measure);
    region.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    measure();
    return () => {
      observer?.disconnect();
      foldout?.removeEventListener("toggle", measure);
      region.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [hasPlacements]);

  const scrollColumns = (direction: -1 | 1) => {
    const region = placementsRef.current;
    if (!region) return;
    const pinnedWidth = region.querySelector("th")?.getBoundingClientRect().width ?? 0;
    // Leave overlap in the unpinned area so paging cannot skip data behind the body column.
    const step = Math.max(1, (region.clientWidth - pinnedWidth) * 0.8);
    const inlineDirection = getComputedStyle(region).direction === "rtl" ? -1 : 1;
    region.scrollBy({
      left: direction * inlineDirection * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  const houseLabel = (house: number) =>
    !data.uncertainty.housesReliable ? "suppressed" : house ? `house ${house}` : "—";

  return (
    <section className="pattern-chart-details" aria-labelledby="pattern-chart-heading">
      <h2 id="pattern-chart-heading">A closer look at your chart</h2>
      <p className="pattern-detail-copy">
        Follow a little further into the positions and connections behind your chapters.
      </p>

      {data.rising ? (
        <details className="pattern-chart-foldout">
          <summary>
            <span>Your main lens</span>
            <span>{data.rising.sign} rising</span>
          </summary>
          <div>
            <p className="pattern-detail-copy">
              {data.rising.sign} was rising over the horizon at your birth, at{" "}
              {data.rising.position}. This measurement sets where your houses fall — the areas of
              life a placement touches.
            </p>
            <ul className="pattern-house-list">
              {data.rising.houses.map((house) => (
                <li key={house.house}>
                  <span className="pattern-house-number">
                    {house.house.toString().padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm">{house.area}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {house.sign} · {house.bodies.length ? house.bodies.join(", ") : "empty"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="pattern-detail-copy mt-4">
              “Empty” means no body sat in that house at your birth — an ordinary result, not a
              missing area of life.
            </p>
          </div>
        </details>
      ) : null}

      <details className="pattern-chart-foldout" id="pattern-placements">
        <summary>
          <span>Where your bodies sit</span>
          <span>{data.placements.length} placements</span>
        </summary>
        <div>
          <p className="pattern-detail-copy">
            Where each body sat at the moment of your birth. “Rx” means it appeared to move
            backwards from Earth.{" "}
            {data.uncertainty.housesReliable
              ? "Houses are the area of life the body falls into."
              : "Houses are suppressed because your birth time isn't precise enough to place them honestly."}
          </p>
          {data.placements.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No placements are available in this snapshot.
            </p>
          ) : (
            <>
              {columns.overflowing && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Scroll sideways or use the column buttons to compare.
                  </p>
                  <div
                    className="pattern-placement-controls"
                    role="group"
                    aria-label="Placement table columns"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      aria-controls={placementsId}
                      disabled={!columns.previous}
                      onClick={() => scrollColumns(-1)}
                    >
                      Previous columns
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      aria-controls={placementsId}
                      disabled={!columns.more}
                      onClick={() => scrollColumns(1)}
                    >
                      More columns
                    </Button>
                  </div>
                </div>
              )}
              <div
                id={placementsId}
                ref={placementsRef}
                className="pattern-placement-table"
                role="region"
                aria-label="Scrollable natal placements"
                tabIndex={0}
              >
                <table>
                  <caption className="sr-only">Calculated natal placements</caption>
                  <thead>
                    <tr>
                      <th scope="col">Body</th>
                      <th scope="col">Sign &amp; degree</th>
                      <th scope="col">House</th>
                      <th scope="col">Motion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.placements.map((placement) => (
                      <tr key={placement.key}>
                        <th scope="row">{placement.label}</th>
                        <td>{placement.position}</td>
                        <td>{houseLabel(placement.house)}</td>
                        <td>{placement.retrograde ? "Rx" : "direct"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </details>

      <details className="pattern-chart-foldout" id="pattern-connections-foldout">
        <summary>
          <span>How your bodies connect</span>
          <span>{data.allAspects.length} connections</span>
        </summary>
        <div>
          <PatternConnections data={data} />
        </div>
      </details>

      <details className="pattern-chart-foldout pattern-calculation-record">
        <summary>
          <span>Birth and calculation record</span>
        </summary>
        <div>
          {data.snapshot.birth ? (
            <p className="pattern-detail-copy">
              {data.snapshot.birth.birthDate} {data.snapshot.birth.birthTime} ·{" "}
              {data.snapshot.birth.placeLabel}
              <br />
              {data.snapshot.birth.timezone} · time accuracy {data.snapshot.birth.accuracy}
            </p>
          ) : (
            <p className="pattern-detail-copy">No stored birth record for this snapshot.</p>
          )}
          <div className="pattern-record-fields">
            <Field label="Engine" value={data.engine} />
            <Field label="Snapshot engine" value={data.snapshot.engine} />
            <Field label="Precision" value={data.ephemeris.precision} />
            <Field label="Contract" value={data.contractVersion} />
            <Field label="Snapshot contract" value={data.snapshot.contractVersion} />
            <Field label="Houses" value={data.houseSystem} />
            <Field label="Time accuracy" value={data.uncertainty.accuracy} />
            <Field label="Placements" value={data.snapshot.placementCount} />
            <Field label="Connections" value={data.snapshot.aspectCount} />
            <Field
              label="ASC spread"
              value={`${data.uncertainty.ascendantSpreadDeg.toFixed(2)}°`}
            />
            <Field label="Moon spread" value={`${data.uncertainty.moonSpreadDeg.toFixed(2)}°`} />
          </div>
          <p className="pattern-detail-copy mt-4">
            “Spread” is how much a value could move given uncertainty in your birth time.
            {data.uncertainty.housesReliable
              ? " Your birth time is precise enough for house and angle claims."
              : " House claims and the rising lens are suppressed because your birth time isn't precise enough."}
          </p>
          <div className="mt-4 flex flex-wrap gap-5 text-sm text-primary">
            <Link to="/sources" className="inline-flex min-h-11 items-center">
              Check sources
            </Link>
            <Link to="/birth" className="inline-flex min-h-11 items-center">
              Edit birth details
            </Link>
          </div>
        </div>
      </details>
    </section>
  );
}
