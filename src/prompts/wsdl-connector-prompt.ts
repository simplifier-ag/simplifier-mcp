import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Generates the prompt content for creating a connector from a WSDL specification.
 *
 * This function creates a comprehensive, multi-phase prompt that guides the LLM through:
 * 1. Fetching and parsing the WSDL specification
 * 2. Analyzing available endpoints
 * 3. Presenting endpoints for user selection
 * 4. Creating the connector, connector calls, and datatypes
 *
 * @param wsdlInput - The WSDL spec URL or content
 * @param connectorName - Optional custom connector name
 * @returns The prompt text
 */
export function generateWSDLConnectorPromptText(
  wsdlInput: string,
  connectorName?: string
): string {
  const finalConnectorName = connectorName || '<will be derived from WSDL url and spec>';

  const isUrl = wsdlInput.startsWith('http://') || wsdlInput.startsWith('https://');
  if(!isUrl) {
    return "Notify the user, that SOAP connectors require the WSDL to be accessible via HTTP, so the WSDL should be given as an URL";
  }

  return `# Create Simplifier Connector from WSDL Specification

## Objective
Create a complete Simplifier connector with connector calls and datatypes based on a WSDL specification.

## Phase 1: Fetch and Parse WSDL Specification

1. Fetch the WSDL specification from: ${wsdlInput}
   - Use appropriate tools (curl, wget, or web fetch) to download the spec
   - Parse the XML content

2. Extract key information:
   - Service title and description
   - Authentication requirements
   - Version information
   
## Phase 2: Authentication 
Fetch the existing Login Methods with simplifier://loginmethods. List the Login Methods and show them to the user before Phase 3.1.

The authentication requirements can be complex. We will guide the user through this flow of steps:
1. Present existing Login Methods and let the user select one, or skip this step
2. If no existing login method has been selected, ask for the type to create:
  a. In case of OAuth, then present the existing OAuth Clients and let the user select one, or skip this step
  b. In case of Basic Auth, then ask the user about username/password or skip this step
  c. In case of need of an API Key in a Header ask the user for the API Key or skip this step
  d. In case of SAP Logon Ticket, no further information is needed.

Details about step 2c:
In case the service needs an API-key, that has to be passed as a query parameter, then each connector call needs the additional input parameter configured.
Only in case the service needs an API-key, that has to be passed as a header, then create a Login Method of type token with a custom
header name according to the API key header name. 

Assign the eventually created or selected Login Method to the connector in the end.

## Phase 3: User Selections for Authentication

### 3.1 Ask user for Login Method
In case existing Login Methods are found with simplifier://loginmethods, then ask the user, whether and which Login Method to assign in the end:
"Shall one of the existing Login Methods be used or a new one be created?"

### 3.2 Ask user about creating an OAuth Login Method
In case OAuth is required and no fitting Login Method is existing, but auth clients are existing (simplifier://oauthclients), then
present the list of oauth clients to the user and ask whether and based on which client a Login Method should be created:
"Shall a Login Method ${finalConnectorName}OAuthLM be created based on one of these OAuth Clients?"

### 3.3 Ask user about creating Login Method for Basic Auth
In case we have not yet handeled authentication and the service supports Basic Auth, then create a login method with the name ${finalConnectorName}BasicLM of
the type UserCredentials and ask the user for username and password. Also give the option, that the user can later create and assign a
login method himself:
"Enter Username and Password to create the Login Method ${finalConnectorName}BasicLM or alternatively later create and assign a Login Method yourself."
 
### 3.4 Ask user about creating Login Method for API Key 
In case the service needs an API-key, that has to be passed as a header, then create a Login Method of type token with a custom
header name according to the API key header name. Ask the user for the API-key - otherwise the user can update the key in the login
method himself:
"Give the API key for the Login Method"

### 3.5 Ask user about creating Login Method for SAP Logon Token
In case the service requires login via SAP Login Token, no further information is required to create the login method.
Notify the user, that SAP Logon with external identification is not yet supported and that the Simplifier user will have
to be logged in with the correct SAP authentication method. Then create the login method.

## Phase 4: Analyze and Present Bindings and Operations

Analyze all available operations in the specification and present them to the user grouped by binding.

## Phase 5: User Selection for operations

After presenting the operations, ask the user:
"Which operations would you like to implement? You can specify:
- A comma separated list of operations 
- All operations (type 'all')
- Operation patterns (e.g., all operations in binding X, all operations starting with Read)"

Wait for user response before proceeding to Phase 6.

## Phase 6: Create Connector and Components

Once the user has selected operations, create:

### 6.1 Connector Configuration
- **Name**: ${finalConnectorName}
- **Namespace**: con/${finalConnectorName}
- **WSDL Url**: a
- **Authentication**: Configure based on login method from phase 3

### 6.2 For Each Selected operation:

#### Create Request/Response Datatypes:
- Analyze request message schema → Create request datatype
- Analyze response message schema → Create response datatype
- Handle nested objects → Create additional datatypes as needed
- Use Simplifier base types (String, Integer, Boolean, Date, Float, Any) for primitives
- Create struct types for complex objects
- Create collection types for arrays

#### Create Connector Call:
- **Name**: Descriptive name, keep it close to the WSDL operation name
- **Binding**: From WSDL
- **Operation**: From WSDL
- **Input and Output Parameters**: derive from the operation's input definition. Keep names close to what is in the WSDL.

### 6.3 Create All Components:
Use the Simplifier MCP tools to create:
1. All datatypes (in dependency order - base types first)
2. The connector
3. All connector calls

### 6.4 Provide Summary:
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

## Available Tools:

You have access to these Simplifier MCP tools:
- \`datatype-update\`: Create/update datatypes
- \`connector-update\`: Create/update connectors
- \`connector-call-update\`: Create/update connector calls

Use the resources to check existing connectors and datatypes in the namespace.

---

**Start with Phase 1**: 'Fetch' the WSDL specification and extract key information.`;
}

/**
 * The prompt callback for the MCP server.
 */
export function wsdlConnectorPromptCallback(args: {
  wsdl_url: string;
  connector_name?: string | undefined;
}): GetPromptResult {
  const promptText = generateWSDLConnectorPromptText(
    args.wsdl_url,
    args.connector_name
  );

  return {
    description: 'Multi-phase workflow for creating a Simplifier connector from WSDL specification',
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
export function registerWSDLConnectorPrompt(
  server: McpServer,
  _simplifier: SimplifierClient
): void {
  server.prompt(
    'create-connector-from-wsdl',
    'Guided workflow to create a Simplifier connector from a WSDL specification. Analyzes endpoints, lets you select which to implement, and creates the connector with calls and datatypes.',
    {
      wsdl_url: z.string().describe(
        'The WSDL specification URL (e.g., https://soap.example.com/service?wsdl)'
      ),
      connector_name: z.string().optional().describe(
        'Custom name for the connector (optional, defaults to the service name from the wsdl url)'
      )
    },
    wsdlConnectorPromptCallback
  );
}
