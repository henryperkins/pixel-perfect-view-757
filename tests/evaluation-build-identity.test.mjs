import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("evaluation build attribution rejects dirty runtime inputs while preserving unrelated local environment work", async () => {
  const { readBuildSourceSha } = await import("../scripts/build-source-identity.mjs");
  const root = await mkdtemp(join(tmpdir(), "pattern-source-identity-"));
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  try {
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src", "sample.ts"), "export const value=1;\n");
    await writeFile(join(root, "tsconfig.json"), "{}\n");
    git(["init", "-q"]);
    git(["add", "src/sample.ts", "tsconfig.json"]);
    git([
      "-c",
      "user.name=Source test",
      "-c",
      "user.email=source@example.invalid",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--no-gpg-sign",
      "-q",
      "-m",
      "initial",
    ]);
    const sha = git(["rev-parse", "HEAD"]);
    assert.equal(readBuildSourceSha(root), sha);
    await writeFile(join(root, ".env"), "PRIVATE_TEST_SENTINEL=preserved\n");
    assert.equal(readBuildSourceSha(root), sha);
    await writeFile(join(root, "tsconfig.json"), '{"compilerOptions":{"target":"ES2022"}}\n');
    assert.equal(readBuildSourceSha(root), null);
    git(["checkout", "--", "tsconfig.json"]);
    await writeFile(join(root, "src", "untracked.ts"), "export const next=2;\n");
    assert.equal(readBuildSourceSha(root), null);
    await rm(join(root, "src", "untracked.ts"));
    await writeFile(join(root, "src", "sample.ts"), "export const value=3;\n");
    assert.equal(readBuildSourceSha(root), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
