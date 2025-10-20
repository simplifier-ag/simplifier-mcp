import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Generates the prompt content for creating a connector from an OpenAPI specification.
 *
 * This function creates a comprehensive, multi-phase prompt that guides the LLM through:
 * 1. Fetching and parsing the OpenAPI specification
 * 2. Analyzing available endpoints
 * 3. Presenting endpoints for user selection
 * 4. Creating the connector, connector calls, and datatypes
 *
 * @param openapiInput - The OpenAPI spec URL or content
 * @param connectorName - Optional custom connector name
 * @returns The prompt text
 */
export function generateOpenAPIConnectorPromptText(
  openapiInput: string,
  connectorName?: string
): string {
  const finalConnectorName = connectorName || '<will be derived from OpenAPI spec>';

  const isUrl = openapiInput.startsWith('http://') || openapiInput.startsWith('https://');

  return `# Create Simplifier Connector from OpenAPI Specification

## Objective
Create a complete Simplifier connector with connector calls and datatypes based on an OpenAPI specification.

## Phase 1: Fetch and Parse OpenAPI Specification

${isUrl
    ? `1. Fetch the OpenAPI specification from: ${openapiInput}
   - Use appropriate tools (curl, wget, or web fetch) to download the spec
   - Parse the YAML/JSON content`
    : `1. Parse the provided OpenAPI specification:
   - The specification content has been provided directly
   - Parse the YAML/JSON structure`
}

2. Extract key information:
   - API title and description
   - Base URL / servers
   - Authentication requirements (API keys, OAuth, etc.)
   - Version information
   
## Phase 2: Authentication 
In case the API needs to be authenticated with OAuth and you can find a configured oauthclient with simplifier://oauthclients,
that fits by the name, then create a login method with the name ${finalConnectorName}OAuthLM and that OAuth client.

In case the API needs an API-key, that has to be passed as a header, then create a Login Method of type token with a custom
header name according to the API key header name. Ask the user for the API-key - otherwise the user can update the key in the login
method himself.

In case the API needs an API-key, that has to be passed as a query parameter, then each connector call needs the additional input parameter configured.

In case we have not yet handeled authentication and the API supports Basic Auth, then create a login method with the name ${finalConnectorName}BasicLM of
the type UserCredentials and ask the user for username and password.

Assign the eventually created LM to the connector in the end.

## Phase 3: Analyze and Present Endpoints

Analyze all available endpoints in the specification and present them to the user in this format:

\`\`\`
Available Endpoints:
==================

1. [GET] /users - List all users
   Parameters: page (query, optional), limit (query, optional)
   Response: Array of User objects

2. [POST] /users - Create a new user
   Body: User object (name, email, role)
   Response: Created User object with ID

3. [GET] /users/{id} - Get user by ID
   Parameters: id (path, required)
   Response: Single User object

... (continue for all endpoints)

Authentication: Bearer Token (API Key in header)
Base URL: https://api.example.com/v1
\`\`\`

## Phase 4: User Selection

After presenting the endpoints, ask the user:
"Which endpoints would you like to implement? You can specify:
- A comma separated list of endoints 
- All endpoints (type 'all')
- Endpoint patterns (e.g., all GET endpoints, all /users endpoints)"

Wait for user response before proceeding to Phase 4.

## Phase 5: Create Connector and Components

Once the user has selected endpoints, create:

### 5.1 Connector Configuration
- **Name**: ${finalConnectorName}
- **Namespace**: con/${finalConnectorName}
- **Base URL**: From OpenAPI spec
- **Authentication**: Configure based on OpenAPI security schemes
- **Headers**: Any required default headers

### 5.2 For Each Selected Endpoint:

#### Create Request/Response Datatypes:
- Analyze request body schema → Create request datatype
- Analyze response schema → Create response datatype
- Handle nested objects → Create additional datatypes as needed
- Use Simplifier base types (String, Integer, Boolean, Date, Float, Any) for primitives
- Create struct types for complex objects
- Create collection types for arrays

#### Create Connector Call:
- **Name**: Descriptive name (e.g., "getUserById", "createUser")
- **HTTP Method**: From OpenAPI spec
- **Path**: From OpenAPI spec (with path parameters)
- **Parameters**: Query, path, header parameters from OpenAPI
- **Request Body**: Link to request datatype
- **Response**: Link to response datatype
- **Documentation**: From OpenAPI description

### 5.3 Create All Components:
Use the Simplifier MCP tools to create:
1. All datatypes (in dependency order - base types first)
2. The connector
3. All connector calls

### 5.4 Provide Summary:
Generate a summary report:
\`\`\`
✅ Connector Created: ${finalConnectorName}
📦 Datatypes Created: <count> datatypes in namespace con/${finalConnectorName}
🔌 Connector Calls Created: <count> calls
📚 Documentation: <brief description>

Next Steps:
- Test the connector calls in Simplifier
- Configure authentication credentials
- Add error handling as needed
\`\`\`

## Important Guidelines:

1. **Datatype Creation Order**: Create datatypes in the correct order (dependencies first)
2. **Naming Conventions**: Use clear, consistent naming (e.g., UserRequest, UserResponse)
3. **Error Handling**: Note which endpoints may need special error handling
4. **Authentication**: Clearly document authentication requirements
5. **Validation**: Ensure all required fields are marked as required in datatypes
6. **Documentation**: Include OpenAPI descriptions in all components

## Available Tools:

You have access to these Simplifier MCP tools:
- \`datatype-update\`: Create/update datatypes
- \`connector-update\`: Create/update connectors
- \`connector-call-update\`: Create/update connector calls

Use the resources to check existing connectors and datatypes in the namespace.

---

**Start with Phase 1**: ${isUrl ? 'Fetch' : 'Parse'} the OpenAPI specification and extract key information.`;
}

/**
 * The prompt callback for the MCP server.
 */
export function openAPIConnectorPromptCallback(args: {
  openapi_url_or_spec: string;
  connector_name?: string | undefined;
}): GetPromptResult {
  const promptText = generateOpenAPIConnectorPromptText(
    args.openapi_url_or_spec,
    args.connector_name
  );

  return {
    description: 'Multi-phase workflow for creating a Simplifier connector from OpenAPI specification',
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
 * Registers the OpenAPI connector creation prompt with the MCP server.
 *
 * @param server - The MCP server instance
 * @param _simplifier - The Simplifier API client (unused for now, kept for consistency)
 */
export function registerOpenAPIConnectorPrompt(
  server: McpServer,
  _simplifier: SimplifierClient
): void {
  server.prompt(
    'create-connector-from-openapi',
    'Guided workflow to create a Simplifier connector from an OpenAPI specification. Analyzes endpoints, lets you select which to implement, and creates the connector with calls and datatypes.',
    {
      openapi_url_or_spec: z.string().describe(
        'The OpenAPI specification URL (e.g., https://api.example.com/openapi.yaml) or the full YAML/JSON content of the OpenAPI spec'
      ),
      connector_name: z.string().optional().describe(
        'Custom name for the connector (optional, defaults to the API title from the OpenAPI spec)'
      )
    },
    openAPIConnectorPromptCallback
  );
}
