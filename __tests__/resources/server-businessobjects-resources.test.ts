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
      getServerBusinessObjectDetails: jest.fn(),
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

  describe('registerServerBusinessObjectResources', () => {
    it('should register business object list resource with correct parameters', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledWith(
        'businessobject-list',
        'simplifier://serverbusinessobjects',
        {
          title: 'Business Objects',
          mimeType: 'application/json',
          description: 'Get all server side Business Object Details at once',
        },
        expect.any(Function)
      );
    });

    it('should register business object details resource with correct parameters', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledWith(
        'businessobject-details',
        expect.any(Object), // ResourceTemplate
        {
          title: 'Business Object Details',
          mimeType: 'application/json',
          description: 'Get details on a particular server side Business Object',
        },
        expect.any(Function)
      );
    });

    it('should register both resources', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(2);
    });

    describe('business object list handler', () => {
      let listResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        listResourceHandler = mockServer.resource.mock.calls[0][3]; // First resource (list)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://serverbusinessobjects');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await listResourceHandler(testUri, {}, createMockExtra());

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

        const result = await listResourceHandler(testUri, {}, createMockExtra());

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

        const result = await listResourceHandler(testUri, {}, createMockExtra());

        expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('API Error');
      });

      it('should pass URI to wrapResourceResult correctly', async () => {
        const testUri = new URL('simplifier://serverbusinessobjects?param=value');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await listResourceHandler(testUri, {}, createMockExtra());

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

    describe('business object details handler', () => {
      let detailsResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        detailsResourceHandler = mockServer.resource.mock.calls[1][3]; // Second resource (details)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://businessobjects/TestObject');
        const variables = { objectName: 'TestObject' };
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await detailsResourceHandler(testUri, variables, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should call getServerBusinessObjectDetails through the wrapper', async () => {
        const testUri = new URL('simplifier://businessobjects/MyBusinessObject');
        const variables = { objectName: 'MyBusinessObject' };
        const mockBusinessObject: SimplifierBusinessObject = {
          id: 'MyBusinessObject',
          name: 'My Business Object',
          script: 'return "detailed info";',
          parameters: [{ name: 'param1', type: 'string', required: true }],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockClient.getServerBusinessObjectDetails.mockResolvedValue(mockBusinessObject);

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

        const result = await detailsResourceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getServerBusinessObjectDetails).toHaveBeenCalledWith('MyBusinessObject');
        expect(result.contents[0].text).toContain('My Business Object');
        expect(result.contents[0].mimeType).toBe('application/json');
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://businessobjects/NonExistentObject');
        const variables = { objectName: 'NonExistentObject' };
        const testError = new Error('Object not found');

        mockClient.getServerBusinessObjectDetails.mockRejectedValue(testError);

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

        const result = await detailsResourceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getServerBusinessObjectDetails).toHaveBeenCalledWith('NonExistentObject');
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('Object not found');
      });
    });
  });

  describe('integration with real data', () => {
    it('should handle empty business objects list', async () => {
      const testUri = new URL('simplifier://serverbusinessobjects');
      mockClient.getServerBusinessObjects.mockResolvedValue([]);

      registerServerBusinessObjectResources(mockServer, mockClient);
      const listResourceHandler = mockServer.resource.mock.calls[0][3];

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

      const result = await listResourceHandler(testUri, {}, createMockExtra());

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
      const listResourceHandler = mockServer.resource.mock.calls[0][3];

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

      const result = await listResourceHandler(testUri, {}, createMockExtra());

      expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
      const resultData = JSON.parse(result.contents[0].text as string);
      expect(resultData[0].name).toBe('Complex Business Object');
      expect(resultData[0].parameters).toHaveLength(2);
      expect(resultData[0].parameters[0].name).toBe('input');
    });

    it('should handle business object details retrieval', async () => {
      const testUri = new URL('simplifier://businessobjects/DetailedObject');
      const variables = { objectName: 'DetailedObject' };
      const detailedBusinessObject: SimplifierBusinessObject = {
        id: 'detailed-bo-1',
        name: 'Detailed Business Object',
        description: 'A detailed business object for testing',
        script: 'function execute(data) { return processSpecialData(data); }',
        parameters: [
          {
            name: 'data',
            type: 'object',
            required: true,
            description: 'The data to process'
          }
        ],
        returnType: 'object',
        status: 'active',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      mockClient.getServerBusinessObjectDetails.mockResolvedValue(detailedBusinessObject);

      registerServerBusinessObjectResources(mockServer, mockClient);
      const detailsResourceHandler = mockServer.resource.mock.calls[1][3];

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

      const result = await detailsResourceHandler(testUri, variables, createMockExtra());

      expect(mockClient.getServerBusinessObjectDetails).toHaveBeenCalledWith('DetailedObject');
      const resultData = JSON.parse(result.contents[0].text as string);
      expect(resultData.name).toBe('Detailed Business Object');
      expect(resultData.description).toBe('A detailed business object for testing');
      expect(resultData.parameters).toHaveLength(1);
      expect(resultData.parameters[0].name).toBe('data');
    });
  });
});