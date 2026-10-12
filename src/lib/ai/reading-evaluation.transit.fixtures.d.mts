export function analyticEpisode(options?: {
 count?: number; index?: number; station?: boolean; amplitude?: number;
 shifts?: number[]; longitude?: number; branch?: "plus" | "minus";
 aspect?: string; firstRetrograde?: boolean; birthDisagreement?: boolean;
}): { scan: unknown; anchor: unknown; primary: import("../astro/cycles").CycleInstance; day: string; timezone: string };
