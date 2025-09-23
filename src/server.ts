import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
// import { config } from './config.js'; // TODO: Will be used when SimplifierToken authentication is implemented
import { tools } from './tools/index.js';
import { resources } from './resources/index.js';
import { prompts } from './prompts/index.js';

export class SimplifierMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = tools.find(t => t.name === name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // TODO: Implement actual tool execution when tools are added
      return {
        content: [
          {
            type: 'text',
            text: `Tool ${name} called with args: ${JSON.stringify(args)}`,
          },
        ],
      };
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: resources,
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      const resource = resources.find(r => r.uri === uri);
      if (!resource) {
        throw new Error(`Unknown resource: ${uri}`);
      }

      // TODO: Implement actual resource reading when resources are added
      return {
        contents: [
          {
            uri: uri,
            mimeType: 'text/plain',
            text: `Resource content for: ${uri}`,
          },
        ],
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: prompts,
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const prompt = prompts.find(p => p.name === name);
      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      // TODO: Implement actual prompt generation when prompts are added
      return {
        description: prompt.description || `Prompt: ${name}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Prompt ${name} with args: ${JSON.stringify(args)}`,
            },
          },
        ],
      };
    });
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  public getServer(): Server {
    return this.server;
  }
}