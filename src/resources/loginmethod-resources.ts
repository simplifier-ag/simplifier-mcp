import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";

export function registerLoginMethodResources(server: McpServer, simplifier: SimplifierClient): void {

  // Main discoverable login methods resource - shows up in resources/list
  server.resource("loginmethods-list", "simplifier://loginmethods", {
      title: "List All Login Methods",
      mimeType: "application/json",
      description: `# Get the list of all Login Methods

This resource provides the entry point for discovering all available login methods in the Simplifier instance.
Each login method can be accessed via simplifier://loginmethod/{loginMethodName} for detailed information (future feature).

**What are Login Methods?**
Login methods handle authentication for connectors, supporting various authentication types:
- BasicAuth (UserCredentials)
- OAuth2
- Bearer Tokens
- Certificates
- SAML
- SSO (SAP Single Sign-On)
- WSS (Web Services Security)
- Microsoft Entra ID

**Use Cases:**
- Discover which login methods are configured
- Understand authentication options for connectors
- See which connectors support each login method type
- Track who created/modified login methods and when`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const response = await simplifier.listLoginMethods();

        const loginMethodResources = response.loginMethods.map(lm => {
          // Find source and target names from the arrays
          const sourceName = lm.loginMethodType.sources.find(s => s.id === lm.source)?.name || 'UNKNOWN';
          const targetName = lm.loginMethodType.targets.find(t => t.id === lm.target)?.name || 'UNKNOWN';

          return {
            uri: `simplifier://loginmethod/${lm.name}`,
            name: lm.name,
            description: lm.description,
            type: lm.loginMethodType.technicalName,
            source: sourceName,
            target: targetName,
            supportedConnectors: lm.loginMethodType.supportedConnectors,
            updateInfo: lm.updateInfo,
            editable: lm.editable,
            deletable: lm.deletable
          };
        });

        return {
          loginMethods: loginMethodResources,
          totalCount: response.loginMethods.length,
          resourcePatterns: [
            "simplifier://loginmethods - List all login methods",
            "simplifier://loginmethod/{name} - Specific login method details (future)"
          ]
        };
      });
    }
  );
}
