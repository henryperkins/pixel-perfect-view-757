import { z } from "zod";

/** Calendar dates, rather than just strings that look like dates. */
const checkInDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Use a valid calendar date.");

const band = z.number().int().min(1).max(5).nullable();

export const checkInInputSchema = z.object({
  day: checkInDay,
  mood: band,
  energy: band,
  note: z.string().max(2000).nullable(),
  // Each optional wellbeing source is independently consent-gated by the server.
  sleep: band.default(null),
  stress: band.default(null),
});
