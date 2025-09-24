import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SimplifierClient} from "../client/simplifier-client.js";
import {registerServerBusinessObjectResources} from "./server-businessobject-resources.js";

/**
 * Resources for Simplifier Low Code Platform integration
 */
export function registerResources(server: McpServer, simplifier: SimplifierClient) {
  registerServerBusinessObjectResources(server, simplifier);
}
