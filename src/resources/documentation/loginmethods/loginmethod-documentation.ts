import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import {readFile} from "../../../resourceprovider.js";


function loginMethodResource(server: McpServer, title: string, uriName: string, file: string) {
  server.registerResource(
    `loginmethod-docs-${uriName}`,
    `simplifier://documentation/loginmethod-type/${uriName}`,
    {
      title: `${title} Login Method Documentation`,
      mimeType: "text/markdown",
      description: `Documentation for the login method ${title}`
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

export function registerLoginMethodDocumentation(server: McpServer): void {
  loginMethodResource(server, "UserCredentials (BasicAuth)", "usercredentials", "resources/documentation/loginmethods/usercredentials.md")
  loginMethodResource(server, "OAuth2", "oauth2", "resources/documentation/loginmethods/oauth2.md")
  loginMethodResource(server, "Token", "token", "resources/documentation/loginmethods/token.md")
  loginMethodResource(server, "SAP-Single Sign On", "sapsso", "resources/documentation/loginmethods/sapsso.md")

}
