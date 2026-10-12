import { ASPECTS, birthTimeSupport, type AspectKey, type TimeAccuracy } from "./chart";
import { contactFactors, contactImportance, transitOrb, UNCERTAIN_ANGLE_FACTOR } from "./cycles";
import { norm360, signedDelta } from "./ephemeris";

/**
 * One body–point pair checked the way computeCycles checks it, from two
 * longitudes alone. No ephemeris, birth record or date is involved, so it can
 * run in a public page without collecting anything.
 */
export interface ContactCheckInput {
  body: string;
  bodyLongitude: number;
  point: string;
  pointLongitude: number;
  accuracy: TimeAccuracy;
}

export interface ContactCheck {
  /** Shortest arc between the two longitudes, 0–180°. */
  separation: number;
  aspect: AspectKey;
  aspectAngle: number;
  /** Distance from the aspect's exact angle. */
  orb: number;
  /** Largest orb that still counts for this body and aspect. */
  limit: number;
  inOrb: boolean;
  /** Ascendant and Midheaven contacts are left out when the birth time is unknown. */
  suppressed: boolean;
  factors: ReturnType<typeof contactFactors>;
  /** Null when the pair is not a contact. */
  importance: number | null;
}

const ANGLE_POINTS = new Set(["ascendant", "midheaven"]);

export function checkContact(input: ContactCheckInput): ContactCheck {
  const separation = Math.abs(
    signedDelta(norm360(input.bodyLongitude), norm360(input.pointLongitude)),
  );
  const distance = (angle: number) => Math.abs(separation - angle);
  // Limits stay under 30°, so at most one of the six angles can be inside its orb.
  const matched = ASPECTS.find((a) => distance(a.angle) <= transitOrb(input.body, a.key));
  const nearest =
    matched ?? ASPECTS.reduce((best, a) => (distance(a.angle) < distance(best.angle) ? a : best));
  const orb = distance(nearest.angle);
  const support = birthTimeSupport(input.accuracy);
  const angle = ANGLE_POINTS.has(input.point);
  const suppressed = angle && support.angleClaimsSuppressed;
  const angleDiscount = angle && !support.housesReliable ? UNCERTAIN_ANGLE_FACTOR : 1;
  const inOrb = matched !== undefined;
  return {
    separation,
    aspect: nearest.key,
    aspectAngle: nearest.angle,
    orb,
    limit: transitOrb(input.body, nearest.key),
    inOrb,
    suppressed,
    factors: contactFactors(input.body, input.point, nearest.key, orb, angleDiscount),
    importance:
      inOrb && !suppressed
        ? contactImportance(input.body, input.point, nearest.key, orb, angleDiscount)
        : null,
  };
}
