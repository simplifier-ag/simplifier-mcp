import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";

/**
 * Register LoginMethod tools for Simplifier Low Code Platform integration
 */
export function registerLoginMethodTools(server: McpServer, simplifier: SimplifierClient): void {

  const loginMethodUpdateDescription = `# Create or update a Login Method

Create or update login methods for authenticating connectors with external systems.

**Currently Supported Types:**
- **UserCredentials (BasicAuth)**: Username/password authentication

**Future Support:**
- OAuth2 authentication (coming soon)

## UserCredentials (BasicAuth)

Creates or updates a basic authentication login method with username and password.

**Default Configuration:**
- **Source**: "Provided" (source ID: 1) - credentials are stored directly in the login method
- **Target**: Default (target ID: 0) - uses standard authentication placement (e.g. Header for REST Connector)

**Creating a new LoginMethod:**
\`\`\`json
{
  "name": "MyBasicAuth",
  "description": "Basic auth for external API",
  "username": "admin",
  "password": "mySecurePassword"
}
\`\`\`

**Updating an existing LoginMethod:**
To update description only:
\`\`\`json
{
  "name": "MyBasicAuth",
  "description": "Updated description",
  "username": "admin",
  "password": "<not relevant>",
  "changePassword": false
}
\`\`\`

To update password:
\`\`\`json
{
  "name": "MyBasicAuth",
  "description": "My description",
  "username": "admin",
  "password": "newSecurePassword",
  "changePassword": true
}
\`\`\`

**Notes:**
- When updating, if \`changePassword\` is false or omitted, the password field value is ignored
- Username can be changed in updates
- Both username and password are required fields, even when not changing the password
`;

  server.tool("loginmethod-update",
    loginMethodUpdateDescription,
    {
      name: z.string().describe("Name of the login method"),
      description: z.string().describe("Description of the login method"),
      username: z.string().describe("Username for basic authentication"),
      password: z.string().describe("Password for basic authentication. When updating with changePassword=false, this value is ignored."),
      changePassword: z.boolean().optional().default(false).describe("Set to true when updating to change the password. Defaults to false.")
    },
    {
      title: "Create or update a Login Method",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }, async ({ name, description, username, password, changePassword }) => {
      return wrapToolResult(`create or update Login Method ${name}`, async () => {
        // Check if login method exists
        let existing: any;
        try {
          existing = await simplifier.getLoginMethodDetails(name);
        } catch {
          // Login method doesn't exist, will create
        }

        // Build the request payload for UserCredentials
        const request = {
          name,
          description,
          loginMethodType: "UserCredentials" as const,
          source: 1 as const, // Provided
          target: 0 as const, // Default
          sourceConfiguration: {
            username,
            password,
            ...(existing && { changePassword })
          }
        };

        if (existing) {
          return simplifier.updateLoginMethod(name, request);
        } else {
          return simplifier.createLoginMethod(request);
        }
      });
    });
}
