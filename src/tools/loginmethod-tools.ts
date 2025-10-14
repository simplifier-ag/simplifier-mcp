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

**Supported Types:**
- **UserCredentials (BasicAuth)**: Username/password authentication
- **OAuth2**: OAuth2 client-based authentication

## UserCredentials (BasicAuth)

Creates or updates a basic authentication login method with username and password.

**Configuration:**
- **loginMethodType**: "UserCredentials"
- **Source**: "Provided" (source ID: 1) - credentials are stored directly
- **Target**: Default (target ID: 0) - standard authentication header

**Example - Creating BasicAuth:**
\`\`\`json
{
  "loginMethodType": "UserCredentials",
  "name": "MyBasicAuth",
  "description": "Basic auth for API",
  "username": "admin",
  "password": "secretPassword"
}
\`\`\`

**Example - Updating BasicAuth password:**
\`\`\`json
{
  "loginMethodType": "UserCredentials",
  "name": "MyBasicAuth",
  "description": "Updated description",
  "username": "admin",
  "password": "newPassword",
  "changePassword": true
}
\`\`\`

## OAuth2 Login Methods

Creates or updates OAuth2-based login methods with various source configurations.

### OAuth2 with Client Reference (Default Source)

Uses a configured OAuth2 client from Simplifier.
**Discover available clients:** Use \`simplifier://oauthclients\` resource

**Configuration:**
- **loginMethodType**: "OAuth2"
- **oauth2SourceType**: "ClientReference"
- **Target**: 0 = default header, 1 = custom header, 2 = query parameter

**Example - Default header:**
\`\`\`json
{
  "loginMethodType": "OAuth2",
  "oauth2SourceType": "ClientReference",
  "name": "MyOAuth",
  "description": "OAuth with infraOIDC",
  "oauth2ClientName": "infraOIDC",
  "targetType": "Default"
}
\`\`\`

**Example - Custom header:**
\`\`\`json
{
  "loginMethodType": "OAuth2",
  "oauth2SourceType": "ClientReference",
  "name": "MyOAuth",
  "description": "OAuth with custom header",
  "oauth2ClientName": "infraOIDC",
  "targetType": "CustomHeader",
  "customHeaderName": "X-Custom-Auth"
}
\`\`\`

**Example - Query parameter:**
\`\`\`json
{
  "loginMethodType": "OAuth2",
  "oauth2SourceType": "ClientReference",
  "name": "MyOAuth",
  "description": "OAuth as query param",
  "oauth2ClientName": "infraOIDC",
  "targetType": "QueryParameter",
  "queryParameterKey": "authToken"
}
\`\`\`

### OAuth2 with Profile Reference

References a key in the user's profile.

**Example:**
\`\`\`json
{
  "loginMethodType": "OAuth2",
  "oauth2SourceType": "ProfileReference",
  "name": "MyOAuth",
  "description": "OAuth from user profile",
  "profileKey": "oauthToken",
  "targetType": "Default"
}
\`\`\`

### OAuth2 with User Attribute Reference

References a user attribute by name and category.

**Example:**
\`\`\`json
{
  "loginMethodType": "OAuth2",
  "oauth2SourceType": "UserAttributeReference",
  "name": "MyOAuth",
  "description": "OAuth from user attribute",
  "userAttributeName": "myAttrName",
  "userAttributeCategory": "myAttrCat",
  "targetType": "Default"
}
\`\`\`
`;

  server.tool("loginmethod-update",
    loginMethodUpdateDescription,
    {
      loginMethodType: z.enum(["UserCredentials", "OAuth2"]).describe("Type of login method: UserCredentials for BasicAuth, OAuth2 for OAuth2-based auth"),
      name: z.string().describe("Name of the login method"),
      description: z.string().describe("Description of the login method"),

      // UserCredentials fields
      username: z.string().optional().describe("[UserCredentials] Username for basic authentication"),
      password: z.string().optional().describe("[UserCredentials] Password for basic authentication"),
      changePassword: z.boolean().optional().default(false).describe("[UserCredentials] Set to true when updating to change the password"),

      // OAuth2 source type
      oauth2SourceType: z.enum(["ClientReference", "ProfileReference", "UserAttributeReference"]).optional()
        .describe("[OAuth2] Source type: ClientReference (uses OAuth2 client), ProfileReference (user profile key), UserAttributeReference (user attribute)"),

      // OAuth2 ClientReference fields
      oauth2ClientName: z.string().optional().describe("[OAuth2 ClientReference] Name of the OAuth2 client (discover via simplifier://oauthclients)"),

      // OAuth2 ProfileReference fields
      profileKey: z.string().optional().describe("[OAuth2 ProfileReference] Key name in the user's profile"),

      // OAuth2 UserAttributeReference fields
      userAttributeName: z.string().optional().describe("[OAuth2 UserAttributeReference] Name of the user attribute"),
      userAttributeCategory: z.string().optional().describe("[OAuth2 UserAttributeReference] Category of the user attribute"),

      // Target configuration (for OAuth2)
      targetType: z.enum(["Default", "CustomHeader", "QueryParameter"]).optional().default("Default")
        .describe("[OAuth2] Target type: Default (standard auth header), CustomHeader (custom header name), QueryParameter (query param)"),
      customHeaderName: z.string().optional().describe("[OAuth2 CustomHeader] Name of the custom authentication header"),
      queryParameterKey: z.string().optional().describe("[OAuth2 QueryParameter] Key name for the query parameter")
    },
    {
      title: "Create or update a Login Method",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }, async (params) => {
      return wrapToolResult(`create or update Login Method ${params.name}`, async () => {
        // Check if login method exists
        let existing: any;
        try {
          existing = await simplifier.getLoginMethodDetails(params.name);
        } catch {
          // Login method doesn't exist, will create
        }

        let request: any;

        if (params.loginMethodType === "UserCredentials") {
          // Validate UserCredentials required fields
          if (!params.username || !params.password) {
            throw new Error("UserCredentials login method requires 'username' and 'password' fields");
          }

          request = {
            name: params.name,
            description: params.description,
            loginMethodType: "UserCredentials" as const,
            source: 1 as const, // Provided
            target: 0 as const, // Default
            sourceConfiguration: {
              username: params.username,
              password: params.password,
              ...(existing && { changePassword: params.changePassword })
            }
          };
        } else if (params.loginMethodType === "OAuth2") {
          // Validate OAuth2 required fields
          if (!params.oauth2SourceType) {
            throw new Error("OAuth2 login method requires 'oauth2SourceType' field");
          }

          // Determine source and sourceConfiguration
          let source: 0 | 4 | 5;
          let sourceConfiguration: any;

          switch (params.oauth2SourceType) {
            case "ClientReference":
              if (!params.oauth2ClientName) {
                throw new Error("OAuth2 ClientReference requires 'oauth2ClientName' field");
              }
              source = 0;
              sourceConfiguration = { clientName: params.oauth2ClientName };
              break;

            case "ProfileReference":
              if (!params.profileKey) {
                throw new Error("OAuth2 ProfileReference requires 'profileKey' field");
              }
              source = 4;
              sourceConfiguration = { key: params.profileKey };
              break;

            case "UserAttributeReference":
              if (!params.userAttributeName || !params.userAttributeCategory) {
                throw new Error("OAuth2 UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
              }
              source = 5;
              sourceConfiguration = {
                name: params.userAttributeName,
                category: params.userAttributeCategory
              };
              break;
          }

          // Determine target and targetConfiguration
          let target: 0 | 1 | 2;
          let targetConfiguration: any = undefined;

          switch (params.targetType) {
            case "Default":
              target = 0;
              break;

            case "CustomHeader":
              if (!params.customHeaderName) {
                throw new Error("OAuth2 CustomHeader target requires 'customHeaderName' field");
              }
              target = 1;
              targetConfiguration = { name: params.customHeaderName };
              break;

            case "QueryParameter":
              if (!params.queryParameterKey) {
                throw new Error("OAuth2 QueryParameter target requires 'queryParameterKey' field");
              }
              target = 2;
              targetConfiguration = { key: params.queryParameterKey };
              break;

            default:
              target = 0; // Default
          }

          request = {
            name: params.name,
            description: params.description,
            loginMethodType: "OAuth2" as const,
            source,
            target,
            sourceConfiguration,
            ...(targetConfiguration && { targetConfiguration })
          };
        } else {
          throw new Error(`Unsupported loginMethodType: ${params.loginMethodType}`);
        }

        if (existing) {
          return simplifier.updateLoginMethod(params.name, request);
        } else {
          return simplifier.createLoginMethod(request);
        }
      });
    });
}
