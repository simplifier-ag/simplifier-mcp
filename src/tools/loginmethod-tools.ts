import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { readFile } from "../resourceprovider.js";
import { z } from "zod";

/**
 * Register LoginMethod tools for Simplifier Low Code Platform integration
 */
export function registerLoginMethodTools(server: McpServer, simplifier: SimplifierClient): void {

  server.tool("loginmethod-update",
    readFile("tools/docs/create-or-update-loginmethod.md"),
    {
      loginMethodType: z.enum(["UserCredentials", "OAuth2"]).describe("Type of login method: UserCredentials for BasicAuth, OAuth2 for OAuth2-based auth"),
      name: z.string().describe("Name of the login method"),
      description: z.string().describe("Description of the login method"),

      // Source type (applies to both UserCredentials and OAuth2)
      sourceType: z.enum(["Provided", "ClientReference", "ProfileReference", "UserAttributeReference"]).optional()
        .describe("Source type: Provided (default for UserCredentials - username/password), ClientReference (default for OAuth2 - OAuth2 client), ProfileReference (user profile key), UserAttributeReference (user attribute)"),

      // UserCredentials Provided source fields
      username: z.string().optional().describe("[UserCredentials Provided] Username for basic authentication"),
      password: z.string().optional().describe("[UserCredentials Provided] Password for basic authentication"),
      changePassword: z.boolean().optional().default(false).describe("[UserCredentials Provided] Set to true when updating to change the password"),

      // ClientReference fields (OAuth2)
      oauth2ClientName: z.string().optional().describe("[OAuth2 ClientReference] Name of the OAuth2 client (discover via simplifier://oauthclients)"),

      // ProfileReference fields (UserCredentials and OAuth2)
      profileKey: z.string().optional().describe("[ProfileReference] Key name in the user's profile"),

      // UserAttributeReference fields (UserCredentials and OAuth2)
      userAttributeName: z.string().optional().describe("[UserAttributeReference] Name of the user attribute"),
      userAttributeCategory: z.string().optional().describe("[UserAttributeReference] Category of the user attribute"),

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
          // Set default sourceType for UserCredentials if not provided
          const sourceType = params.sourceType || "Provided";

          // Determine source and sourceConfiguration based on sourceType
          let source: 1 | 4 | 5;
          let sourceConfiguration: any;

          switch (sourceType) {
            case "Provided":
              // Validate required fields for Provided source
              if (!params.username || !params.password) {
                throw new Error("UserCredentials with Provided source requires 'username' and 'password' fields");
              }
              source = 1;
              sourceConfiguration = {
                username: params.username,
                password: params.password,
                ...(existing && { changePassword: params.changePassword })
              };
              break;

            case "ProfileReference":
              if (!params.profileKey) {
                throw new Error("UserCredentials ProfileReference requires 'profileKey' field");
              }
              source = 4;
              sourceConfiguration = { key: params.profileKey };
              break;

            case "UserAttributeReference":
              if (!params.userAttributeName || !params.userAttributeCategory) {
                throw new Error("UserCredentials UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
              }
              source = 5;
              sourceConfiguration = {
                name: params.userAttributeName,
                category: params.userAttributeCategory
              };
              break;

            default:
              throw new Error(`Unsupported sourceType for UserCredentials: ${sourceType}`);
          }

          request = {
            name: params.name,
            description: params.description,
            loginMethodType: "UserCredentials" as const,
            source,
            target: 0 as const, // Default
            sourceConfiguration
          };
        } else if (params.loginMethodType === "OAuth2") {
          // Set default sourceType for OAuth2 if not provided
          const sourceType = params.sourceType || "ClientReference";

          // Determine source and sourceConfiguration based on sourceType
          let source: 0 | 4 | 5;
          let sourceConfiguration: any;

          switch (sourceType) {
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

            default:
              throw new Error(`Unsupported sourceType for OAuth2: ${sourceType}`);
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
