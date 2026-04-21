import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { trackingToolPrefix } from "../client/matomo-tracking.js";

/**
 * Read-only tool mirrors for server-environment resources.
 *
 * These tools exist so that MCP clients which do not implement the
 * `resources/*` capability can still query information about the
 * currently active Simplifier server instance. Clients that support
 * resources should prefer the corresponding
 * `simplifier://server-active-instance` and `simplifier://server-instances`
 * resources.
 */
export function registerServerEnvironmentReadTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameInstanceList = "server-instance-list";
  server.tool(toolNameInstanceList,
    `# List configured server instances

Returns all server instances known to the connected Simplifier server, including which one is active.
Useful when choosing the value for \`endpoint.endpoint\` in connector endpoint configurations.`,
    {},
    {
      title: "List server instances",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("list server instances", async () => {
        const trackingKey = trackingToolPrefix + toolNameInstanceList;
        return simplifier.getInstanceSettings(trackingKey);
      });
    });

  const toolNameActiveInstance = "server-active-instance-get";
  server.tool(toolNameActiveInstance,
    `# Get the currently active server instance

Returns the active Simplifier server instance. Use its \`name\` as the endpoint name when creating
connector endpoint configurations for the server you are currently connected to.

Equivalent to reading the \`simplifier://server-active-instance\` resource; prefer the resource in clients that support MCP Resources.`,
    {},
    {
      title: "Get active server instance",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("get active server instance", async () => {
        const trackingKey = trackingToolPrefix + toolNameActiveInstance;
        const instances = await simplifier.getInstanceSettings(trackingKey);
        const active = instances.find(i => i.active);
        if (!active) {
          throw new Error("The server currently does not define an active instance");
        }
        return active;
      });
    });
}
