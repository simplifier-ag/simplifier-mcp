import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {registerServerBusinessObjectTools} from "./server-businessobject-tools.js";
import {registerServerDatatypeTools} from "./server-datatype-tools.js";
import {registerConnectorTools} from "./connector-tools.js";
import {registerLoginMethodTools} from "./loginmethod-tools.js";

/**
 * Register Tools for Simplifier Low Code Platform integration
 */
export function registerTools(server: McpServer, simplifier: SimplifierClient) {
  registerServerBusinessObjectTools(server, simplifier)
  registerServerDatatypeTools(server, simplifier)
  registerConnectorTools(server, simplifier)
  registerLoginMethodTools(server, simplifier)
}


