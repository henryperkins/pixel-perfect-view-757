import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
import type { PlaceSearchResult } from "./place-lookup";

export const searchBirthPlaces = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.string().trim().min(2).max(160).parse(d))
  .handler(async ({ data }): Promise<PlaceSearchResult> => {
    const m = await import("./place-geocode.server");
    return m.searchPlaceCandidates(data);
  });
