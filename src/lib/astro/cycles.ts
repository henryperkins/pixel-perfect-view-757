import { BODIES, BODY_LABEL, type Body, positionOf, signedDelta, toJulianDay } from "./ephemeris";
import { ASPECTS, type AspectKey, type Chart } from "./chart";

/**
 * Transit ("cycle") detection.
 *
 * A cycle instance is a window, not a day: we scan forward and backward from
 * the reference instant to find ingress, exactness and egress so a reading can
 * say where in the arc you currently are.
 */

const TRANSIT_BODIES: Body[] = [
  "moon",
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

const NATAL_TARGETS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "ascendant",
  "midheaven",
];

/** Slow movers carry more weight; the Moon is noise unless it is exact. */
const WEIGHT: Record<string, number> = {
  moon: 0.15,
  sun: 0.5,
  mercury: 0.35,
  venus: 0.4,
  mars: 0.6,
  jupiter: 0.85,
  saturn: 1,
  uranus: 0.95,
  neptune: 0.9,
  pluto: 1,
};

const TARGET_WEIGHT: Record<string, number> = {
  sun: 1,
  moon: 0.95,
  ascendant: 0.9,
  midheaven: 0.85,
  venus: 0.7,
  mars: 0.7,
  mercury: 0.6,
  jupiter: 0.55,
  saturn: 0.6,
};

export const DOMAINS = ["identity", "relationships", "work", "inner-life", "structure"] as const;
export type Domain = (typeof DOMAINS)[number];

const DOMAIN_BY_TARGET: Record<string, Domain> = {
  sun: "identity",
  moon: "inner-life",
  ascendant: "identity",
  midheaven: "work",
  venus: "relationships",
  mars: "work",
  mercury: "work",
  jupiter: "structure",
  saturn: "structure",
};

export function transitOrb(body: string, aspect: AspectKey): number {
  const tight = aspect === "quincunx" ? 1.2 : 2.5;
  if (body === "moon") return tight * 0.6;
  if (body === "sun" || body === "mercury" || body === "venus") return tight;
  return tight * 1.2;
}

export type Phase = "approaching" | "exact" | "separating";

export interface CycleInstance {
  cycle_key: string;
  transit_body: string;
  natal_point: string;
  aspect: AspectKey;
  orb: number;
  phase: Phase;
  domain: Domain;
  importance: number;
  ingress_at: string | null;
  exact_at: string | null;
  egress_at: string | null;
  label: string;
  /**
   * Whole days from the reference instant to the exact pass. Negative once the
   * exact pass is behind us, null when no exact pass falls inside the scan.
   */
  days_to_exact: number | null;
  /**
   * Where the reference instant sits inside the ingress -> egress window,
   * 0 at ingress and 1 at egress. Null when either boundary is outside scan.
   */
  arc_position: number | null;
}

/** Days between two ISO instants, rounded to the nearest whole day. */
export function daysToExact(exactAt: string | null, from: Date): number | null {
  if (!exactAt) return null;
  const ms = new Date(exactAt).getTime() - from.getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.round(ms / 86400000);
}

/** Human phrase for a days-to-exact figure. */
export function exactPhrase(days: number | null): string {
  if (days === null) return "no exact pass in this scan";
  if (days === 0) return "exact today";
  if (days === 1) return "exact tomorrow";
  if (days === -1) return "exact yesterday";
  if (days > 0) return `exact in ${days} days`;
  return `exact ${Math.abs(days)} days ago`;
}

function orbAt(jd: number, body: Body, natalLon: number, aspectAngle: number): number {
  const pos = positionOf(body, jd);
  const sep = Math.abs(signedDelta(pos.lon, natalLon));
  return Math.abs(sep - aspectAngle);
}

function scanBoundary(
  body: Body,
  natalLon: number,
  aspectAngle: number,
  jd0: number,
  direction: 1 | -1,
  limitDays: number,
  maxOrb: number,
): number | null {
  const step = body === "moon" ? 0.05 : 0.5;
  for (let d = step; d <= limitDays; d += step) {
    const jd = jd0 + direction * d;
    if (orbAt(jd, body, natalLon, aspectAngle) > maxOrb) return jd;
  }
  return null;
}

function findExact(
  body: Body,
  natalLon: number,
  aspectAngle: number,
  jd0: number,
  limitDays: number,
): number | null {
  const step = body === "moon" ? 0.02 : 0.25;
  let best: number | null = null;
  let bestOrb = Infinity;
  for (let d = -limitDays; d <= limitDays; d += step) {
    const jd = jd0 + d;
    const o = orbAt(jd, body, natalLon, aspectAngle);
    if (o < bestOrb) {
      bestOrb = o;
      best = jd;
    }
  }
  return bestOrb < 0.2 ? best : null;
}

export function computeCycles(chart: Chart, when: Date): CycleInstance[] {
  const jd = toJulianDay(when);
  const out: CycleInstance[] = [];

  for (const tb of TRANSIT_BODIES) {
    const tpos = positionOf(tb, jd);
    for (const target of NATAL_TARGETS) {
      const np = chart.points[target];
      if (!np) continue;
      if (np.angleDependent && chart.uncertainty.angleClaimsSuppressed) continue;

      const sep = Math.abs(signedDelta(tpos.lon, np.lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        const maxOrb = transitOrb(tb, asp.key);
        if (orb > maxOrb) continue;

        const limit = tb === "moon" ? 2 : tb === "sun" ? 10 : 400;
        const exactJd = findExact(tb, np.lon, asp.angle, jd, Math.min(limit, 60));
        const ingressJd = scanBoundary(tb, np.lon, asp.angle, jd, -1, limit, maxOrb);
        const egressJd = scanBoundary(tb, np.lon, asp.angle, jd, 1, limit, maxOrb);

        // Phase follows the exact-pass date so labels never contradict
        // "exact in N days"; orb is only used when no exact pass was found.
        const dayOffset = exactJd !== null ? Math.round(exactJd - jd) : null;
        let phase: Phase = "approaching";
        if (dayOffset === 0 || (dayOffset === null && orb < 0.35)) phase = "exact";
        else if (dayOffset !== null && dayOffset < 0) phase = "separating";

        const angleDiscount = np.angleDependent && !chart.uncertainty.housesReliable ? 0.6 : 1;
        const importance =
          (WEIGHT[tb] ?? 0.3) *
          (TARGET_WEIGHT[target] ?? 0.5) *
          (1 - orb / (maxOrb + 0.001)) *
          (asp.hard ? 1 : 0.85) *
          angleDiscount;

        out.push({
          cycle_key: `${tb}_${asp.key}_${target}`,
          transit_body: tb,
          natal_point: target,
          aspect: asp.key,
          orb: Number(orb.toFixed(2)),
          phase,
          domain: DOMAIN_BY_TARGET[target] ?? "identity",
          importance: Number(importance.toFixed(4)),
          ingress_at: ingressJd ? isoFromJd(ingressJd) : null,
          exact_at: exactJd ? isoFromJd(exactJd) : null,
          egress_at: egressJd ? isoFromJd(egressJd) : null,
          label: `${BODY_LABEL[tb]} ${asp.key} natal ${np.label}`,
          days_to_exact: exactJd !== null ? Math.round(exactJd - jd) : null,
          arc_position:
            ingressJd !== null && egressJd !== null && egressJd > ingressJd
              ? Number(
                  Math.min(1, Math.max(0, (jd - ingressJd) / (egressJd - ingressJd))).toFixed(3),
                )
              : null,
        });
        break;
      }
    }
  }

  return out.sort((a, b) => b.importance - a.importance);
}

function isoFromJd(jd: number): string {
  return new Date((jd - 2440587.5) * 86400000).toISOString();
}

export { BODIES };
