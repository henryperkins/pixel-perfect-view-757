// Usage: node analyze.mjs <worktree> <before.json> <after.json> <out.json>
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const [root, beforePath, afterPath, out] = process.argv.slice(2);
const { requestUnits, premiseLocations, bodyPremises } = await import(pathToFileURL(`${root}/tests/helpers/context-premises.mjs`).href);
const load = async (p) => JSON.parse(await readFile(p, "utf8"));
const analysis = { requests: {}, bodies: {} };
for (const [label, path] of [["before", beforePath], ["after", afterPath]]) {
  const captured = await load(path);
  analysis.requests[label] = captured.cases.map((c) => {
    const units = requestUnits(c.system, c.user);
    const locations = premiseLocations(units);
    return {
      id: c.id,
      systemChars: c.systemChars,
      userChars: c.userChars,
      requestBytes: c.requestBytes,
      requestSha256: c.requestSha256,
      units: units.length,
      premiseExpressions: Object.fromEntries(Object.entries(locations).map(([k, v]) => [k, v.length])),
      repeatedPremises: Object.fromEntries(Object.entries(locations).filter(([, v]) => v.length > 1)),
    };
  });
}
const dir = `${root}/docs/reviews/daily-reading-context-production/2026-10-17/revision-5`;
const refs = (await load(`${dir}/reference-readings.json`)).cases;
const edits = (await load(`${dir}/edited-failures.json`)).cases;
const body = (paragraphs) => paragraphs.map((p) => p.text).join("\n\n");
const summarize = (paragraphs) => {
  const found = bodyPremises(body(paragraphs));
  return { premiseSentences: found, repeated: Object.fromEntries(Object.entries(found).filter(([, v]) => v.length > 1)) };
};
analysis.bodies.reference = Object.fromEntries(refs.map((r) => [r.id, summarize(r.paragraphs)]));
analysis.bodies.edited = Object.fromEntries(edits.map((e) => [`${e.blindLabel} ${e.id}`, summarize(e.edited.paragraphs)]));
analysis.bodies.original = Object.fromEntries(edits.map((e) => [`${e.blindLabel} ${e.id}`, summarize(e.original.paragraphs)]));
await writeFile(out, JSON.stringify(analysis, null, 1) + "\n");
for (const label of ["before", "after"]) {
  console.log(`== ${label} requests`);
  for (const r of analysis.requests[label]) console.log(r.id.padEnd(30), "user", r.userChars, "repeated:", JSON.stringify(Object.fromEntries(Object.entries(r.repeatedPremises).map(([k, v]) => [k, v.length]))));
}
for (const group of ["reference", "edited", "original"]) {
  console.log(`== ${group} bodies`);
  for (const [k, v] of Object.entries(analysis.bodies[group])) console.log(k.padEnd(32), "repeated:", JSON.stringify(v.repeated), "all:", JSON.stringify(Object.fromEntries(Object.entries(v.premiseSentences).map(([a, b]) => [a, b.join(",")]))));
}
