/** Numeric release order is stable even when two candidates share a creation timestamp. */
export function isEarlierRelease(
  target: { version: string; created_at: string },
  current: { version: string; created_at: string },
) {
  const numeric = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (numeric.test(target.version) && numeric.test(current.version)) {
    const a = target.version.split(".").map(BigInt),
      b = current.version.split(".").map(BigInt);
    for (let index = 0; index < 3; index++) {
      if (a[index] !== b[index]) return a[index]! < b[index]!;
    }
    return false;
  }
  return Date.parse(target.created_at) < Date.parse(current.created_at);
}
