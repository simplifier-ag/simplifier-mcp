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
- **String** (ID: 22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52): BaseType for strings (operators: ==, !=)
- **Integer** (ID: B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D): BaseType for integer (operators: ==, !=, <, >, <=, >=)
- **Boolean** (ID: 2788FB5AA776C62635F156C820190D0FD3D558765201881A77382093F7248B39): BaseType for boolean (operators: ==, !=)
- **Date** (ID: 06A9841478D7BE17C423F11C38CD6829E372093DBEC144F2A85FC7165BE8CD80): BaseType for dates (operators: ==, !=)
- **Float** (ID: C09139C72F5A8A7E0036BA66CE301748BD617F463683EE03F92EDAAAA4AF8BC7): BaseType for floats (operators: ==, !=, <, >, <=, >=)
- **Any** (ID: D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB): BaseType for Any (no operators)

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

