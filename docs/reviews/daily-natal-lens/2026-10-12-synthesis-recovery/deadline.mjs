import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SERVING_DEADLINE_MS = 60_000;
const RUNTIME_DEADLINE_MS = 180_000;
const DIAGNOSTICS_MODULE = "src/lib/ai/diagnostics.ts";
const DEADLINE_TRANSFORM_SPEC = Object.freeze({
  kind: "exact-source-substitution",
  module: DIAGNOSTICS_MODULE,
  from: "export const DAILY_GATEWAY_TIMEOUT_MS = 60_000;",
  to: "export const DAILY_GATEWAY_TIMEOUT_MS = 180_000;",
  expectedMatches: 1,
  scope: "this runner's Vite SSR module loader only",
  servingDeadlineMs: SERVING_DEADLINE_MS,
  runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
});
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fail = (code) => {
  throw Object.assign(new Error(code), { runnerCode: code });
};
export function runtimeDeadlineTransform(originalCode) {
  const { from, to, expectedMatches } = DEADLINE_TRANSFORM_SPEC;
  if (originalCode.split(from).length - 1 !== expectedMatches)
    fail("unexpected_serving_deadline_source");
  const code = originalCode.replace(from, to);
  const record = {
    kind: "extended-synthetic-runtime-deadline",
    servingDeadlineMs: SERVING_DEADLINE_MS,
    runtimeDeadlineMs: RUNTIME_DEADLINE_MS,
    servingAvailabilityEstablished: false,
    transformedModule: DIAGNOSTICS_MODULE,
    originalModuleSha256: digest(originalCode),
    transformedModuleSha256: digest(code),
    transformSpecification: DEADLINE_TRANSFORM_SPEC,
    transformSpecificationSha256: digest(json(DEADLINE_TRANSFORM_SPEC)),
    nativeProviderFunctionOrPayloadTransformed: false,
  };
  return { code, record };
}

export function createRuntimeDeadlinePlugin(override) {
  const target = join(PROJECT_ROOT, DIAGNOSTICS_MODULE);
  let applications = 0;
  return {
    plugin: {
      name: "natal-round-3-runtime-deadline",
      enforce: "pre",
      transform(code, id) {
        if (id.split("?")[0] !== target) return null;
        if (digest(code) !== override.originalModuleSha256)
          fail("unexpected_diagnostics_transform_input");
        const transformed = runtimeDeadlineTransform(code);
        if (JSON.stringify(transformed.record) !== JSON.stringify(override))
          fail("runtime_override_identity_changed");
        applications += 1;
        return { code: transformed.code, map: null };
      },
    },
    assertApplied() {
      if (applications !== 1) fail("runtime_deadline_transform_not_applied_exactly_once");
    },
  };
}
