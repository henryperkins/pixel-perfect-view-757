import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { prepareEditorialMemberDelivery } from "../scripts/editorial-member-delivery.mjs";
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

test("current release verification measures authored delivery for both providers and restores the caller environment", async () => {
  const beforeFetch = globalThis.fetch;
  const envNames = [
    "LOVABLE_API_KEY",
    "GEMINI_ENTERPRISE_API_KEY",
    "PATTERN_MEMBER_LANGUAGE_PROVIDER",
  ];
  const beforeEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  const plan = await prepareEditorialMemberDelivery(root);
  assert.equal(plan.providerAttempts, 0);
  assert.equal(plan.plannedProviderAttempts, 0);
  assert.equal(plan.cases.length, 18);
  assert.deepEqual(
    plan.policies.map((policy) => [policy.model, policy.thinkingLevel]),
    [
      ["google/gemini-3.8-flash", null],
      ["gemini-enterprise/gemini-4-argon", "HIGH"],
    ],
  );
  for (const result of plan.cases) {
    assert.equal(result.prose.meta.diagnostics.code, "authored_editorial");
    assert.equal(result.request, null);
    assert.equal(result.transport, null);
  }
  assert.equal(globalThis.fetch, beforeFetch);
  assert.deepEqual(
    Object.fromEntries(envNames.map((name) => [name, process.env[name]])),
    beforeEnv,
  );
  assert.doesNotMatch(JSON.stringify(plan), /offline-delivery-check/);
});

test("the current delivery CLI prepares and verifies a separate immutable offline plan and detects policy drift", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "pattern-delivery-validation-"));
  try {
    const output = join(temporary, "current");
    const prepared = cli("validate-editorial-release.mjs", "--prepare", "--output-dir", output);
    assert.equal(prepared.status, 0, prepared.stderr);
    assert.equal(JSON.parse(prepared.stdout).providerAttempts, 0);
    const file = join(output, "plan.json");
    const original = await readFile(file, "utf8");
    const verified = cli("validate-editorial-release.mjs", "--verify", "--output-dir", output);
    assert.equal(verified.status, 0, verified.stderr);
    assert.equal(JSON.parse(verified.stdout).status, "verified-current-delivery");
    const duplicate = cli("validate-editorial-release.mjs", "--prepare", "--output-dir", output);
    assert.notEqual(duplicate.status, 0);
    assert.equal(await readFile(file, "utf8"), original);
    const tampered = JSON.parse(original);
    tampered.policies[1].thinkingLevel = "LOW";
    await writeFile(file, JSON.stringify(tampered));
    const drift = cli("validate-editorial-release.mjs", "--verify", "--output-dir", output);
    assert.notEqual(drift.status, 0);
    assert.match(drift.stderr, /Current member policy, runtime or delivery changed/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
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
