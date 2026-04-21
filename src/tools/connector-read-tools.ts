import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";

/**
 * Read-only tool mirrors for connector resources.
 *
 * These tools exist so that MCP clients which do not implement the
 * `resources/*` capability can still discover and inspect connectors
 * and their calls. Clients that support resources should prefer the
 * corresponding `simplifier://connector/...` resources.
 */
export function registerConnectorReadTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameList = "connector-list";
  server.tool(toolNameList,
    `# List all Connectors

Returns names, descriptions, types, active status and call counts for every Connector on the Simplifier instance.
Equivalent to reading the \`simplifier://connectors\` resource; prefer the resource in clients that support MCP Resources.`,
    {},
    {
      title: "List Connectors",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("list Connectors", async () => {
        const trackingKey = trackingToolPrefix + toolNameList;
        const response = await simplifier.listConnectors(trackingKey);
        return {
          connectors: response.connectors.map(c => ({
            name: c.name,
            description: c.description,
            type: c.connectorType.technicalName,
            active: c.active,
            amountOfCalls: c.amountOfCalls
          })),
          totalCount: response.connectors.length
        };
      });
    });

  const toolNameGet = "connector-get";
  server.tool(toolNameGet,
    `# Get details of a single Connector

Returns full connector configuration including endpoints, login method and metadata.
Equivalent to reading the \`simplifier://connector/{name}\` resource; prefer the resource in clients that support MCP Resources.`,
    {
      name: z.string().describe("Connector name")
    },
    {
      title: "Get Connector details",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ name }) => {
      return wrapToolResult(`get Connector ${name}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameGet;
        return simplifier.getConnector(name, trackingKey, true);
      });
    });

  const toolNameCallList = "connector-call-list";
  server.tool(toolNameCallList,
    `# List all calls of a Connector

Returns the names, descriptions, parameter counts and executable flag for every call of the given Connector.
Equivalent to reading the \`simplifier://connector/{name}/calls\` resource; prefer the resource in clients that support MCP Resources.`,
    {
      connectorName: z.string().describe("Connector name")
    },
    {
      title: "List Connector calls",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ connectorName }) => {
      return wrapToolResult(`list calls of Connector ${connectorName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameCallList;
        const response = await simplifier.listConnectorCalls(connectorName, trackingKey);
        return {
          connectorName,
          calls: response.connectorCalls.map(c => ({
            name: c.name,
            description: c.description,
            inputParameters: c.amountOfInputParameters,
            outputParameters: c.amountOfOutputParameters,
            executable: c.executable
          })),
          totalCount: response.connectorCalls.length
        };
      });
    });

  const toolNameCallGet = "connector-call-get";
  server.tool(toolNameCallGet,
    `# Get details of a single Connector call

Returns full parameter information (names, data types, aliases, optionality, constant values).
Equivalent to reading the \`simplifier://connector/{connectorName}/call/{callName}\` resource;
prefer the resource in clients that support MCP Resources.`,
    {
      connectorName: z.string().describe("Connector name"),
      callName: z.string().describe("Connector call name")
    },
    {
      title: "Get Connector call details",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ connectorName, callName }) => {
      return wrapToolResult(`get Connector call ${connectorName}.${callName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameCallGet;
        return simplifier.getConnectorCall(connectorName, callName, trackingKey);
      });
    });
}
