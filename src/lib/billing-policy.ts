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

/** Stripe drafts each renewal invoice for about an hour before charging it; this adds margin. */
export const RENEWAL_GRACE_SECONDS = 24 * 60 * 60;

/** End of the trial or paid period. A failed renewal never extends it. */
export function paidThrough(row: MembershipRow): number {
  if (row.status === "trialing") return row.trial_end;
  // Until the first payment lands, a converted trial is covered only to its trial end.
  if (["active", "past_due"].includes(row.status)) return Math.max(row.paid_until, row.trial_end);
  return 0;
}

/** A renewing membership keeps access while Stripe collects payment; a reported failure ends it. */
export function accessEnd(row: MembershipRow): number {
  const end = paidThrough(row);
  return end && !row.cancel_at_period_end
    ? end + RENEWAL_GRACE_SECONDS
    : end;
}

export function membershipAccess(rows: MembershipRow[], now = Date.now()) {
  const expires = Math.max(0, ...rows.map(accessEnd)),
    paid = Math.max(0, ...rows.map(paidThrough));
  const fullAccess = expires * 1000 > now;
  return {
    fullAccess,
    accessUntil: expires ? new Date(expires * 1000).toISOString() : null,
    paidThrough: paid ? new Date(paid * 1000).toISOString() : null,
    renewalPending: fullAccess && paid * 1000 <= now,
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
