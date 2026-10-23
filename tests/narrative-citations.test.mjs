import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { resolve } from "node:path";
import { createServer } from "vite";

let vite, citations;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    logLevel: "error",
    resolve: { alias: { "@": resolve("src") } },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  citations = await vite.ssrLoadModule("/src/lib/narrative-citations.ts");
});
after(async () => vite?.close());

const known = ["N1", "N2", "N3", "R1"];

test("non-array input yields no citations", () => {
  for (const value of [null, undefined, "bad", 7, {}, { paragraph: 1, facts: ["N1"] }]) {
    assert.deepEqual(citations.sanitizeNarrativeCitations(value, known), []);
    assert.deepEqual(citations.readableNarrativeCitations(value), []);
  }
});

test("null, malformed and string entries are ignored", () => {
  const value = [null, "bad", 42, [], { paragraph: 1, facts: ["N1"] }];
  assert.deepEqual(citations.sanitizeNarrativeCitations(value, known), [
    { paragraph: 1, facts: ["N1"] },
  ]);
});

test("invalid paragraphs are dropped", () => {
  const value = [
    { paragraph: 0, facts: ["N1"] },
    { paragraph: -1, facts: ["N1"] },
    { paragraph: 1.5, facts: ["N1"] },
    { paragraph: 101, facts: ["N1"] },
    { paragraph: "1", facts: ["N1"] },
    { paragraph: 1, facts: ["N1"] },
  ];
  assert.deepEqual(citations.sanitizeNarrativeCitations(value, known), [
    { paragraph: 1, facts: ["N1"] },
  ]);
});

test("missing or non-array facts are dropped", () => {
  const value = [
    { paragraph: 1 },
    { paragraph: 1, facts: "N1" },
    { paragraph: 1, facts: [] },
    { paragraph: 2, facts: ["N2"] },
  ];
  assert.deepEqual(citations.sanitizeNarrativeCitations(value, known), [
    { paragraph: 2, facts: ["N2"] },
  ]);
});

test("unknown fact IDs are removed with a known fact set", () => {
  assert.deepEqual(
    citations.sanitizeNarrativeCitations([{ paragraph: 1, facts: ["N1", "UNKNOWN", "N2"] }], known),
    [{ paragraph: 1, facts: ["N1", "N2"] }],
  );
});

test("a citation with no remaining facts is dropped", () => {
  assert.deepEqual(
    citations.sanitizeNarrativeCitations([{ paragraph: 1, facts: ["UNKNOWN"] }], known),
    [],
  );
});

test("duplicate paragraphs merge facts and preserve first-seen order", () => {
  assert.deepEqual(
    citations.sanitizeNarrativeCitations(
      [
        { paragraph: 2, facts: ["R1"] },
        { paragraph: 1, facts: ["N2"] },
        { paragraph: 2, facts: ["N1", "R1"] },
      ],
      known,
    ),
    [
      { paragraph: 1, facts: ["N2"] },
      { paragraph: 2, facts: ["R1", "N1"] },
    ],
  );
});

test("duplicate fact IDs within one citation render once", () => {
  assert.deepEqual(
    citations.sanitizeNarrativeCitations([{ paragraph: 1, facts: ["N1", "N1", "N2"] }], known),
    [{ paragraph: 1, facts: ["N1", "N2"] }],
  );
  assert.deepEqual(citations.readableNarrativeCitations([{ paragraph: 1, facts: ["N1", "N1"] }]), [
    { paragraph: 1, facts: ["N1"] },
  ]);
});

test("valid citations are returned sorted by paragraph", () => {
  assert.deepEqual(
    citations.sanitizeNarrativeCitations(
      [
        { paragraph: 3, facts: ["N3"] },
        { paragraph: 1, facts: ["N1"] },
        { paragraph: 2, facts: ["N2"] },
      ],
      known,
    ),
    [
      { paragraph: 1, facts: ["N1"] },
      { paragraph: 2, facts: ["N2"] },
      { paragraph: 3, facts: ["N3"] },
    ],
  );
});

test("extra stored fields are stripped rather than rejecting the citation", () => {
  assert.deepEqual(
    citations.sanitizeNarrativeCitations(
      [{ paragraph: 1, facts: ["N1"], legacyNote: "kept out" }],
      known,
    ),
    [{ paragraph: 1, facts: ["N1"] }],
  );
});

test("the readable validator keeps unknown IDs and is safe for malformed input", () => {
  const value = [null, "bad", { paragraph: 1, facts: ["UNKNOWN", "UNKNOWN"] }];
  assert.deepEqual(citations.readableNarrativeCitations(value), [
    { paragraph: 1, facts: ["UNKNOWN"] },
  ]);
});
