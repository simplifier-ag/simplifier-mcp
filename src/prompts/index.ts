import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { registerOpenAPIConnectorPrompt } from "./openapi-connector-prompt.js";

/**
 * Prompts for Simplifier Low Code Platform integration
 */

/**
 * Prompt for creating a Simplifier connector from an API specification or description.
 *
 * This multi-phase prompt guides the user through:
 * 1. Providing an API specification (OpenAPI/Swagger) or informal REST API description (URL or content)
 * 2. Analyzing available endpoints
 * 3. Selecting endpoints to implement
 * 4. Creating connector, connector calls, and datatypes
 *
 * The prompt uses arguments to receive the API specification or description and optional configuration.
 */
export const createConnectorFromOpenAPIPrompt: Prompt = {
  name: 'create-connector-from-openapi',
  description: 'Guided workflow to create a Simplifier connector from an API specification (OpenAPI/Swagger) or informal REST API description. Analyzes endpoints, lets you select which to implement, and creates the connector with calls and datatypes.',
  arguments: [
    {
      name: 'openapi_url_or_spec',
      description: 'API specification URL, OpenAPI/Swagger spec content (YAML/JSON), or an informal textual description of a REST API',
      required: true
    },
    {
      name: 'connector_name',
      description: 'Custom name for the connector (optional, defaults to the API title from the specification or a suitable name from the description)',
      required: false
    }
  ]
};

export const prompts: Prompt[] = [
  createConnectorFromOpenAPIPrompt
];

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
}
