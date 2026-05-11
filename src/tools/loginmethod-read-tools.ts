import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";

/**
 * Read-only tool mirrors for login-method and OAuth2 client resources.
 *
 * These tools exist so that MCP clients which do not implement the
 * `resources/*` capability can still discover authentication
 * configurations. Clients that support resources should prefer the
 * corresponding `simplifier://loginmethod/...` and
 * `simplifier://oauthclients` resources.
 */
export function registerLoginMethodReadTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameLoginMethodList = "loginmethod-list";
  server.tool(toolNameLoginMethodList,
    `# List all Login Methods

Returns names, descriptions, types and supported connectors for every Login Method.
Equivalent to reading the \`simplifier://loginmethods\` resource; prefer the resource in clients that support MCP Resources.`,
    {},
    {
      title: "List Login Methods",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("list Login Methods", async () => {
        const trackingKey = trackingToolPrefix + toolNameLoginMethodList;
        const response = await simplifier.listLoginMethods(trackingKey);
        return {
          loginMethods: response.loginMethods.map(lm => ({
            name: lm.name,
            description: lm.description,
            type: lm.loginMethodType.technicalName,
            supportedConnectors: lm.loginMethodType.supportedConnectors
          })),
          totalCount: response.loginMethods.length
        };
      });
    });

  const toolNameLoginMethodGet = "loginmethod-get";
  server.tool(toolNameLoginMethodGet,
    `# Get details of a single Login Method

Returns full configuration (type, source, target, method-specific settings) for a Login Method.
Equivalent to reading the \`simplifier://loginmethod/{name}\` resource; prefer the resource in clients that support MCP Resources.`,
    {
      name: z.string().describe("Login Method name")
    },
    {
      title: "Get Login Method details",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ name }) => {
      return wrapToolResult(`get Login Method ${name}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameLoginMethodGet;
        const rawDetails = await simplifier.getLoginMethodDetails(name, trackingKey);
        const sourceName = rawDetails.loginMethodType.sources.find(s => s.id === rawDetails.source)?.name || "UNKNOWN";
        const targetName = rawDetails.loginMethodType.targets.find(t => t.id === rawDetails.target)?.name || "UNKNOWN";
        return {
          name: rawDetails.name,
          description: rawDetails.description,
          type: rawDetails.loginMethodType.technicalName,
          source: { id: rawDetails.source, name: sourceName },
          target: { id: rawDetails.target, name: targetName },
          sourceConfiguration: rawDetails.sourceConfiguration,
          targetConfiguration: rawDetails.targetConfiguration,
          configuration: rawDetails.configuration,
          supportedConnectors: rawDetails.loginMethodType.supportedConnectors
        };
      });
    });

  const toolNameOAuthClientList = "oauthclient-list";
  server.tool(toolNameOAuthClientList,
    `# List all OAuth2 Clients

Returns names, descriptions and mechanism information for all OAuth2 clients configured on the instance.
Use the returned \`name\` values as \`oauth2ClientName\` when creating OAuth2 Login Methods via \`loginmethod-update\`.

Equivalent to reading the \`simplifier://oauthclients\` resource; prefer the resource in clients that support MCP Resources.`,
    {},
    {
      title: "List OAuth2 Clients",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("list OAuth2 Clients", async () => {
        const trackingKey = trackingToolPrefix + toolNameOAuthClientList;
        const response = await simplifier.listOAuth2Clients(trackingKey);
        return {
          oauthClients: response.authSettings.map(c => ({
            name: c.name,
            description: c.description,
            mechanism: c.mechanism,
            hasIcon: c.hasIcon
          })),
          totalCount: response.authSettings.length
        };
      });
    });
}
