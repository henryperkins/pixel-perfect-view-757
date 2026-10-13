# Strict replay remains failed

Both strict Node replay attempts stopped before consuming captured responses with `The content comparison runtime, fixture, or policy identity drifted.` The exact diagnosis is recorded in `replay-runtime-diagnostic.json`. No fixture, policy, hash, or capture was changed to obtain a pass.

Node v24.21.0 (V8 13.6.233.17-node.53) and workerd 2026-10-06 generate one different floating-point value from the same immutable source at `82efe38df4c5ee571d6c583de144498c93f596f1`. In the projected `arc-birth-window-disagreement` fixture, `scan.samples[2].windows[0].egress.bracket[1].speed` is `0.14049560922953028` under Node and `0.14049560922953025` under workerd. That difference changes the exact JSON hash even though this legacy transit fixture is outside the four-case pilot. Local workerd reproduces the live frozen hash exactly.

Reproduce from this checkout with an existing workerd binary:

```sh
node docs/reviews/content-draft-effectiveness/2026-10-13/pilot/reproduce-runtime-hash.mjs /absolute/path/to/workerd
```

The script reads the source SHA from the archived frozen pair, retrieves both original fixture modules with `git show`, and runs their unchanged generated values in Node and a local workerd test handler. It writes temporary diagnostic modules under the system temporary directory; it makes no network or provider requests and does not edit the checkout. It compares every field of the exact projection used by `src/lib/ai/reading-evaluation.transit.ts`:

```js
READING_EVAL_CASES.filter((f) => f.transitEpisodeScan).map((f) => ({
  scan: f.transitEpisodeScan,
  anchor: f.transitAnchor,
}));
```

Expected hashes with those runtime versions:

- Node: `82b5887883c97b274d03013eff86543fc048d82d6bdfa18bf19f55db07604fea`.
- workerd and the live frozen plan: `234ea6b7fb37803dc78f93e244a7f4a678c677a63f36fcce88613ebc102ac7ce`.

Future remediation should version the affected fixtures and their identity contract explicitly—for example, store the reviewed synthetic scan values as immutable data—or execute strict replay in the matching workerd runtime. Do not overwrite historical frozen hashes, substitute expected metadata, relax the check, or label this diagnostic as a passed replay. A future implementation needs cross-runtime identity tests and a separate decision about qualifying evidence; the approved eight-call pilot has already exhausted its generation allowance.
