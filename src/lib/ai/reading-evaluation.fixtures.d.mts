export interface SyntheticFixture {
  id: string;
  description: string;
  chart: {
    engine: string;
    engineVersion: string;
    houseSystem: string;
    precision: string;
    points: Record<string, { angleDependent: boolean }>;
    uncertainty: {
      accuracy: string;
      minutes: number;
      ascendantSpreadDeg: number;
      housesReliable: boolean;
      angleClaimsSuppressed: boolean;
    };
  };
  cycles: {
    cycle_key: string;
    transit_body: string;
    natal_point: string;
    aspect: string;
    orb: number;
    phase: string;
    domain: string;
    importance: number;
    ingress_at: string;
    exact_at: string | null;
    egress_at: string;
    label: string;
    arc_position: number;
  }[];
  config: {
    day: string;
    timeZone: string;
    tone: string;
    depth: string;
    granted: string[];
  };
}
export const READING_EVAL_FIXTURE_VERSION: string;
export const READING_EVAL_CASES: SyntheticFixture[];
