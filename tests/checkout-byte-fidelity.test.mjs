import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { test } from "node:test";

test("Windows-style checkout preserves frozen bytes and LF-pinned raw application inputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "pattern-checkout-bytes-"));
  const git = (args, input) =>
    execFileSync("git", ["-c", "core.autocrlf=true", "-c", "core.safecrlf=false", ...args], {
      cwd: root,
      input,
      stdio: ["pipe", "pipe", "pipe"],
    });
  try {
    let attributes = Buffer.alloc(0);
    try {
      attributes = await readFile(new URL("../.gitattributes", import.meta.url));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    git(["init", "--quiet"]);
    await writeFile(join(root, ".gitattributes"), attributes);
    const samples = new Map([
      ["docs/reviews/byte-probe/frozen-lf.json", Buffer.from('{"capture":"LF"}\n')],
      ["docs/reviews/byte-probe/frozen-crlf.json", Buffer.from('{"capture":"CRLF"}\r\n')],
      ["src/lib/ai/context-writing-benchmarks.json", Buffer.from('{"raw":"benchmark"}\n')],
      ["src/lib/ai/context-writing-material.json", Buffer.from('{"raw":"material"}\n')],
      ["src/lib/ai/member-context-readings.json", Buffer.from('{"raw":"fallback"}\n')],
      ["src/lib/ai/member-context-reading.ts", Buffer.from('export const version = "test";\n')],
      ["src/lib/content/context-pilot-bundle.json", Buffer.from('{"raw":"bundle"}\n')],
    ]);
    // Populate only this disposable repository's index; no commit is needed.
    for (const [path, bytes] of samples) {
      const sha = git(["hash-object", "-w", "--stdin"], bytes).toString().trim();
      git(["update-index", "--add", "--cacheinfo", `100644,${sha},${path}`]);
    }
    git(["checkout-index", "--all", "--force"]);
    for (const [path, bytes] of samples) {
      assert.deepEqual(await readFile(join(root, path)), bytes, path);
    }
  } finally {
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    assert.ok(basename(root).startsWith("pattern-checkout-bytes-"));
    await rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
});
