/** Read-only verification of the closed five-attempt Flash campaign, never current-runtime proof. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const EDITORIAL_RELEASE_DIRECTORY = "docs/reviews/daily-reading-release/2026-10-17";
const archiveDirectory = `${EDITORIAL_RELEASE_DIRECTORY}/provider-validation`;
// Pin the already completed evidence. A changed runtime must not mint new attempts for this campaign.
const artifacts = {
  "plan.json": "ea6fed701923e0e18c0a67d899a7bbcdb15e36405a3b8bc1dbb1c397db3e3b6b",
  "run.json": "bf2477b5cc172852dde77944fd6411727060d286ac344db8a2b17be2ed84141f",
  "1-request.json": "14f9d17313e90d3163b534b3789531c75eac5bc276773862dc4c2295c29f9699",
  "1-result.json": "484c68ca965b872c281e36b8f79030ce48f8ae80a155bf56afaa04b42fd480fc",
  "2-request.json": "bd3ade096c62a5e53f7277ab6fea9d87e28f29afac2a3881601747d22bace6c0",
  "2-result.json": "69cb9b8027dbc765a58451e9baae225b3706758380b68eaac34c9f3fbcc649b9",
  "remaining-cases/plan.json": "eeb7b5475d49954b526918a499b51b4c0b2f55e986f6e74fd1b6dab95b005eb6",
  "remaining-cases/run.json": "98d1239da5478cbd5a495b179a74b315941a142470289e59737507ccb60df39b",
  "remaining-cases/3-request.json":
    "0661f4335b08908003633dc93aabc4b976c8773e5d1f44767e126397ffa10089",
  "remaining-cases/3-result.json":
    "3611add000b28bcceecb7d54978670e19d0f689cbe181620459f5a6ded3f2bc9",
  "remaining-cases/4-request.json":
    "8dd703319258250843b0d2719fd638d74654d86e604eb462c31b05cca4352281",
  "remaining-cases/4-result.json":
    "3a4b7be33440bda707e14104f7b53134d37038801bd1e09aa13890583bf85df3",
  "remaining-cases/5-request.json":
    "2c7aff4a3727672773ca806a370a225b6539663a0affdca340bdacc59679e151",
  "remaining-cases/5-result.json":
    "526789f7a6a6daf4e9c1287c5a2f4def48e3c31daca3c13fb840c59cdc77b260",
};
export async function verifyEditorialReleaseArchive(root) {
  const captured = {};
  for (const [name, expected] of Object.entries(artifacts)) {
    const bytes = await readFile(resolve(root, archiveDirectory, name));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      expected,
      `Archived evidence changed: ${name}`,
    );
    captured[name] = JSON.parse(bytes);
  }
  const first = captured["run.json"];
  const final = captured["remaining-cases/run.json"];
  assert.equal(final.status, "completed_with_fallbacks");
  assert.equal(final.providerAttempts, 5);
  assert.equal(first.entries.length + final.entries.length, final.providerAttempts);
  return {
    status: "verified-archive",
    sourceSha: captured["plan.json"].sourceSha,
    model: "gemini-enterprise/gemini-3.8-flash",
    archivedProviderAttempts: final.providerAttempts,
    archivedReservedMicros: final.reservedMicros,
    verifiedArtifacts: Object.keys(artifacts).length,
    networkAttempts: 0,
    evidence:
      "Pinned historical captures only; this does not verify or execute the current member writer.",
  };
}
