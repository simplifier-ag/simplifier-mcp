import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {registerServerBusinessObjectTools} from "./server-businessobject-tools.js";
import {registerServerDatatypeTools} from "./server-datatype-tools.js";
import {registerConnectorTools} from "./connector-tools.js";
import {registerLoginMethodTools} from "./loginmethod-tools.js";
import {registerLoggingTools} from "./logging-tools.js";
import { registerSapSystemTools } from "./sap-system-tools.js";
import { registerServerBusinessObjectReadTools } from "./server-businessobject-read-tools.js";
import { registerConnectorReadTools } from "./connector-read-tools.js";
import { registerServerDatatypeReadTools } from "./server-datatype-read-tools.js";
import { registerLoginMethodReadTools } from "./loginmethod-read-tools.js";
import { registerServerEnvironmentReadTools } from "./server-environment-read-tools.js";
import { registerDocumentationTools } from "./documentation-tools.js";
import { registerConnectorWizardTools } from "./connector-wizard-tools.js";

/**
 * Register Tools for Simplifier Low Code Platform integration
 */
export function registerTools(server: McpServer, simplifier: SimplifierClient) {
  // Existing write/execute tools
  registerServerBusinessObjectTools(server, simplifier)
  registerServerDatatypeTools(server, simplifier)
  registerConnectorTools(server, simplifier)
  registerLoginMethodTools(server, simplifier)
  registerLoggingTools(server, simplifier)
  registerSapSystemTools(server, simplifier)

  // Read-only tool mirrors of resources. These exist so that MCP clients that do
  // not support the `resources/*` capability (e.g. OpenCode, Cursor, Cline,
  // Continue, Windsurf) can still list and inspect Simplifier entities. Clients
  // that DO support resources (Claude Code, Claude Desktop) should continue to
  // prefer `simplifier://...` resources — the tools below are equivalent
  // implementations that share the same underlying SimplifierClient calls.
  registerServerBusinessObjectReadTools(server, simplifier)
  registerConnectorReadTools(server, simplifier)
  registerServerDatatypeReadTools(server, simplifier)
  registerLoginMethodReadTools(server, simplifier)
  registerServerEnvironmentReadTools(server, simplifier)
  registerDocumentationTools(server)
  registerConnectorWizardTools(server, simplifier)
}

