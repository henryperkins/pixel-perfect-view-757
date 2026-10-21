# Behavioral run protocol

The catalog in eval_scenarios.json maps 49 synthetic decision records to the October 20 r2 cases. Each has raw facts/request and separate critical semantic criteria. Tests evaluate agent decisions from supplied records, not fresh app, browser, backend, or device behavior. The mechanical Python tests are a different evidence layer.

Export raw packets with export_behavior_packets.py --output-dir <new-directory>. Give a fresh agent only a raw packet, the active skill and relevant references, and a response path. Withhold the catalog, grading criteria, previous reviews, and prior agent answers. Do not tell the agent the expected decision or the implementation's known weaknesses. Keep independent records separate and do not fabricate additional observations.

Use a natural request: “Use the local mobile-web-ux-runner skill to handle these independent mobile audit records. Read the skill and relevant references. Treat the supplied observations as the available record; do not invent or execute additional application/device observations. Save a JSON response for each record using the packet shape.”

After execution, a separate grader compares each actual response with all critical criteria. Pass requires the substantive expected decisions with no material contradiction. Missing output is Not run. A repeated keyword is not sufficient evidence. Preserve failures and their first-run outputs; after a correction, use a fresh agent with the same raw facts and record the new attempt separately.

Record the runtime file hashes, packet hash, agent/harness identity actually exposed, available tools, response hash, criteria results, and limitations. A package's installed catalog does not by itself establish any passing run. Refer to a separate execution record for actual results. Do not generalize one run to other models, toolsets, application contexts, or physical devices.

The recorded October 20 execution is summarized in last-behavior-run.json. It preserves the first-pass failure and the targeted follow-up result; its latest outcomes do not mean the entire suite was rerun after that correction. The catalog remains a fixture definition, separate from execution evidence.
