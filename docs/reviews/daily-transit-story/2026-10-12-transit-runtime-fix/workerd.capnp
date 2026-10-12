using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [
    (name = "app", worker = (
      compatibilityDate = "2026-09-26",
      modules = [(name = "worker.mjs", esModule = embed "workerd-probe.js")],
      globalOutbound = "fixture"
    )),
    (name = "fixture", worker = (
      compatibilityDate = "2026-09-26",
      modules = [(name = "fixture.mjs", esModule = embed "workerd-fixture.js")]
    ))
  ]
);
