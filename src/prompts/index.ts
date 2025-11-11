import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { registerOpenAPIConnectorPrompt } from "./openapi-connector-prompt.js";
import { registerRFCConnectorPrompt } from './rfc-connector-prompt.js';
import { registerWSDLConnectorPrompt } from './wsdl-connector-prompt.js';

/**
 * Registers all prompts with the MCP server.
 *
 * @param server - The MCP server instance
 * @param simplifier - The Simplifier API client
 */
export function registerPrompts(server: McpServer, simplifier: SimplifierClient): void {
  // Register individual prompts
  // The MCP SDK handles prompts/list automatically
  registerOpenAPIConnectorPrompt(server, simplifier);
  registerWSDLConnectorPrompt(server, simplifier);
  registerRFCConnectorPrompt(server, simplifier);
}
