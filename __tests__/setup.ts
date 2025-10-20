import dotenv from 'dotenv';

// Mock @modelcontextprotocol/sdk
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: class MockServer {
    constructor(serverInfo: any, capabilities: any) {
      (this as any).serverInfo = serverInfo;
      (this as any).capabilities = capabilities;
      (this as any).requestHandlers = {};
    }
    setRequestHandler(schema: any, handler: any) {
      (this as any).requestHandlers[schema.method] = handler;
    }
    async connect(_transport: any) {}
  }
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class MockStdioServerTransport {}
}));

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: { method: 'tools/call' },
  ListToolsRequestSchema: { method: 'tools/list' },
  ListResourcesRequestSchema: { method: 'resources/list' },
  ReadResourceRequestSchema: { method: 'resources/read' },
  ListPromptsRequestSchema: { method: 'prompts/list' },
  GetPromptRequestSchema: { method: 'prompts/get' },
}));

// Mock modules for consistent testing
jest.mock('../src/tools/index', () => ({
  tools: []
}));

jest.mock('../src/resources/index', () => ({
  resources: []
}));

jest.mock('../src/prompts/index', () => ({
  prompts: [],
  registerPrompts: jest.fn()
}));

dotenv.config({ path: '.env.test' });

jest.setTimeout(10000);