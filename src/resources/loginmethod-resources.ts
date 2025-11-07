import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {SimplifierLoginMethodDetailsRaw, SimplifierLoginMethodDetails} from "../client/types.js";
import {trackingResourcePrefix} from "../client/matomo-tracking.js";

export function registerLoginMethodResources(server: McpServer, simplifier: SimplifierClient): void {

  // Main discoverable login methods resource - shows up in resources/list
  const resourceNameLoginMethodsList = "loginmethods-list"
  server.resource(resourceNameLoginMethodsList, "simplifier://loginmethods", {
      title: "List All Login Methods",
      mimeType: "application/json",
      description: `# Get the list of all Login Methods

This resource provides the entry point for discovering all available login methods in the Simplifier instance.
Each login method can be accessed via simplifier://loginmethod/{loginMethodName} for detailed information.

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
        const trackingKey = trackingResourcePrefix + resourceNameLoginMethodsList
        const response = await simplifier.listLoginMethods(trackingKey);

        const loginMethodResources = response.loginMethods.map(lm => {
          return {
            uri: `simplifier://loginmethod/${lm.name}`,
            name: lm.name,
            description: lm.description,
            type: lm.loginMethodType.technicalName,
            supportedConnectors: lm.loginMethodType.supportedConnectors,
            updateInfo: lm.updateInfo
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

  // Individual login method resource template - dynamic URI with {loginMethodName}
  const noListCallback = { list: undefined };
  const resourceNameLoginMethodDetails = "loginmethod-details"
  server.resource(resourceNameLoginMethodDetails, new ResourceTemplate("simplifier://loginmethod/{loginMethodName}", noListCallback), {
      title: "Get Login Method Details",
      mimeType: "application/json",
      description: `# Get detailed configuration for a specific Login Method

This resource provides complete configuration details for a login method, including:
- **Source Configuration**: Where credentials come from (stored values, user profile, system reference, etc.)
- **Target Configuration**: Where credentials are placed (header, query parameter, etc.)
- **Method Configuration**: Method-specific settings (Base64 encoding, prerequisites, etc.)

**Note**: Unlike the list endpoint, individual details do NOT include updateInfo, editable, or deletable fields.

**Example URIs**:
- simplifier://loginmethod/TestUserCredentials
- simplifier://loginmethod/oAuthSpotify
- simplifier://loginmethod/TokenMethod

**Configuration Types by Login Method**:
- **UserCredentials**: Username/password with optional profile/attribute references
- **OAuth2**: OAuth2 client references
- **Token**: Bearer tokens from various sources
- **Certificate**: X.509 certificates with prerequisites
- **SingleSignOn**: SAP SSO with or without external providers
- **SAML**: SAML authentication
- **WSS**: Web Services Security
- **MSEntraID_OAuth**: Microsoft Entra ID (formerly Azure AD)

**Type Safety**: All configurations use discriminated unions for type-safe access based on login method type and source/target.`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const pathParts = uri.pathname.split('/');
        const loginMethodName = pathParts[pathParts.length - 1];

        if (!loginMethodName) {
          throw new Error('Login method name is required in URI path');
        }

        const trackingKey = trackingResourcePrefix + resourceNameLoginMethodDetails
        const rawDetails = await simplifier.getLoginMethodDetails(loginMethodName, trackingKey);
        const details = transformLoginMethodDetails(rawDetails);

        // Resolve source and target IDs to names for readability
        const sourceName = details.loginMethodType.sources.find(s => s.id === details.source)?.name || 'UNKNOWN';
        const targetName = details.loginMethodType.targets.find(t => t.id === details.target)?.name || 'UNKNOWN';

        return {
          name: details.name,
          description: details.description,
          type: details.loginMethodType.technicalName,
          source: {
            id: details.source,
            name: sourceName
          },
          target: {
            id: details.target,
            name: targetName
          },
          sourceConfiguration: details.sourceConfiguration,
          targetConfiguration: details.targetConfiguration,
          configuration: details.configuration,
          supportedConnectors: details.loginMethodType.supportedConnectors,
          loginMethodType: details.loginMethodType
        };
      });
    }
  );
}


/**
 * Transforms raw login method details from API into discriminated union types
 * by adding synthetic 'type' fields for TypeScript type narrowing.
 */
function transformLoginMethodDetails(raw: SimplifierLoginMethodDetailsRaw): SimplifierLoginMethodDetails {
  const typeName = raw.loginMethodType.technicalName;

  // Add discriminators to sourceConfiguration
  const sourceConfiguration = {
    type: typeName,
    source: raw.source,
    ...raw.sourceConfiguration
  } as any;

  // Add discriminator to configuration
  const configuration = {
    type: typeName,
    ...raw.configuration
  } as any;

  // Add discriminator to targetConfiguration if present
  const targetConfiguration = raw.targetConfiguration ? {
    target: raw.target,
    ...raw.targetConfiguration
  } as any : undefined;

  return {
    name: raw.name,
    description: raw.description,
    loginMethodType: raw.loginMethodType,
    source: raw.source,
    target: raw.target,
    sourceConfiguration,
    targetConfiguration,
    configuration
  };
}
