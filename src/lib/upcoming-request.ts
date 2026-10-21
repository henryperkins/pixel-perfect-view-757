const pending = new WeakMap<object, Promise<void>>();

/** Share one service slot per browser query client, including across route remounts. */
export async function runUpcomingRequest<T>(
  client: object,
  signal: AbortSignal,
  request: () => Promise<T>,
): Promise<T> {
  const previous = pending.get(client);
  let release!: () => void;
  const settled = new Promise<void>((resolve) => (release = resolve));
  pending.set(client, settled);
  try {
    await previous;
    signal.throwIfAborted();
    // Cancellation discards an old query's result, but must not release its service
    // slot before the actual server call settles. It may still be calculating.
    return await request();
  } finally {
    release();
    if (pending.get(client) === settled) pending.delete(client);
  }
}
