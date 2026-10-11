import type { Body, Sign } from "../astro/ephemeris";
import type { AspectKey } from "../astro/chart";

export const NATAL_PERSONAL_BODIES = ["sun", "moon", "mercury", "venus", "mars"] as const;
export type NatalPersonalBody = (typeof NATAL_PERSONAL_BODIES)[number];
export type NatalLensRole =
  "emotional_reflex" | "self_direction" | "expression" | "preference" | "initiative";
export const NATAL_BODY_ROLE: Record<NatalPersonalBody, NatalLensRole> = {
  sun: "self_direction",
  moon: "emotional_reflex",
  mercury: "expression",
  venus: "preference",
  mars: "initiative",
};
export type NatalSignSelector = { kind: "sign"; body: NatalPersonalBody; sign: Sign };
export type NatalAspectSelector = {
  kind: "aspect";
  a: NatalPersonalBody;
  b: Exclude<Body, "node">;
  aspect: AspectKey;
  maxOrb: number;
};
export type NatalHouseSelector = {
  kind: "house";
  body: NatalPersonalBody;
  house: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};
export interface NatalLensRule {
  key: string;
  role: NatalLensRole;
  anchorNatalPoints: NatalPersonalBody[];
  selectors: [NatalSignSelector] | [NatalSignSelector, NatalAspectSelector | NatalHouseSelector];
  mechanism: string;
}
