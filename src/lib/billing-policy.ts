export const PLANS = {
  month: { label: "Monthly", amount: 800, interval: "month" },
  year: { label: "Yearly", amount: 7200, interval: "year" },
} as const;
export type MembershipPlan = keyof typeof PLANS;
export const TRIAL_DAYS = 7;

export interface MembershipRow {
  stripe_subscription_id: string;
  user_id: string;
  status: string;
  plan: MembershipPlan;
  current_period_end: number;
  trial_end: number;
  paid_until: number;
  cancel_at_period_end: number;
  updated_at: string;
}

/** A failed renewal never extends the period that was actually paid for. */
export function accessEnd(row: MembershipRow): number {
  if (row.status === "trialing") return row.trial_end;
  if (["active", "past_due"].includes(row.status)) return row.paid_until;
  return 0;
}

export function membershipAccess(rows: MembershipRow[], now = Date.now()) {
  const expires = Math.max(0, ...rows.map(accessEnd));
  return {
    fullAccess: expires * 1000 > now,
    accessUntil: expires ? new Date(expires * 1000).toISOString() : null,
  };
}

/** Only an opening paragraph leaves the server for free members. */
export function chapterPreview<
  T extends {
    narrative: string;
    paragraphs: string[];
    citations: { paragraph: number; facts: string[] }[];
  },
>(chapter: T): T {
  const opening = chapter.paragraphs[0] ?? "";
  // Older single-paragraph essays must not become a full-essay preview.
  const preview =
    opening.length > 700 ? opening.slice(0, 700).replace(/\s+\S*$/, "") + "…" : opening;
  return {
    ...chapter,
    narrative: preview,
    paragraphs: preview ? [preview] : [],
    citations: chapter.citations.filter((c) => c.paragraph === 1),
  };
}
