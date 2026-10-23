/**
 * Chapter access authority.
 *
 * The narrative response is the source of truth for whether the returned
 * chapter is full or previewed. Membership is only a hint for refresh timing:
 * a stale or failing membership poll must never truncate or hide a chapter the
 * server already authorized.
 */

export type ChapterAccessInput = {
  server:
    | {
        available: boolean;
        locked?: boolean;
        accessUntil?: string | null;
      }
    | null
    | undefined;
  membership:
    | {
        fullAccess: boolean;
        accessUntil: string | null;
      }
    | null
    | undefined;
  now: number;
};

export type ChapterAccessState = {
  /** The available server response's expiry only; never borrowed from membership. */
  accessUntil: string | null;
  /** A refresh deadline; a membership fallback cannot affect display access. */
  revalidateAt: string | null;
  accessExpired: boolean;
  locked: boolean;
  localPreview: boolean;
};

export function resolveChapterAccess(input: ChapterAccessInput): ChapterAccessState {
  const { server, membership, now } = input;
  const available = server?.available === true;
  const accessUntil = available ? (server.accessUntil ?? null) : null;
  // An invalid or past server deadline is expired; a missing one never is.
  const accessExpired = accessUntil !== null && !(Date.parse(accessUntil) > now);

  // The server's own expiry decides whether there is a deadline. An explicit
  // null means "no deadline", so membership must not supply one.
  const serverDeadlineProvided = available && server.accessUntil !== undefined;
  const revalidateAt = serverDeadlineProvided
    ? (server.accessUntil ?? null)
    : (membership?.accessUntil ?? null);

  return {
    accessUntil,
    revalidateAt,
    accessExpired,
    locked: available && (server.locked === true || accessExpired),
    // Only a full server chapter can be locally previewed when its own expiry
    // passes while it is open.
    localPreview: available && server.locked !== true && accessExpired,
  };
}

/** Stable identity for membership access changes, including the fallback deadline. */
export function membershipAccessSignature(
  data: { fullAccess: boolean; accessUntil: string | null } | null | undefined,
): string | null {
  if (!data) return null;
  return `${data.fullAccess ? "full" : "preview"}:${data.accessUntil ?? "none"}`;
}
