import { generateOpenAPIConnectorPromptText, openAPIConnectorPromptCallback, registerOpenAPIConnectorPrompt } from '../../src/prompts/openapi-connector-prompt.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SimplifierClient } from '../../src/client/simplifier-client.js';

describe('OpenAPI Connector Prompt', () => {
  describe('generateOpenAPIConnectorPromptText', () => {
    it('should generate prompt text with URL input', () => {
      const result = generateOpenAPIConnectorPromptText(
        'https://api.example.com/openapi.yaml',
        'ExampleAPI',
        'integrations'
      );

      expect(result).toContain('Create Simplifier Connector from OpenAPI Specification');
      expect(result).toContain('https://api.example.com/openapi.yaml');
      expect(result).toContain('Fetch the OpenAPI specification from:');
      expect(result).toContain('**Name**: ExampleAPI');
      expect(result).toContain('**Namespace**: integrations');
    });

    it('should generate prompt text with inline spec input', () => {
      const result = generateOpenAPIConnectorPromptText(
        'openapi: 3.0.0\ninfo:\n  title: Test API'
      );

      expect(result).toContain('Parse the provided OpenAPI specification');
      expect(result).not.toContain('Fetch the OpenAPI specification from:');
    });

    it('should use default values for optional parameters', () => {
      const result = generateOpenAPIConnectorPromptText(
        'https://api.example.com/openapi.yaml'
      );

      expect(result).toContain('**Name**: <will be derived from OpenAPI spec>');
      expect(result).toContain('**Namespace**: api');
    });

    it('should include all phases in the prompt', () => {
      const result = generateOpenAPIConnectorPromptText(
        'https://api.example.com/openapi.yaml'
      );

      expect(result).toContain('## Phase 1: Fetch and Parse OpenAPI Specification');
      expect(result).toContain('## Phase 2: Analyze and Present Endpoints');
      expect(result).toContain('## Phase 3: User Selection');
      expect(result).toContain('## Phase 4: Create Connector and Components');
    });

    it('should include guidelines and available tools', () => {
      const result = generateOpenAPIConnectorPromptText(
        'https://api.example.com/openapi.yaml'
      );

      expect(result).toContain('## Important Guidelines:');
      expect(result).toContain('## Available Tools:');
      expect(result).toContain('datatype-update');
      expect(result).toContain('connector-update');
      expect(result).toContain('connector-call-update');
    });
  });

  describe('openAPIConnectorPromptCallback', () => {
    it('should return GetPromptResult with correct structure', () => {
      const args = {
        openapi_url_or_spec: 'https://api.example.com/openapi.yaml',
        connector_name: 'ExampleAPI',
        namespace: 'integrations'
      };

      const result = openAPIConnectorPromptCallback(args);

      expect(result.description).toBe('Multi-phase workflow for creating a Simplifier connector from OpenAPI specification');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
      expect(typeof result.messages[0].content.text).toBe('string');
    });

    it('should handle missing optional parameters', () => {
      const args = {
        openapi_url_or_spec: 'https://api.example.com/openapi.yaml'
      };

      const result = openAPIConnectorPromptCallback(args);

      expect(result.messages[0].content.text).toContain('<will be derived from OpenAPI spec>');
      expect(result.messages[0].content.text).toContain('**Namespace**: api');
    });
  });

  describe('registerOpenAPIConnectorPrompt', () => {
    let mockServer: McpServer;
    let mockSimplifier: SimplifierClient;
    let mockPrompt: jest.Mock;

    beforeEach(() => {
      mockPrompt = jest.fn();
      mockServer = {
        prompt: mockPrompt
      } as unknown as McpServer;
      mockSimplifier = {} as SimplifierClient;
    });

    it('should register prompt with server', () => {
      registerOpenAPIConnectorPrompt(mockServer, mockSimplifier);

      expect(mockPrompt).toHaveBeenCalledTimes(1);
      expect(mockPrompt).toHaveBeenCalledWith(
        'create-connector-from-openapi',
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should register prompt with correct description', () => {
      registerOpenAPIConnectorPrompt(mockServer, mockSimplifier);

      const description = mockPrompt.mock.calls[0][1];
      expect(description).toContain('Guided workflow');
      expect(description).toContain('OpenAPI specification');
    });

    it('should register prompt with correct argument schema', () => {
      registerOpenAPIConnectorPrompt(mockServer, mockSimplifier);

      const argsSchema = mockPrompt.mock.calls[0][2];
      expect(argsSchema).toHaveProperty('openapi_url_or_spec');
      expect(argsSchema).toHaveProperty('connector_name');
      expect(argsSchema).toHaveProperty('namespace');
    });

    it('should register prompt with callback function', () => {
      registerOpenAPIConnectorPrompt(mockServer, mockSimplifier);

      const callback = mockPrompt.mock.calls[0][3];
      expect(typeof callback).toBe('function');
    });
  });
});
