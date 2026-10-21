import assert from "node:assert/strict";
import { test } from "node:test";

const { userFacingError } = await import("../src/lib/user-facing-error.ts");
const fallback = "We couldn’t complete the request. You can try again.";

test("curated server messages reach the member unchanged", () => {
  for (const message of [
    "Your birth record could not be loaded. Please retry.",
    "Invalid login credentials",
    "Choose an available chapter or select No chapter before saving.",
  ])
    assert.equal(userFacingError(new Error(message), fallback), message);
});

test("browser transport failures use the page's recovery copy", () => {
  for (const message of [
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "Load failed",
    "The network connection was lost.",
    "The Internet connection appears to be offline.",
    "fetch failed",
  ])
    assert.equal(userFacingError(new Error(message), fallback), fallback);
  assert.equal(userFacingError(new TypeError("anything"), fallback), fallback);
  const aborted = new Error("The operation was aborted.");
  aborted.name = "AbortError";
  assert.equal(userFacingError(aborted, fallback), fallback);
});

test("runtime and storage internals never become member copy", () => {
  for (const message of [
    "HTTPError",
    "Internal Server Error",
    "Invariant failed: expected result to be resolved",
    "Cannot read properties of undefined (reading 'id')",
    "x.map is not a function",
    "Unexpected token < in JSON at position 0",
    "D1_ERROR: no such column: revision",
    "SQLITE_BUSY: database is locked",
  ])
    assert.equal(userFacingError(new Error(message), fallback), fallback);
});

test("non-Error throws and empty messages use the fallback", () => {
  assert.equal(userFacingError("boom", fallback), fallback);
  assert.equal(userFacingError(undefined, fallback), fallback);
  assert.equal(userFacingError(new Error("   "), fallback), fallback);
});
