import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { QueryClient } from "@tanstack/react-query";

const root =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(join(root, "package.json"));
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
let vite, runUpcomingRequest;
before(async () => {
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ runUpcomingRequest } = await vite.ssrLoadModule("/src/lib/upcoming-request.ts"));
});
after(async () => vite?.close());

const gate = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

test("a new selection waits for the real in-flight request even after its signal is aborted", async () => {
  const scope = {},
    active = gate(),
    started = gate();
  const firstSignal = new AbortController(),
    nextSignal = new AbortController();
  const first = runUpcomingRequest(scope, firstSignal.signal, () => {
    started.resolve();
    return active.promise;
  });
  await started.promise;
  firstSignal.abort();
  let secondStarted = false;
  const second = runUpcomingRequest(scope, nextSignal.signal, async () => {
    secondStarted = true;
    return "current selection";
  });
  await Promise.resolve();
  assert.equal(secondStarted, false);
  active.resolve("old selection");
  assert.equal(await first, "old selection");
  assert.equal(await second, "current selection");
});

test("obsolete queued selections never make a service request", async () => {
  const scope = {},
    active = gate(),
    started = gate();
  const current = new AbortController(),
    obsolete = new AbortController(),
    latest = new AbortController();
  const calls = [];
  const first = runUpcomingRequest(scope, current.signal, async () => {
    calls.push("first");
    started.resolve();
    return active.promise;
  });
  await started.promise;
  const discarded = runUpcomingRequest(scope, obsolete.signal, async () => calls.push("obsolete"));
  const discardedResult = assert.rejects(discarded, { name: "AbortError" });
  obsolete.abort();
  const final = runUpcomingRequest(scope, latest.signal, async () => calls.push("latest"));
  active.resolve();
  await Promise.all([first, discardedResult, final]);
  assert.deepEqual(calls, ["first", "latest"]);
});

test("a rejected calculation releases the next selection and is not retried", async () => {
  const scope = {},
    active = gate(),
    started = gate(),
    signal = new AbortController().signal;
  let attempts = 0;
  const first = runUpcomingRequest(scope, signal, () => {
    attempts++;
    started.resolve();
    return active.promise;
  });
  const rejected = assert.rejects(first, /connection lost/);
  await started.promise;
  const next = runUpcomingRequest(scope, signal, async () => "recovered");
  active.reject(new Error("connection lost"));
  await rejected;
  assert.equal(await next, "recovered");
  assert.equal(attempts, 1);
});

test("a synchronous throw releases the queue without poisoning later requests", async () => {
  const scope = {},
    signal = new AbortController().signal;
  await assert.rejects(
    runUpcomingRequest(scope, signal, () => {
      throw new Error("failed");
    }),
    /failed/,
  );
  assert.equal(await runUpcomingRequest(scope, signal, async () => 42), 42);
});

test("an already-cancelled request never starts and the same scope remains usable", async () => {
  const scope = {},
    cancelled = new AbortController();
  cancelled.abort();
  let calls = 0;
  await assert.rejects(
    runUpcomingRequest(scope, cancelled.signal, async () => calls++),
    { name: "AbortError" },
  );
  assert.equal(calls, 0);
  assert.equal(
    await runUpcomingRequest(scope, new AbortController().signal, async () => "ready"),
    "ready",
  );
});

test("independent browser query clients do not share results or block one another", async () => {
  const active = gate(),
    started = gate(),
    signal = new AbortController().signal;
  const first = runUpcomingRequest({}, signal, () => {
    started.resolve();
    return active.promise;
  });
  await started.promise;
  assert.equal(
    await runUpcomingRequest({}, signal, async () => "other account client"),
    "other account client",
  );
  active.resolve("first client");
  assert.equal(await first, "first client");
});

test("cancelled account queries cannot restore erased results or overlap the next account", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const active = gate(),
    started = gate();
  const previousKey = ["upcoming-cycles", "previous-owner"];
  const nextKey = ["upcoming-cycles", "next-owner"];
  const previous = client.fetchQuery({
    queryKey: previousKey,
    queryFn: ({ signal }) =>
      runUpcomingRequest(client, signal, () => {
        started.resolve();
        return active.promise;
      }),
  });
  const cancelled = assert.rejects(previous);
  await started.promise;
  await client.cancelQueries({ queryKey: previousKey, exact: true });
  client.removeQueries({ queryKey: previousKey, exact: true });
  let nextStarted = false;
  const next = client.fetchQuery({
    queryKey: nextKey,
    queryFn: ({ signal }) =>
      runUpcomingRequest(client, signal, async () => {
        nextStarted = true;
        return { owner: "next-owner" };
      }),
  });
  await Promise.resolve();
  assert.equal(nextStarted, false);
  active.resolve({ owner: "previous-owner" });
  await cancelled;
  assert.deepEqual(await next, { owner: "next-owner" });
  assert.equal(client.getQueryData(previousKey), undefined);
  assert.deepEqual(client.getQueryData(nextKey), { owner: "next-owner" });
  client.clear();
});

test("a stalled transport is aborted after one minute and releases the next selection", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const scope = {},
    started = gate(),
    signal = new AbortController().signal;
  let transportSignal,
    attempts = 0;
  const stalled = runUpcomingRequest(scope, signal, (deadlineSignal) => {
    transportSignal = deadlineSignal;
    attempts++;
    started.resolve();
    return new Promise(() => {});
  });
  let timedOut = false;
  const rejected = assert.rejects(stalled, (error) => {
    timedOut = error.name === "TimeoutError";
    return timedOut;
  });
  await started.promise;
  let nextStarted = false;
  const next = runUpcomingRequest(scope, signal, async () => {
    nextStarted = true;
    return "recovered";
  });
  t.mock.timers.tick(59_999);
  await Promise.resolve();
  assert.equal(nextStarted, false, "a filter change must not release the active call early");
  t.mock.timers.tick(1);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(timedOut, true, "a stalled call must reach a recoverable error state");
  await rejected;
  assert.equal(transportSignal.aborted, true, "the browser transport must receive the deadline");
  assert.equal(await next, "recovered");
  assert.equal(attempts, 1, "a timeout must not retry the original calculation");
});

test("a queued selection gets a fresh deadline only when its transport starts", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const scope = {},
    firstResult = gate(),
    firstStarted = gate(),
    nextResult = gate(),
    nextStarted = gate(),
    signal = new AbortController().signal;
  let firstTransportSignal, nextTransportSignal;
  const first = runUpcomingRequest(scope, signal, (deadlineSignal) => {
    firstTransportSignal = deadlineSignal;
    firstStarted.resolve();
    return firstResult.promise;
  });
  await firstStarted.promise;
  t.mock.timers.tick(45_000);
  const next = runUpcomingRequest(scope, signal, (deadlineSignal) => {
    nextTransportSignal = deadlineSignal;
    nextStarted.resolve();
    return nextResult.promise;
  });
  firstResult.resolve("first");
  await first;
  await nextStarted.promise;
  t.mock.timers.tick(59_999);
  assert.equal(firstTransportSignal.aborted, false, "a settled call must clear its deadline");
  assert.equal(nextTransportSignal.aborted, false, "queue wait must not consume the next deadline");
  nextResult.resolve("next");
  assert.equal(await next, "next");
});
