import { SimplifierMCPServer } from '../src/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('SimplifierMCPServer', () => {
  let server: SimplifierMCPServer;

  beforeEach(() => {
    server = new SimplifierMCPServer();
  });

  afterEach(() => {
    // Clean up any resources if needed
  });

  describe('initialization', () => {
    it('should create a server instance', () => {
      expect(server).toBeInstanceOf(SimplifierMCPServer);
    });

    it('should have access to underlying MCP server', () => {
      const mcpServer = server.getServer();
      expect(mcpServer).toBeInstanceOf(Server);
    });

    it('should configure server with correct name and version', () => {
      const mcpServer = server.getServer();
      const serverInfo = (mcpServer as any).serverInfo;

      expect(serverInfo.name).toBe('simplifier-mcp');
      expect(serverInfo.version).toBe('1.0.0');
    });

    it('should configure server with required capabilities', () => {
      const mcpServer = server.getServer();
      const capabilities = (mcpServer as any).capabilities;

      expect(capabilities.capabilities).toHaveProperty('tools');
      expect(capabilities.capabilities).toHaveProperty('resources');
      expect(capabilities.capabilities).toHaveProperty('prompts');
    });
  });

  describe('MCP protocol handling', () => {
    it('should handle list_tools request', () => {
      const mcpServer = server.getServer();
      const handlers = (mcpServer as any).requestHandlers;

      expect(handlers).toHaveProperty('tools/list');
    });

    it('should handle call_tool request', () => {
      const mcpServer = server.getServer();
      const handlers = (mcpServer as any).requestHandlers;

      expect(handlers).toHaveProperty('tools/call');
    });

    it('should handle list_resources request', () => {
      const mcpServer = server.getServer();
      const handlers = (mcpServer as any).requestHandlers;

      expect(handlers).toHaveProperty('resources/list');
    });

    it('should handle read_resource request', () => {
      const mcpServer = server.getServer();
      const handlers = (mcpServer as any).requestHandlers;

      expect(handlers).toHaveProperty('resources/read');
    });

    it('should handle list_prompts request', () => {
      const mcpServer = server.getServer();
      const handlers = (mcpServer as any).requestHandlers;

      expect(handlers).toHaveProperty('prompts/list');
    });

    it('should handle get_prompt request', () => {
      const mcpServer = server.getServer();
      const handlers = (mcpServer as any).requestHandlers;

      expect(handlers).toHaveProperty('prompts/get');
    });
  });
});