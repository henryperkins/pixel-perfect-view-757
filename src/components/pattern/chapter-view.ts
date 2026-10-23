import type { fetchFeatureNarrative } from "@/lib/pattern.functions";

/** The available chapter response; the server has already applied its own preview. */
export type ChapterNarrative = Extract<
  Awaited<ReturnType<typeof fetchFeatureNarrative>>,
  { available: true }
>;

export type ChapterUnavailable = Extract<
  Awaited<ReturnType<typeof fetchFeatureNarrative>>,
  { available: false }
>;

export type ChapterResponse = ChapterNarrative | ChapterUnavailable;

export type ChapterViewState =
  | { kind: "loading" }
  | { kind: "changed" }
  | { kind: "error" }
  | { kind: "unavailable"; retryable: boolean; reason: string | null }
  | {
      kind: "ready";
      narrative: ChapterNarrative;
      locked: boolean;
      staleError: boolean;
    };

export type ChapterViewInput = {
  data: ChapterResponse | undefined;
  /** The narrative to display, already previewed when the server expiry has passed. */
  display: ChapterNarrative | null;
  error: boolean;
  isPending: boolean;
  isFetching: boolean;
  locked: boolean;
};

/**
 * Priority: readable content, then a changed chart, then a hard error, then a
 * server-unavailable result, then loading. Membership errors never appear here.
 */
export function resolveChapterView(input: ChapterViewInput): ChapterViewState {
  const { data, display, error, locked } = input;
  if (display) return { kind: "ready", narrative: display, locked, staleError: error };
  if (data?.available === true) return { kind: "changed" };
  if (error) return { kind: "error" };
  if (data?.available === false)
    return { kind: "unavailable", retryable: data.retryable, reason: data.reason };
  // Pending, idle, or fetching without a displayable narrative.
  return { kind: "loading" };
}
