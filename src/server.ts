import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {SimplifierClient} from "./client/simplifier-client.js";
import {registerTools} from "./tools/index.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {registerResources} from "./resources/index.js";

export class SimplifierMCPServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer(
      {
        name: 'simplifier-mcp',
        version: '1.0.0',
        description: `Simplifier Low Code Platform MCP Server

This server provides access to Simplifier's REST API for managing connectors, business objects, and data types.

## Available Base Data Types (built-in):
- **String**: BaseType for strings (operators: ==, !=)
- **Integer**: BaseType for integer (operators: ==, !=, <, >, <=, >=)
- **Boolean**: BaseType for boolean (operators: ==, !=)
- **Date**: BaseType for dates (operators: ==, !=)
- **Float**: BaseType for floats (operators: ==, !=, <, >, <=, >=)
- **Any**: BaseType for Any (no operators)

Additional data types (domain, struct, collection) are organized by namespace and accessible via resources.`,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    const simplifier = new SimplifierClient();
    this.setupHandlers(this.server, simplifier);
  }

  private setupHandlers(mcpServer: McpServer, apiClient: SimplifierClient): void {
    registerResources(mcpServer, apiClient);
    registerTools(mcpServer, apiClient);
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  public getServer(): McpServer {
    return this.server;
  }
}

