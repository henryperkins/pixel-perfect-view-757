import type { DraftValuesMap } from "./member-drafts";

export type BirthFormValues = DraftValuesMap["birth-details"];
export type BirthFormRecord = {
  birthDate: string;
  birthTime: string;
  accuracy: string;
  placeLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
  revision: string;
};
export const BIRTH_ACCURACY = [
  { value: "exact", label: "Exact", note: "From a record, to the minute." },
  { value: "near", label: "Within ~15 min", note: "Remembered closely." },
  { value: "hour", label: "Within an hour", note: "Rough recollection." },
  { value: "unknown", label: "Unknown", note: "House and angle descriptions are left out." },
] as const;

export function birthFormValues(record: BirthFormRecord | null): BirthFormValues {
  return {
    birthDate: record?.birthDate ?? "",
    birthTime: record?.accuracy === "unknown" ? "" : (record?.birthTime ?? ""),
    accuracy: (record?.accuracy as BirthFormValues["accuracy"]) ?? "exact",
    placeLabel: record?.placeLabel ?? "",
    latitude: record ? String(record.latitude) : "",
    longitude: record ? String(record.longitude) : "",
    timezone: record?.timezone ?? "",
    placeResolution: record ? "saved" : "unresolved",
  };
}

export function changeBirthAccuracy(
  values: BirthFormValues,
  accuracy: BirthFormValues["accuracy"],
): BirthFormValues {
  return {
    ...values,
    accuracy,
    birthTime: values.accuracy === "unknown" || accuracy === "unknown" ? "" : values.birthTime,
  };
}

export function birthFormIssues(values: BirthFormValues) {
  const issues: Partial<Record<keyof BirthFormValues, string>> = {};
  const date = new Date(`${values.birthDate}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== values.birthDate
  )
    issues.birthDate = "Enter a valid birth date.";
  if (values.accuracy !== "unknown" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.birthTime))
    issues.birthTime = "Enter your birth time, or choose Unknown.";
  if (!values.placeLabel.trim()) issues.placeLabel = "Enter your birth place.";
  else if (values.placeLabel.length > 160)
    issues.placeLabel = "Use a place name of 160 characters or fewer.";
  else if (values.placeResolution === "unresolved")
    issues.placeLabel = "Find and choose your birth place, or enter coordinates manually.";
  for (const [field, limit] of [
    ["latitude", 90],
    ["longitude", 180],
  ] as const) {
    const number = Number(values[field]);
    if (!values[field].trim() || !Number.isFinite(number) || Math.abs(number) > limit)
      issues[field] = `Enter a ${field} between −${limit} and ${limit}.`;
  }
  try {
    if (!values.timezone.trim()) throw new Error("Missing timezone");
    new Intl.DateTimeFormat("en", { timeZone: values.timezone });
  } catch {
    issues.timezone = "Enter a valid timezone, such as Europe/London.";
  }
  return issues;
}

export function birthSaveData(values: BirthFormValues, expectedRevision: string | null) {
  return {
    birthDate: values.birthDate,
    birthTime: values.accuracy === "unknown" ? "12:00" : values.birthTime,
    accuracy: values.accuracy,
    placeLabel: values.placeLabel,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    timezone: values.timezone,
    expectedRevision,
  };
}

export function sameBirthDetails(left: BirthFormValues, right: BirthFormValues) {
  return JSON.stringify(birthSaveData(left, null)) === JSON.stringify(birthSaveData(right, null));
}
