export type ContentValue =
  null | boolean | number | string | ContentValue[] | { [key: string]: ContentValue };
export type ContentChange = "added" | "removed" | "changed" | "unchanged";
export interface ContentComparisonEntry {
  kind: "entry" | "section";
  section: string;
  key: string;
  change: ContentChange;
  base: ContentValue | null;
  candidate: ContentValue | null;
  changedFields: string[];
}

/** Stable JSON, preserving array order and every field, including future schemas. */
export function canonicalContentJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Content numbers must be finite JSON values.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalContentJson).join(",") + "]";
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const object = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(object)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + canonicalContentJson(object[key]))
        .join(",") +
      "}"
    );
  }
  throw new Error("Content must contain only JSON values.");
}

export async function contentChecksum(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalContentJson(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function changedFields(base: unknown, candidate: unknown, path = ""): string[] {
  if (canonicalContentJson(base) === canonicalContentJson(candidate)) return [];
  if (
    base !== null &&
    candidate !== null &&
    typeof base === "object" &&
    typeof candidate === "object" &&
    !Array.isArray(base) &&
    !Array.isArray(candidate)
  ) {
    const a = base as Record<string, unknown>,
      b = candidate as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().flatMap((key) => {
      const next = path ? path + "." + key : key;
      return !Object.hasOwn(a, key) || !Object.hasOwn(b, key)
        ? [next]
        : changedFields(a[key], b[key], next);
    });
  }
  return [path || "$value"];
}

function entries(bundle: Record<string, unknown>) {
  const result = new Map<string, { section: string; key: string; value: ContentValue }>();
  const add = (section: string, key: string, value: unknown) => {
    const identity = JSON.stringify([section, key]);
    if (result.has(identity))
      throw new Error("Duplicate content comparison key: " + section + " / " + key);
    canonicalContentJson(value);
    result.set(identity, { section, key, value: value as ContentValue });
  };
  for (const section of Object.keys(bundle).sort()) {
    // Release identity is displayed separately; a pending draft version is not a prose edit.
    if (section === "version") continue;
    const value = bundle[section];
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const object =
          entry !== null && typeof entry === "object" ? (entry as Record<string, unknown>) : null;
        const key =
          typeof object?.["key"] === "string"
            ? object["key"]
            : typeof object?.["id"] === "string"
              ? object["id"]
              : "[" + index + "]";
        add(section, key, entry);
      });
    } else if (value !== null && typeof value === "object") {
      for (const key of Object.keys(value).sort())
        add(section, key, (value as Record<string, unknown>)[key]);
    } else add("bundle", section, value);
  }
  return result;
}

export function compareContentBundles(
  base: Record<string, unknown>,
  candidate: Record<string, unknown>,
) {
  const a = entries(base),
    b = entries(candidate);
  const counts = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  const compared: ContentComparisonEntry[] = [];
  const container = (value: unknown) =>
    Array.isArray(value)
      ? "array"
      : value !== null && typeof value === "object"
        ? "object"
        : "value";
  for (const section of [...new Set([...Object.keys(base), ...Object.keys(candidate)])].sort()) {
    if (section === "version") continue;
    const hasBase = Object.hasOwn(base, section),
      hasCandidate = Object.hasOwn(candidate, section);
    const baseType = hasBase ? container(base[section]) : null,
      candidateType = hasCandidate ? container(candidate[section]) : null;
    if (
      baseType !== candidateType &&
      (baseType === "array" ||
        baseType === "object" ||
        candidateType === "array" ||
        candidateType === "object")
    ) {
      const change: ContentChange = !hasBase ? "added" : !hasCandidate ? "removed" : "changed";
      counts[change]++;
      compared.push({
        kind: "section",
        section: "bundle structure",
        key: section,
        change,
        base: hasBase ? { container: baseType } : null,
        candidate: hasCandidate ? { container: candidateType } : null,
        changedFields: ["container"],
      });
    } else if (baseType === "array" && candidateType === "array") {
      const identities = (list: unknown[]) =>
        list.map((item, index) =>
          item &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>)["key"] === "string"
            ? ((item as Record<string, unknown>)["key"] as string)
            : item &&
                typeof item === "object" &&
                typeof (item as Record<string, unknown>)["id"] === "string"
              ? ((item as Record<string, unknown>)["id"] as string)
              : "[" + index + "]",
        );
      const beforeOrder = identities(base[section] as unknown[]),
        afterOrder = identities(candidate[section] as unknown[]);
      const common = new Set(beforeOrder.filter((identity) => afterOrder.includes(identity)));
      if (
        canonicalContentJson(beforeOrder.filter((identity) => common.has(identity))) !==
        canonicalContentJson(afterOrder.filter((identity) => common.has(identity)))
      ) {
        counts.changed++;
        compared.push({
          kind: "section",
          section: "bundle order",
          key: section,
          change: "changed",
          base: beforeOrder,
          candidate: afterOrder,
          changedFields: ["order"],
        });
      }
    }
  }
  for (const id of [...new Set([...a.keys(), ...b.keys()])].sort()) {
    const before = a.get(id),
      after = b.get(id);
    const fields = before && after ? changedFields(before.value, after.value) : [];
    const change: ContentChange = !before
      ? "added"
      : !after
        ? "removed"
        : fields.length
          ? "changed"
          : "unchanged";
    counts[change]++;
    compared.push({
      kind: "entry",
      section: (after ?? before)!.section,
      key: (after ?? before)!.key,
      change,
      base: before?.value ?? null,
      candidate: after?.value ?? null,
      changedFields: fields,
    });
  }
  return { entries: compared, counts };
}
