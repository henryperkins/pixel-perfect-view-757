const pending = new WeakMap<object, Promise<void>>();
const REQUEST_TIMEOUT_MS = 60_000;

/** Coordinate Upcoming calls per browser query client, including route remounts. */
export async function runUpcomingRequest<T>(
  client: object,
  signal: AbortSignal,
  request: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const previous = pending.get(client);
  let release!: () => void;
  const settled = new Promise<void>((resolve) => (release = resolve));
  pending.set(client, settled);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await previous;
    signal.throwIfAborted();
    // Filter cancellation only skips queued work. A separate transport deadline
    // allows recovery from a stalled connection beyond the server's 18s scan budget.
    const controller = new AbortController();
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = new DOMException("Future timing could not load.", "TimeoutError");
        controller.abort(error);
        reject(error);
      }, REQUEST_TIMEOUT_MS);
    });
    return await Promise.race([request(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
    release();
    if (pending.get(client) === settled) pending.delete(client);
  }
}
