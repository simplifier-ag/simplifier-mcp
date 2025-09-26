import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {registerServerBusinessObjectTools} from "./server-businessobject-tools.js";

/**
 * Register Tools for Simplifier Low Code Platform integration
 */
export function registerTools(server: McpServer, simplifier: SimplifierClient) {
  registerServerBusinessObjectTools(server, simplifier)
}


