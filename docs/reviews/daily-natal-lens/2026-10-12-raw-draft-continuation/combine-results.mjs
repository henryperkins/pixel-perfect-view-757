import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const [previousPath, currentPath, parityPath, outputPath] = process.argv.slice(2);
const read = async (path) => {
  const bytes = await readFile(path);
  return { value: JSON.parse(bytes), sha256: createHash("sha256").update(bytes).digest("hex") };
};
const previous = await read(previousPath),
  current = await read(currentPath),
  parity = await read(parityPath);
assert.equal(parity.value.applicationSourceByteIdentical, true);
const samples = [
  ...previous.value.samples.map((s) => ({ ...s, run: "first-partial-run" })),
  ...current.value.samples.map((s) => ({ ...s, run: "continuation" })),
];
const cases = ["natal-duty-reflex", "natal-moon-fallback", "natal-synthesis-integration"];
const expected = cases.flatMap((caseId) => [1, 2].map((repetition) => `${caseId}/${repetition}`));
const actual = samples.map((s) => `${s.caseId}/${s.repetition}`);
assert.equal(new Set(actual).size, actual.length);
assert.ok(actual.every((key) => expected.includes(key)));
const missing = expected.filter((key) => !actual.includes(key));
const result = {
  kind: "six-draft-targeted-writing-recheck",
  verdict: missing.length === 0 && samples.every((s) => s.verdict === "pass") ? "pass" : "fail",
  requestedDrafts: 6,
  capturedDrafts: samples.length,
  passedDrafts: samples.filter((s) => s.verdict === "pass").length,
  missing,
  previousResultSha256: previous.sha256,
  continuationResultSha256: current.sha256,
  applicationSourceParitySha256: parity.sha256,
  historicalPartialRunsUnchanged: true,
  fullBenchmarkClaim: false,
  candidatesActivated: false,
  cases: cases.map((caseId) => ({
    caseId,
    drafts: samples.filter((s) => s.caseId === caseId),
    passed:
      !missing.some((k) => k.startsWith(caseId + "/")) &&
      samples.filter((s) => s.caseId === caseId).every((s) => s.verdict === "pass"),
  })),
};
await writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(
  JSON.stringify({
    verdict: result.verdict,
    capturedDrafts: result.capturedDrafts,
    passedDrafts: result.passedDrafts,
    missing: result.missing,
  }),
);
