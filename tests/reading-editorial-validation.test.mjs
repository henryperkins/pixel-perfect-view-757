import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  EDITORIAL_RELEASE_DIRECTORY,
  verifyEditorialReleaseArchive,
} from "../scripts/editorial-release-archive.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = (script, ...args) =>
  spawnSync(process.execPath, [`scripts/${script}`, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
  });

test("the completed Flash campaign is verifiable independently of current model changes but cannot be rerun", async () => {
  const archive = await verifyEditorialReleaseArchive(root);
  assert.equal(archive.model, "gemini-enterprise/gemini-3.8-flash");
  assert.equal(archive.archivedProviderAttempts, 5);
  assert.equal(archive.verifiedArtifacts, 14);
  assert.equal(archive.networkAttempts, 0);
  for (const [script, mode] of [
    ["validate-editorial-release.mjs", "--verify-archive"],
    ["continue-editorial-release.mjs", "--verify"],
  ]) {
    const verified = cli(script, mode);
    assert.equal(verified.status, 0, verified.stderr);
    assert.deepEqual(JSON.parse(verified.stdout), archive);
    const rerun = cli(script, "--run");
    assert.notEqual(rerun.status, 0);
    assert.match(rerun.stderr, /closed|cannot be reopened/);
  }
  assert.deepEqual(await verifyEditorialReleaseArchive(root), archive);
});

test("archive verification detects altered recorded requests, not just intact plan and ledger hashes", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "pattern-release-archive-"));
  try {
    const relative = `${EDITORIAL_RELEASE_DIRECTORY}/provider-validation`;
    const copy = join(temporary, relative);
    await cp(join(root, relative), copy, { recursive: true });
    await verifyEditorialReleaseArchive(temporary);
    const path = join(copy, "remaining-cases/5-request.json");
    const request = JSON.parse(await readFile(path, "utf8"));
    request.endpoint = request.endpoint.replace("gemini-3.8-flash", "gemini-4-argon");
    await writeFile(path, JSON.stringify(request));
    await assert.rejects(
      verifyEditorialReleaseArchive(temporary),
      /Archived evidence changed: remaining-cases\/5-request/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
