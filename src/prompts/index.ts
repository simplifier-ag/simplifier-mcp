import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { registerOpenAPIConnectorPrompt } from "./openapi-connector-prompt.js";
import { registerWSDLConnectorPrompt } from './wsdl-connector-prompt.js';

/**
 * Prompts for Simplifier Low Code Platform integration
 */

/**
 * Prompt for creating a Simplifier connector from an OpenAPI specification.
 *
 * This multi-phase prompt guides the user through:
 * 1. Providing an OpenAPI specification (URL or content)
 * 2. Analyzing available endpoints
 * 3. Selecting endpoints to implement
 * 4. Creating connector, connector calls, and datatypes
 *
 * The prompt uses arguments to receive the OpenAPI spec and optional configuration.
 */
export const createConnectorFromOpenAPIPrompt: Prompt = {
  name: 'create-connector-from-openapi',
  description: 'Guided workflow to create a Simplifier connector from an OpenAPI specification. Analyzes endpoints, lets you select which to implement, and creates the connector with calls and datatypes.',
  arguments: [
    {
      name: 'openapi_url_or_spec',
      description: 'The OpenAPI specification URL (e.g., https://api.example.com/openapi.yaml) or the full YAML/JSON content of the OpenAPI spec',
      required: true
    },
    {
      name: 'connector_name',
      description: 'Custom name for the connector (optional, defaults to the API title from the OpenAPI spec)',
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
  registerWSDLConnectorPrompt(server, simplifier);
}
