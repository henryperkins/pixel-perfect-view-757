import { resolve } from "node:path";
import { mcpPlugin as lovableMcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

/** Keep the SDK's containment checks on native paths without changing Vite's shared config. */
export function mcpPlugin(options) {
  const plugin = lovableMcpPlugin(options);
  const configResolved = plugin.configResolved;
  if (typeof configResolved !== "function") {
    throw new Error("The Lovable MCP plugin configResolved hook changed; review the path adapter.");
  }
  return {
    ...plugin,
    configResolved(config) {
      return configResolved.call(this, { ...config, root: resolve(config.root) });
    },
  };
}
