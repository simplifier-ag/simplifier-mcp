import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {SimplifierClient} from "./client/simplifier-client";
import {registerTools} from "./tools";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {registerResources} from "./resources";

export class SimplifierMCPServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer(
      {
        name: 'simplifier-mcp',
        version: '1.0.0',
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

