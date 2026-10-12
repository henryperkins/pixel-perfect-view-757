import { z } from "zod";

const text = z.string().max(40_000);
export const unavailable = z.object({
  status: z.literal("unavailable"),
  reason: z.string(),
  notices: z.array(z.string()),
});
export const savedReading = z.object({
  headline: z.string().max(500),
  body: text,
  prompt: z.string().max(2000).nullable(),
});
const window = z.object({
  key: z.string(),
  transit: z.string(),
  natal: z.string(),
  aspect: z.string(),
  phase: z.string(),
  startsOn: z.string().nullable(),
  exactOn: z.string().nullable(),
  endsOn: z.string().nullable(),
});
const timingFields = {
  day: z.string(),
  timezone: z.string(),
  windows: z.array(window).max(50),
  notices: z.array(z.string()),
};
export const timingOutput = z.union([
  unavailable,
  z.object({ status: z.literal("available"), ...timingFields }),
]);
export const todayOutput = z.union([
  unavailable,
  z.object({
    status: z.literal("available"),
    ...timingFields,
    reading: savedReading.extend({ confidence: z.enum(["low", "medium", "high"]) }),
  }),
]);
export const patternOutput = z.union([
  unavailable,
  z.object({
    status: z.literal("available"),
    houseSystem: z.string(),
    placements: z
      .array(
        z.object({
          key: z.string(),
          sign: z.string(),
          house: z.number().int().min(1).max(12).nullable(),
          retrograde: z.boolean(),
        }),
      )
      .max(20),
    risingSign: z.string().nullable(),
    chapters: z.array(z.object({ key: z.string(), title: z.string() })).max(100),
    notices: z.array(z.string()),
  }),
]);
export const chapterOutput = z.union([
  unavailable,
  z.object({
    status: z.literal("available"),
    key: z.string(),
    title: z.string(),
    paragraphs: z.array(text).max(20),
    reflectionQuestion: z.string().max(400),
    notices: z.array(z.string()),
  }),
]);
export const journalOutput = z.union([
  unavailable,
  z.object({
    status: z.literal("available"),
    entries: z
      .array(
        z.object({
          date: z.string(),
          domain: z.string(),
          title: z.string().max(2000),
          body: text.nullable(),
        }),
      )
      .max(50),
    notices: z.array(z.string()),
  }),
]);
export const timeZoneInput = z.string().max(100).default("UTC");
