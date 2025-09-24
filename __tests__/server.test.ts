// Mock config for this test
jest.mock('../src/config', () => ({
  config: {
    simplifierBaseUrl: 'http://localhost:8080',
    nodeEnv: 'test',
    simplifierToken: 'test-token'
  }
}));

// Mock registerTools function
jest.mock('../src/tools/index', () => ({
  registerTools: jest.fn()
}));

// Mock registerResources function
jest.mock('../src/resources/index', () => ({
  registerResources: jest.fn()
}));

import { SimplifierMCPServer } from '../src/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

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
      expect(mcpServer).toBeInstanceOf(McpServer);
    });

    it('should be properly configured', () => {
      const mcpServer = server.getServer();
      expect(mcpServer).toBeDefined();
    });
  });

  describe('MCP protocol handling', () => {
    it('should initialize without throwing errors', () => {
      expect(() => new SimplifierMCPServer()).not.toThrow();
    });

    it('should setup handlers with registerResources and registerTools', () => {
      // The registerResources and registerTools mocks should have been called during server initialization
      expect(require('../src/resources/index').registerResources).toHaveBeenCalled();
      expect(require('../src/tools/index').registerTools).toHaveBeenCalled();
    });
  });
});