import type { Chart } from "./chart";
import { decryptJson, encryptJson } from "../crypto.server";
import type { DBClient } from "../d1.server";
import type { BirthDetails } from "../pattern.server";
import { validateTransitAnchors, type TransitAnchorManifest } from "./transit-anchors";
export async function loadTransitAnchors(
  snapshot: { houses: unknown; fingerprint: string; uncertainty: unknown },
  dek: CryptoKey,
): Promise<TransitAnchorManifest | null> {
  const houses = snapshot.houses as Record<string, unknown> | null;
  if (houses !== null && (typeof houses !== "object" || Array.isArray(houses)))
    throw new Error("Transit source assessment could not be loaded. Please retry.");
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

export const TRANSIT_ANCHOR_BACKOFF_MS = 6 * 60 * 60 * 1000;
const LEASE_MS = 2 * 60 * 1000;
type AnchorSnapshot = { id: string; fingerprint: string; houses: unknown; uncertainty: unknown };
export type TransitAnchorAvailability =
  | {
      status: "available";
      origin: "existing" | "recovered";
      manifest: TransitAnchorManifest;
      reason: null;
    }
  | { status: "unavailable"; origin: null; manifest: TransitAnchorManifest | null; reason: string };
const unavailable = (
  reason: string,
  manifest: TransitAnchorManifest | null = null,
): TransitAnchorAvailability => ({ status: "unavailable", origin: null, manifest, reason });
const available = (
  manifest: TransitAnchorManifest,
  origin: "existing" | "recovered",
): TransitAnchorAvailability =>
  manifest.status === "screened"
    ? { status: "available", origin, manifest, reason: null }
    : unavailable(manifest.reason, manifest);

/** Recover only saved birth evidence, with one persisted attempt per snapshot/window. */
export async function ensureTransitAnchors(
  db: DBClient,
  userId: string,
  snapshot: AnchorSnapshot,
  dek: CryptoKey,
  now: Date,
): Promise<TransitAnchorAvailability> {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid transit recovery time.");
  const existing = await loadTransitAnchors(snapshot, dek);
  if (existing?.status === "screened") return available(existing, "existing");
  const savedRecovery = (snapshot.houses as Record<string, unknown> | null)?.[
    "transitAnchorRecovery"
  ];
  // A present, validated birth assessment is authoritative. Independent retry
  // belongs only to this recovery path's prior failed attempt, not a second natal screen.
  if (existing && (!savedRecovery || typeof savedRecovery !== "object"))
    return unavailable(existing.reason, existing);
  const accuracy = (snapshot.uncertainty as Partial<Chart["uncertainty"]> | null)?.accuracy;
  if (!accuracy || accuracy === "unknown") return unavailable("unknown_time", existing);
  if (!process.env["SWISS_EPHEMERIS_URL"]) return unavailable("service_unavailable", existing);
  const { data: birth, error } = await db
    .from<{
      id: string;
      fingerprint: string;
      payload_ct: string;
      time_accuracy: Chart["uncertainty"]["accuracy"];
      timezone: string;
    }>("birth_profiles")
    .select("id,fingerprint,payload_ct,time_accuracy,timezone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Saved birth evidence could not be loaded. Please retry.");
  if (!birth) return unavailable("birth_input_unavailable", existing);
  if (birth.fingerprint !== snapshot.fingerprint) return unavailable("snapshot_changed", existing);
  if (birth.time_accuracy === "unknown") return unavailable("unknown_time", existing);
  let details: BirthDetails;
  try {
    details = await decryptJson<BirthDetails>(dek, birth.payload_ct);
    if (
      typeof details.birthDate !== "string" ||
      typeof details.birthTime !== "string" ||
      typeof details.placeLabel !== "string" ||
      !Number.isFinite(details.latitude) ||
      !Number.isFinite(details.longitude) ||
      !["exact", "near", "hour"].includes(birth.time_accuracy)
    )
      throw new Error("Missing birth input");
  } catch {
    return unavailable("birth_input_unavailable", existing);
  }
  const { birthCalculation, calculateChart } = await import("../pattern.server");
  let prepared: Awaited<ReturnType<typeof birthCalculation>>;
  try {
    prepared = await birthCalculation(details, birth.time_accuracy, birth.timezone);
  } catch {
    return unavailable("birth_input_unavailable", existing);
  }
  if (prepared.fp !== snapshot.fingerprint) return unavailable("fingerprint_mismatch", existing);
  const houses = (snapshot.houses ?? {}) as Record<string, unknown>;
  const recovery = houses["transitAnchorRecovery"] as Record<string, unknown> | undefined;
  const checked = typeof recovery?.["attemptedAt"] === "string" ? recovery["attemptedAt"] : "";
  const checkedAt = Date.parse(
    checked || (existing ? String(houses["natalReliabilityCheckedAt"] ?? "") : ""),
  );
  if (
    Number.isFinite(checkedAt) &&
    checkedAt <= now.getTime() &&
    now.getTime() - checkedAt < TRANSIT_ANCHOR_BACKOFF_MS
  ) {
    const leaseUntil = Date.parse(String(recovery?.["leaseUntil"] ?? ""));
    return unavailable(
      recovery?.["status"] === "calculating" && leaseUntil > now.getTime()
        ? "recovery_in_progress"
        : "recovery_backoff",
      existing,
    );
  }
  const lease = {
    token: crypto.randomUUID(),
    attemptedAt: now.toISOString(),
    leaseUntil: new Date(now.getTime() + LEASE_MS).toISOString(),
    status: "calculating",
  };
  const acquired = await db.exec<{ id: string }>(
    "UPDATE chart_snapshots SET houses=json_set(houses,'$.transitAnchorRecovery',json(?)) WHERE id=? AND user_id=? AND fingerprint=? AND EXISTS(SELECT 1 FROM birth_profiles WHERE user_id=? AND fingerprint=? AND payload_ct=?) AND json_extract(houses,'$.transitAnchors_ct') IS ? AND COALESCE(json_extract(houses,'$.transitAnchorRecovery.attemptedAt'),'')=? RETURNING id",
    [
      JSON.stringify(lease),
      snapshot.id,
      userId,
      snapshot.fingerprint,
      userId,
      snapshot.fingerprint,
      birth.payload_ct,
      typeof houses["transitAnchors_ct"] === "string" ? houses["transitAnchors_ct"] : null,
      checked,
    ],
  );
  if (!acquired.length) {
    const { data: currentBirth } = await db
      .from<{ fingerprint: string; payload_ct: string }>("birth_profiles")
      .select("fingerprint,payload_ct")
      .eq("user_id", userId)
      .maybeSingle();
    if (
      !currentBirth ||
      currentBirth.fingerprint !== snapshot.fingerprint ||
      currentBirth.payload_ct !== birth.payload_ct
    )
      return unavailable("snapshot_changed");
    const { data: current, error: currentError } = await db
      .from<AnchorSnapshot>("chart_snapshots")
      .select("id,fingerprint,houses,uncertainty")
      .eq("id", snapshot.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (currentError) throw new Error("Transit recovery state could not be loaded. Please retry.");
    if (!current) return unavailable("snapshot_changed");
    const completed = await loadTransitAnchors(current, dek);
    return completed?.status === "screened"
      ? available(completed, "existing")
      : unavailable("recovery_in_progress", completed);
  }
  try {
    const calculated = await calculateChart(prepared.input, prepared.fp);
    const manifest = calculated.transitAnchors;
    const stored = await db.exec<{ id: string }>(
      "UPDATE chart_snapshots SET houses=json_set(houses,'$.transitAnchors_ct',?,'$.transitAnchorRecovery',json(?)) WHERE id=? AND user_id=? AND fingerprint=? AND json_extract(houses,'$.transitAnchorRecovery.token')=? AND EXISTS(SELECT 1 FROM birth_profiles WHERE user_id=? AND fingerprint=? AND payload_ct=?) RETURNING id",
      [
        await encryptJson(dek, manifest),
        JSON.stringify({
          ...lease,
          status: manifest.status === "screened" ? "complete" : "unavailable",
        }),
        snapshot.id,
        userId,
        snapshot.fingerprint,
        lease.token,
        userId,
        snapshot.fingerprint,
        birth.payload_ct,
      ],
    );
    if (!stored.length) return unavailable("snapshot_changed");
    return available(manifest, "recovered");
  } catch {
    // The lease's attemptedAt remains a bounded failure/crash backoff. No model is involved.
    return unavailable("recovery_failed", existing);
  }
}
