using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [
    (name = "app", worker = (
      compatibilityDate = "2026-09-26",
      compatibilityFlags = ["nodejs_compat"],
      modules = [
        (name = "worker.mjs", esModule = embed "probe.js"),
        (name = "test-data", esModule = embed "test-data.mjs")
      ],
      globalOutbound = "fixture"
    )),
    (name = "fixture", worker = (
      compatibilityDate = "2026-09-26",
      modules = [
        (name = "fixture.mjs", esModule = embed "fixture.js"),
        (name = "test-data", esModule = embed "test-data.mjs")
      ]
    ))
  ]
);
