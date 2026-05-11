import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";

/**
 * Read-only tool mirrors for server-side Business Object resources.
 *
 * These tools exist so that MCP clients which do not implement the
 * `resources/*` capability (e.g. OpenCode, Cursor, Cline, Continue,
 * Windsurf) can still discover and inspect Business Objects. Clients
 * that DO support resources (Claude Code, Claude Desktop) should
 * prefer the corresponding `simplifier://businessobject/...` resources.
 */
export function registerServerBusinessObjectReadTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameList = "businessobject-list";
  server.tool(toolNameList,
    `# List all server-side Business Objects

Returns the names of every Business Object on the connected Simplifier instance.
Equivalent to reading the \`simplifier://businessobjects\` resource; prefer the resource in clients that support MCP Resources.`,
    {},
    {
      title: "List Business Objects",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("list Business Objects", async () => {
        const trackingKey = trackingToolPrefix + toolNameList;
        return (await simplifier.getServerBusinessObjects(trackingKey)).map(bo => ({
          name: bo.name
        }));
      });
    });

  const toolNameGet = "businessobject-get";
  server.tool(toolNameGet,
    `# Get details of a single Business Object

Returns metadata, dependencies, tags, project assignments and the list of function names of a Business Object.
Equivalent to reading the \`simplifier://businessobject/{name}\` resource; prefer the resource in clients that support MCP Resources.`,
    {
      name: z.string().describe("Business Object name")
    },
    {
      title: "Get Business Object details",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ name }) => {
      return wrapToolResult(`get Business Object ${name}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameGet;
        return simplifier.getServerBusinessObjectDetails(name, trackingKey);
      });
    });

  const toolNameFunctionGet = "businessobject-function-get";
  server.tool(toolNameFunctionGet,
    `# Get details of a single Business Object function

Returns parameter metadata (names, data types, aliases) and the JavaScript source code of the function.
Equivalent to reading the \`simplifier://businessobject/{objectName}/function/{functionName}\` resource;
prefer the resource in clients that support MCP Resources.`,
    {
      businessObjectName: z.string().describe("Name of the Business Object that owns the function"),
      functionName: z.string().describe("Name of the function to fetch")
    },
    {
      title: "Get Business Object function",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ businessObjectName, functionName }) => {
      return wrapToolResult(`get BO function ${businessObjectName}.${functionName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameFunctionGet;
        return simplifier.getServerBusinessObjectFunction(businessObjectName, functionName, trackingKey);
      });
    });
}
