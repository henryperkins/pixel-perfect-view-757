const MAX_SELECTIONS = 64;
const RETENTION_MS = 15 * 60_000;
const selections = new Map<
  string,
  { ownerId: string; expires: number; result: Promise<unknown> }
>();

/** Bounded, private worker memory. Database reading history remains the durable cache. */
export async function cachedTimingCalculation<T>(
  ownerId: string,
  key: string,
  calculate: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  for (const [id, item] of selections) if (item.expires <= now) selections.delete(id);
  let entry = selections.get(key);
  if (!entry || entry.ownerId !== ownerId) {
    if (selections.size >= MAX_SELECTIONS) selections.delete(selections.keys().next().value!);
    entry = { ownerId, expires: now + RETENTION_MS, result: calculate() };
    selections.set(key, entry);
  }
  try {
    return structuredClone(await entry.result) as T;
  } catch (error) {
    if (selections.get(key) === entry) selections.delete(key);
    throw error;
  }
}

export function clearTimingCalculations(ownerId: string): void {
  for (const [key, item] of selections) if (item.ownerId === ownerId) selections.delete(key);
}
