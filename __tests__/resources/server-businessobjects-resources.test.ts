import { registerServerBusinessObjectResources } from '../../src/resources/server-businessobject-resources';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SimplifierBusinessObject } from '../../src/client/types';

// Mock the resourcesresult wrapper
jest.mock('../../src/resources/resourcesresult', () => ({
  wrapResourceResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('Server Business Objects Tools', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockClient: jest.Mocked<SimplifierClient>;
  let mockWrapResourceResult: jest.MockedFunction<any>;

  beforeEach(() => {
    // Create mock server with resource method
    mockServer = {
      resource: jest.fn(),
    } as any;

    // Create mock client
    mockClient = {
      getServerBusinessObjects: jest.fn(),
    } as any;

    // Get the mocked wrapResourceResult
    mockWrapResourceResult = require('../../src/resources/resourcesresult').wrapResourceResult;
    mockWrapResourceResult.mockClear();
  });

  const createMockExtra = () => ({
    signal: new AbortController().signal,
    requestId: 'test-request-id',
    sendNotification: jest.fn(),
    sendRequest: jest.fn()
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerServerBusinessObjectTools', () => {
    it('should register business object resource with correct parameters', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledWith(
        'businessobject-list',
        'simplifier://serverbusinessobjects',
        {
          title: 'Business Objects',
          mimeType: 'application/json',
          description: expect.stringContaining('Get all server side Business Objects'),
        },
        expect.any(Function)
      );
    });

    it('should register resource with correct description', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      const call = mockServer.resource.mock.calls[0];
      const resourceConfig = call[2];

      expect(resourceConfig.description).toContain('Get all server side Business Objects');
      expect(resourceConfig.description).toContain('Provides the list of all Business Objects from the Simplifier appserver.');
    });

    describe('resource handler', () => {
      let resourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        resourceHandler = mockServer.resource.mock.calls[0][3];
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://serverbusinessobjects');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await resourceHandler(testUri, {}, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should call getServerBusinessObjects through the wrapper', async () => {
        const testUri = new URL('simplifier://serverbusinessobjects');
        const mockBusinessObjects: SimplifierBusinessObject[] = [
          {
            id: '1',
            name: 'Test BO',
            script: 'return "hello";',
            parameters: [],
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        mockClient.getServerBusinessObjects.mockResolvedValue(mockBusinessObjects);

        // Mock wrapResourceResult to call the function and return the result
        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await resourceHandler(testUri, {}, createMockExtra());

        expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Test BO');
        expect(result.contents[0].mimeType).toBe('application/json');
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://serverbusinessobjects');
        const testError = new Error('API Error');

        mockClient.getServerBusinessObjects.mockRejectedValue(testError);

        // Mock wrapResourceResult to handle errors
        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          try {
            await fn();
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({error: 'Should not reach here'}),
                mimeType: 'application/json'
              }]
            };
          } catch (e) {
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({error: `Could not get data! ${e}`}),
                mimeType: 'application/json'
              }]
            };
          }
        });

        const result = await resourceHandler(testUri, {}, createMockExtra());

        expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('API Error');
      });

      it('should pass URI to wrapResourceResult correctly', async () => {
        const testUri = new URL('simplifier://serverbusinessobjects?param=value');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await resourceHandler(testUri, {}, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );

        // Verify the URI is passed correctly to the wrapper
        const passedUri = mockWrapResourceResult.mock.calls[0][0];
        expect(passedUri.href).toBe(testUri.href);
        expect(passedUri.searchParams.get('param')).toBe('value');
      });
    });
  });

  describe('integration with real data', () => {
    it('should handle empty business objects list', async () => {
      const testUri = new URL('simplifier://serverbusinessobjects');
      mockClient.getServerBusinessObjects.mockResolvedValue([]);

      registerServerBusinessObjectResources(mockServer, mockClient);
      const resourceHandler = mockServer.resource.mock.calls[0][3];

      // Mock wrapResourceResult to simulate real behavior
      mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
        const result = await fn();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(result, null, 2),
            mimeType: 'application/json'
          }]
        };
      });

      const result = await resourceHandler(testUri, {}, createMockExtra());

      expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
      expect(result.contents[0].text).toBe('[]');
    });

    it('should handle complex business objects with parameters', async () => {
      const testUri = new URL('simplifier://serverbusinessobjects');
      const complexBusinessObject: SimplifierBusinessObject = {
        id: 'complex-bo-1',
        name: 'Complex Business Object',
        description: 'A complex business object with parameters',
        script: 'function processData(input) { return input.toUpperCase(); }',
        parameters: [
          {
            name: 'input',
            type: 'string',
            required: true,
            description: 'Input data to process'
          },
          {
            name: 'options',
            type: 'object',
            required: false,
            description: 'Processing options',
            defaultValue: { caseSensitive: false }
          }
        ],
        returnType: 'string',
        status: 'active',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      mockClient.getServerBusinessObjects.mockResolvedValue([complexBusinessObject]);

      registerServerBusinessObjectResources(mockServer, mockClient);
      const resourceHandler = mockServer.resource.mock.calls[0][3];

      mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
        const result = await fn();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(result, null, 2),
            mimeType: 'application/json'
          }]
        };
      });

      const result = await resourceHandler(testUri, {}, createMockExtra());

      expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
      const resultData = JSON.parse(result.contents[0].text as string);
      expect(resultData[0].name).toBe('Complex Business Object');
      expect(resultData[0].parameters).toHaveLength(2);
      expect(resultData[0].parameters[0].name).toBe('input');
    });
  });
});