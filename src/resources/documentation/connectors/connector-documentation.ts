import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import {readFile} from "../../../resourceprovider.js";


function connectorResource(server: McpServer, connectorName: string, file: string) {
  const connectorNameLower = connectorName.toLocaleLowerCase()
  server.registerResource(
    `connector-docs-${connectorNameLower}`,
    `simplifier://documentation/connector-type/${connectorNameLower}`,
    {
      title: `${connectorName} Connector Documentation`,
      mimeType: "text/markdown",
      description: `Documentation for settings specific to ${connectorName} connector endpoints and calls`
    },
    async (uri): Promise<ReadResourceResult> => {
      const markdownContent = readFile(file);
      return {
        contents: [{
          uri: uri.href,
          text: markdownContent,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}

export function registerConnectorDocumentation(server: McpServer): void {
  connectorResource(server, "REST", "resources/documentation/connectors/rest.md");
  connectorResource(server, "SOAP", "resources/documentation/connectors/soap.md");
  connectorResource(server, "RFC", "resources/documentation/connectors/rfc.md");
  connectorResource(server, "SQL", "resources/documentation/connectors/sql.md");
}
