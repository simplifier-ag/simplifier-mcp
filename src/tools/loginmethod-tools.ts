import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { readFile } from "../resourceprovider.js";
import { z } from "zod";
import { TargetAndSourceMapper } from "./loginmethod/TargetAndSourceMapper.js";
import { UserCredentialsTargetAndSourceMapper } from "./loginmethod/UserCredentialsTargetAndSourceMapper.js";
import { OAuthTargetAndSourceMapper } from "./loginmethod/OAuthTargetAndSourceMapper.js";
import { TokenTargetAndSourceMapper } from "./loginmethod/TokenTargetAndSourceMapper.js";

/**
 * Register LoginMethod tools for Simplifier Low Code Platform integration
 */
export function registerLoginMethodTools(server: McpServer, simplifier: SimplifierClient): void {

  server.tool("loginmethod-update",
    readFile("tools/docs/create-or-update-loginmethod.md"),
    {
      loginMethodType: z.enum(["UserCredentials", "OAuth2", "Token"]).describe("Type of login method: UserCredentials for BasicAuth, OAuth2 for OAuth2-based auth, Token for token-based auth"),
      name: z.string().describe("Name of the login method"),
      description: z.string().describe("Description of the login method"),

      // Source type (applies to UserCredentials, OAuth2, and Token)
      sourceType: z.enum(["Default", "Provided", "Reference", "SystemReference", "ProfileReference", "UserAttributeReference"]).optional()
        .describe("Source type: Default (system default - credentials for UserCredentials, OAuth2 client for OAuth2, empty for Token), SystemReference (Token - uses SimplifierToken), Provided (UserCredentials - username/password, Token - token value), Reference (OAuth2 - OAuth2 client reference), ProfileReference (user profile key), UserAttributeReference (user attribute)"),

      // UserCredentials Default/Provided source fields
      username: z.string().optional().describe("[UserCredentials Default/Provided] Username for basic authentication"),
      password: z.string().optional().describe("[UserCredentials Default/Provided] Password for basic authentication"),
      changePassword: z.boolean().optional().default(false).describe("[UserCredentials Default/Provided] Set to true when updating to change the password"),

      // Token Provided source fields
      token: z.string().optional().describe("[Token Provided] Token value for authentication"),
      changeToken: z.boolean().optional().default(false).describe("[Token Provided] Set to true when updating to change the token"),

      // OAuth2 Default/Reference fields
      oauth2ClientName: z.string().optional().describe("[OAuth2 Default/Reference] Name of the OAuth2 client (discover via simplifier://oauthclients)"),

      // ProfileReference fields (UserCredentials and OAuth2)
      profileKey: z.string().optional().describe("[ProfileReference] Key name in the user's profile"),

      // UserAttributeReference fields (UserCredentials and OAuth2)
      userAttributeName: z.string().optional().describe("[UserAttributeReference] Name of the user attribute"),
      userAttributeCategory: z.string().optional().describe("[UserAttributeReference] Category of the user attribute"),

      // Target configuration (for OAuth2 and Token)
      targetType: z.enum(["Default", "CustomHeader", "QueryParameter"]).optional().default("Default")
        .describe("[OAuth2/Token] Target type: Default (standard auth header), CustomHeader (custom header name), QueryParameter (query param - OAuth2 only)"),
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

        // Select appropriate mapper based on login method type
        let mapper: TargetAndSourceMapper;
        if (params.loginMethodType === "UserCredentials") {
          mapper = new UserCredentialsTargetAndSourceMapper();
        } else if (params.loginMethodType === "OAuth2") {
          mapper = new OAuthTargetAndSourceMapper();
        } else if (params.loginMethodType === "Token") {
          mapper = new TokenTargetAndSourceMapper();
        } else {
          throw new Error(`Unsupported loginMethodType: ${params.loginMethodType}`);
        }

        // Apply default source type if not provided
        const sourceType = params.sourceType || mapper.getDefaultSourceType();

        // Map source and target using the mapper
        const { source, sourceConfiguration } = mapper.mapSource(sourceType, params, existing);
        const { target, targetConfiguration } = mapper.mapTarget(params.targetType || "Default", params);

        // Build the request object
        const request: any = {
          name: params.name,
          description: params.description,
          loginMethodType: params.loginMethodType,
          source,
          target,
          sourceConfiguration,
          ...(targetConfiguration && { targetConfiguration })
        };

        if (existing) {
          return simplifier.updateLoginMethod(params.name, request);
        } else {
          return simplifier.createLoginMethod(request);
        }
      });
    });
}
