import type { Chart } from "./chart";
import { decryptJson } from "../crypto.server";
import { validateTransitAnchors, type TransitAnchorManifest } from "./transit-anchors";
export async function loadTransitAnchors(
  snapshot: { houses: unknown; fingerprint: string; uncertainty: unknown },
  dek: CryptoKey,
): Promise<TransitAnchorManifest | null> {
  const houses = snapshot.houses as Record<string, unknown> | null;
  if (!houses || !Object.hasOwn(houses, "transitAnchors_ct")) return null;
  try {
    if (typeof houses["transitAnchors_ct"] !== "string") throw new Error("Invalid envelope");
    return validateTransitAnchors(
      await decryptJson<unknown>(dek, houses["transitAnchors_ct"]),
      snapshot.fingerprint,
      (snapshot.uncertainty as Chart["uncertainty"]).accuracy,
    );
  } catch {
    throw new Error("Transit source assessment could not be loaded. Please retry.");
  }
}
