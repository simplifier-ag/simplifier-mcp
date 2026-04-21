import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export const CONNECTOR_API_DOCUMENTATION_MARKDOWN = `# Simplifier Connector API Reference

The Simplifier Connector API allows access to configured connectors from server-side Business Objects.
The API consists of generated methods based on the available connectors.

A connector call can be called with \`Simplifier.Connector.<connector-name>.<call-name>(payload)\`.
The payload should be an object with all input parameters required by the connector call, or an empty object if no
input parameters are required. Proxy and OData connectors cannot be called using this API, as they don't define connector
calls.

The result of the call will be an object with the connector call's configured output parameters.
If an error occurs, an exception will be thrown.

## Example

\`\`\`javascript
var connectorCallResult = Simplifier.Connector.MySoap.myCall({"Foo": "bar"});
\`\`\`
`;

export function registerConnectorApiDocumentation(server: McpServer): void {
  server.resource(
    "connector-api-docs",
    "simplifier://documentation/server-businessobjects/api/Connector",
    {
      title: "Simplifier Connector API Documentation",
      mimeType: "text/markdown",
      description: "Complete reference for Simplifier.Connector methods available in server-side Business Objects"
    },
    async (uri): Promise<ReadResourceResult> => {
      return {
        contents: [{
          uri: uri.href,
          text: CONNECTOR_API_DOCUMENTATION_MARKDOWN,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}