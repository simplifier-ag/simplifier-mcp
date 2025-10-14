import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";

export function registerOAuth2ClientResources(server: McpServer, simplifier: SimplifierClient): void {

  // OAuth2 clients list resource
  server.resource("oauthclients-list", "simplifier://oauthclients", {
      title: "List All OAuth2 Clients",
      mimeType: "application/json",
      description: `# Get the list of all OAuth2 Clients

This resource provides the entry point for discovering all available OAuth2 clients configured in the Simplifier instance.

**What are OAuth2 Clients?**
OAuth2 clients are configured authentication providers that can be used with:
- OAuth2 login methods for connectors
- User authentication flows
- External identity provider integration

**Use Cases:**
- Discover which OAuth2 clients are configured
- Get client names for creating OAuth2 login methods

**Example OAuth2 Clients:**
- Infrastructure OIDC providers (Auth0, Okta, etc.)
- Social login providers (Spotify, Google, etc.)
- Enterprise identity providers (Azure AD, SAP BTP, etc.)

**Creating OAuth2 Login Methods:**
The OAuth2 client names returned by this resource can be used as the \`clientName\`
when creating OAuth2 login methods via the \`loginmethod-update\` tool.`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const response = await simplifier.listOAuth2Clients();

        const clientResources = response.authSettings.map(client => ({
          name: client.name,
          description: client.description,
          mechanism: client.mechanism,
          hasIcon: client.hasIcon
        }));

        return {
          oauthClients: clientResources,
          totalCount: response.authSettings.length,
          usage: "Use the 'name' field as clientName when creating OAuth2 login methods"
        };
      });
    }
  );
}
