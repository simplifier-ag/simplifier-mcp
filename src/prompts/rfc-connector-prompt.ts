import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Generates the prompt content for guiding the User when creating an RFC connector
 *
 * This function creates a comprehensive, multi-phase prompt that guides the LLM through:
 * 1. Analyzing available SAP systems
 * 2. Presenting systems for user selection or guiding through SAP system creation
 * 3. Retrieving a list of available functions with a user-provided filter
 * 4. Creating connector and calls based on the selected functions
 *
 * @param connectorName - Desired connector name
 * @param functionNameFilter - Search term for functions on the SAP system
 * @returns The prompt text
 */
export function generateRFCConnectorPromptText(
  connectorName: string,
  functionNameFilter?: string,
): string {
  return `# Create Simplifier RFC Connector

## Objective
Create a complete Simplifier RFC connector with connector calls by letting the user select from the available functions.

## Phase 1: Select the SAP system for the connector

1. Fetch the available SAP systems from the resource simplifier://sap-systems
2. Present the user with a list of the available SAP systems. Let the user select one of the existing SAP systems, also
offer to create a new one instead

## Phase 1a: create new SAP system, if desired

If the user opts for creating a new SAP system, request all the necessary information from them. Then create the SAP
system using the "sap-system-update" tool.

## Phase 2: Authentication 
RFC connectors can be used with the login method types "Username / Password", "SAP SSO" and "Certificate".
Fetch the existing Login Methods with simplifier://loginmethods. List the applicable Login Methods and show them to the user.

The authentication requirements can be complex. We will guide the user through this flow of steps:
1. Present existing Login Methods and let the user select one, or skip this step
2. If no existing login method has been selected, ask for the type to create:
  a. In case of Basic Auth, then ask the user about username/password or skip this step
  b. In case of SAP Logon Ticket, no further information is needed.
  c. In case of Certificate login, ask the user to create the login method manually, as this is not yet supported in the MCP.

## Phase 3: Create the connector

Create a new RFC connector with the name ${connectorName}. Configure the endpoint with the previously selected SAP system
and login method.

## Phase 4: Select functions

After creating the connector, the resource "simplifier://connector-wizard/${connectorName}/search/{term}/{page}" can be
used to find available functions on the SAP system. ${functionNameFilter
? `Use the search term ${functionNameFilter}, which was provided by the user.`
: 'Ask the user for a search term to filter the available functions by name.'
}
If there are too many entries, consider asking the user for a more specific term.

Present the functions to the user and ask for a selection:
"Which functions would you like to implement? You can specify:
- A comma separated list of functions 
- All functions (type 'all')
- Function patterns (e.g., all functions containing READ)"

Wait for user response before proceeding to Phase 5.

## Phase 5: Create connector calls

Once the user has selected functions, create the connector calls, using the RFC specific tool "connector-wizard-rfc-create".

### Phase 6: Provide Summary

Generate a summary report:
\`\`\`
✅ Connector Created: ${connectorName}
🔌 Connector Calls Created: <count> calls
📚 Documentation: <brief description>

Next Steps:
- Test the connector calls in Simplifier
- Add error handling as needed
\`\`\`

## Available Tools:

You have access to these Simplifier MCP tools:
- \`connector-update\`: Create/update connectors
- \`connector-wizard-rfc-create\`: Create RFC connector calls by providing the function names

Use the resources to check existing connectors and SAP systems.

---


**Start with Phase 1**: Select the SAP system for the connector.`;
}

/**
 * The prompt callback for the MCP server.
 */
export function rfcConnectorPromptCallback(args: {
  connector_name: string;
  functionNameFilter?: string | undefined;
}): GetPromptResult {
  const promptText = generateRFCConnectorPromptText(
    args.connector_name,
    args.functionNameFilter,
  );

  return {
    description: 'Multi-phase workflow for creating a Simplifier RFC connector',
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: promptText
        }
      }
    ]
  };
}

/**
 * Registers the WSDL connector creation prompt with the MCP server.
 *
 * @param server - The MCP server instance
 * @param _simplifier - The Simplifier API client (unused for now, kept for consistency)
 */
export function registerRFCConnectorPrompt(
  server: McpServer,
  _simplifier: SimplifierClient
): void {
  server.prompt(
    'create-rfc-connector',
    'Guided workflow to create a Simplifier RFC connector. Searches available SAP system functions, lets you select which to implement, and creates the connector with calls and datatypes.',
    {
      connector_name: z.string().describe('Name for the connector'),
      functionNameFilter: z.string().optional().describe('Search term for finding functions in the SAP system. If not provided, the agent will ask you when it is needed')
    },
    rfcConnectorPromptCallback,
  );
}
