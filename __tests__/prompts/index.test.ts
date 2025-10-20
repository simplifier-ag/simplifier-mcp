import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SimplifierClient } from '../../src/client/simplifier-client.js';

// Unmock the prompts module for these tests
jest.unmock('../../src/prompts/index');

describe('Prompts Index', () => {
  // Dynamic import to get the actual implementation
  let registerPrompts: any;
  describe('registerPrompts', () => {
    let mockServer: McpServer;
    let mockSimplifier: SimplifierClient;
    let mockPrompt: jest.Mock;

    beforeEach(async () => {
      // Import the actual implementation
      const module = await import('../../src/prompts/index.js');
      registerPrompts = module.registerPrompts;

      mockPrompt = jest.fn();
      mockServer = {
        prompt: mockPrompt
      } as unknown as McpServer;
      mockSimplifier = {} as SimplifierClient;
    });

    it('should be a function', () => {
      expect(typeof registerPrompts).toBe('function');
    });

    it('should register prompts with server', () => {
      registerPrompts(mockServer, mockSimplifier);

      // Should register the OpenAPI connector prompt
      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should register the create-connector-from-openapi prompt', () => {
      registerPrompts(mockServer, mockSimplifier);

      const calls = mockPrompt.mock.calls;
      const openApiPromptCall = calls.find(call => call[0] === 'create-connector-from-openapi');

      expect(openApiPromptCall).toBeDefined();
      expect(openApiPromptCall![0]).toBe('create-connector-from-openapi');
      expect(typeof openApiPromptCall![1]).toBe('string'); // description
      expect(typeof openApiPromptCall![2]).toBe('object'); // args schema
      expect(typeof openApiPromptCall![3]).toBe('function'); // callback
    });
  });
});
