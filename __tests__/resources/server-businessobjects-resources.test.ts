import { registerServerBusinessObjectResources } from '../../src/resources/server-businessobject-resources';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SimplifierBusinessObjectDetails } from '../../src/client/types';

// Mock the resourcesresult wrapper
jest.mock('../../src/resources/resourcesresult', () => ({
  wrapResourceResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('Server Business Objects Resources', () => {
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
      getServerBusinessObjectFunction: jest.fn(),
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
        'simplifier://businessobjects',
        {
          title: 'List Business Objects',
          mimeType: 'application/json',
          description: expect.any(String),
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
          description: expect.any(String),
        },
        expect.any(Function)
      );
    });

    it('should register business object function resource with correct parameters', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledWith(
        'businessobject-function',
        expect.any(Object), // ResourceTemplate
        {
          title: 'Server Business Object Function',
          mimeType: 'application/json',
          description: expect.any(String),
        },
        expect.any(Function)
      );
    });

    it('should register all three resources', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(3);
    });

    describe('business object list handler', () => {
      let listResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        listResourceHandler = mockServer.resource.mock.calls[0][3]; // First resource (list)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://businessobjects');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await listResourceHandler(testUri, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(testUri, expect.any(Function));
      });

      it('should return simplified business object list', async () => {
        const testUri = new URL('simplifier://businessobjects');
        const mockBusinessObjects = [
          {
            name: 'TestObject1',
            description: 'First test object',
            dependencies: [],
            functionNames: ['func1'],
            editable: true,
            deletable: true,
            tags: [],
            assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
          },
          {
            name: 'TestObject2',
            description: 'Second test object',
            dependencies: [],
            functionNames: ['func2'],
            editable: true,
            deletable: false,
            tags: [],
            assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
          }
        ];

        mockClient.getServerBusinessObjects.mockResolvedValue(mockBusinessObjects);

        // Mock wrapResourceResult to call the inner function and return the result
        mockWrapResourceResult.mockImplementation(async (_uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        });

        const result = await listResourceHandler(testUri, createMockExtra());

        expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();

        // Parse the result to verify the transformed data
        const resultData = JSON.parse(result.contents[0].text);
        expect(resultData).toHaveLength(2);
        expect(resultData[0]).toEqual({
          name: 'TestObject1',
          uri: 'simplifier://businessobject/TestObject1'
        });
        expect(resultData[1]).toEqual({
          name: 'TestObject2',
          uri: 'simplifier://businessobject/TestObject2'
        });
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://businessobjects');
        mockClient.getServerBusinessObjects.mockRejectedValue(new Error('API Error'));

        // Mock wrapResourceResult to call the inner function even when it throws
        mockWrapResourceResult.mockImplementation(async (_uri: URL, fn: () => any) => {
          try {
            await fn();
          } catch (error) {
            // The wrapResourceResult should handle the error
          }
          return {
            contents: [{ type: 'text', text: 'Could not get data!' }]
          };
        });

        const result = await listResourceHandler(testUri, createMockExtra());

        expect(mockClient.getServerBusinessObjects).toHaveBeenCalled();
        expect(result.contents[0].text).toBe('Could not get data!');
      });
    });

    describe('business object details handler', () => {
      let detailsResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        detailsResourceHandler = mockServer.resource.mock.calls[1][3]; // Second resource (details)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://businessobject/TestObject');
        const variables = { objectName: 'TestObject' };
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await detailsResourceHandler(testUri, variables, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should call getServerBusinessObjectDetails through the wrapper', async () => {
        const testUri = new URL('simplifier://businessobject/MyBusinessObject');
        const variables = { objectName: 'MyBusinessObject' };
        const mockBusinessObject: SimplifierBusinessObjectDetails = {
          name: 'My Business Object',
          description: 'Detailed business object for testing',
          dependencies: [{
            refType: 'serverbusinessobject',
            name: 'dataProcessor'
          }],
          functionNames: ['processData', 'validateInput'],
          editable: true,
          deletable: false,
          tags: ['production', 'critical'],
          assignedProjects: {
            projectsBefore: [],
            projectsAfterChange: ['finalProject']
          }
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

        // Parse and verify the result includes the functions array
        const resultData = JSON.parse(result.contents[0].text);
        expect(resultData.name).toBe('My Business Object');
        expect(resultData.functions).toEqual([
          'simplifier://businessobject/MyBusinessObject/function/processData',
          'simplifier://businessobject/MyBusinessObject/function/validateInput'
        ]);
        expect(result.contents[0].mimeType).toBe('application/json');
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://businessobject/NonExistentObject');
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

    describe('business object function handler', () => {
      let functionResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        functionResourceHandler = mockServer.resource.mock.calls[2][3]; // Third resource (function)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://businessobject/TestObject/function/testFunction');
        const variables = { objectName: 'TestObject', functionName: 'testFunction' };
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await functionResourceHandler(testUri, variables, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should call getServerBusinessObjectFunction through the wrapper', async () => {
        const testUri = new URL('simplifier://businessobject/MyBusinessObject/function/myFunction');
        const variables = { objectName: 'MyBusinessObject', functionName: 'myFunction' };
        const mockBusinessObjectFunction = {
          businessObjectName: 'MyBusinessObject',
          name: 'myFunction',
          description: 'A test function that processes data',
          validateIn: true,
          validateOut: false,
          inputParameters: [
            {
              name: 'inputData',
              description: 'The data to process',
              alias: 'data',
              dataTypeId: 'string',
              dataType: 'String',
              isOptional: false
            }
          ],
          outputParameters: [
            {
              name: 'result',
              description: 'The processed result',
              alias: 'output',
              dataTypeId: 'string',
              dataType: 'String',
              isOptional: false
            }
          ],
          functionType: 'JavaScript' as const,
          code: 'function myFunction(inputData) { return inputData.toUpperCase(); }'
        };

        mockClient.getServerBusinessObjectFunction.mockResolvedValue(mockBusinessObjectFunction);

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

        const result = await functionResourceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getServerBusinessObjectFunction).toHaveBeenCalledWith('MyBusinessObject', 'myFunction');
        expect(result.contents[0].text).toContain('myFunction');
        expect(result.contents[0].text).toContain('JavaScript');
        expect(result.contents[0].mimeType).toBe('application/json');
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://businessobject/NonExistentObject/function/nonExistentFunction');
        const variables = { objectName: 'NonExistentObject', functionName: 'nonExistentFunction' };
        const testError = new Error('Function not found');

        mockClient.getServerBusinessObjectFunction.mockRejectedValue(testError);

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

        const result = await functionResourceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getServerBusinessObjectFunction).toHaveBeenCalledWith('NonExistentObject', 'nonExistentFunction');
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('Function not found');
      });
    });
  });

  describe('integration with real data', () => {

    it('should handle business object details retrieval', async () => {
      const testUri = new URL('simplifier://businessobject/DetailedObject');
      const variables = { objectName: 'DetailedObject' };
      const detailedBusinessObject: SimplifierBusinessObjectDetails = {
        name: 'Detailed Business Object',
        description: 'A detailed business object for comprehensive testing',
        dependencies: [{
          refType: 'connector',
          name: 'dataService'
        }],
        functionNames: ['execute', 'preProcess', 'postProcess'],
        editable: false,
        deletable: false,
        tags: ['detailed', 'integration', 'locked'],
        assignedProjects: {
          projectsBefore: ['dataSetup', 'validation'],
          projectsAfterChange: ['reporting', 'audit']
        }
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
      expect(resultData.description).toBe('A detailed business object for comprehensive testing');
      expect(resultData.functionNames).toHaveLength(3);
      expect(resultData.functionNames[0]).toBe('execute');
      expect(resultData.functions).toEqual([
        'simplifier://businessobject/DetailedObject/function/execute',
        'simplifier://businessobject/DetailedObject/function/preProcess',
        'simplifier://businessobject/DetailedObject/function/postProcess'
      ]);
    });

    it('should handle business object function details retrieval', async () => {
      const testUri = new URL('simplifier://businessobject/FunctionObject/function/processData');
      const variables = { objectName: 'FunctionObject', functionName: 'processData' };
      const functionDetails = {
        businessObjectName: 'FunctionObject',
        name: 'processData',
        description: 'Processes input data and returns formatted output',
        validateIn: true,
        validateOut: true,
        inputParameters: [
          {
            name: 'rawData',
            description: 'The raw data to process',
            alias: 'input',
            dataTypeId: 'object',
            dataType: 'Object',
            isOptional: false
          },
          {
            name: 'options',
            description: 'Processing options',
            alias: 'opts',
            dataTypeId: 'object',
            dataType: 'Object',
            isOptional: true
          }
        ],
        outputParameters: [
          {
            name: 'processedData',
            description: 'The processed data',
            alias: 'output',
            dataTypeId: 'object',
            dataType: 'Object',
            isOptional: false
          }
        ],
        functionType: 'JavaScript' as const,
        code: 'function processData(rawData, options) { return transformData(rawData, options); }'
      };

      mockClient.getServerBusinessObjectFunction.mockResolvedValue(functionDetails);

      registerServerBusinessObjectResources(mockServer, mockClient);
      const functionResourceHandler = mockServer.resource.mock.calls[2][3];

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

      const result = await functionResourceHandler(testUri, variables, createMockExtra());

      expect(mockClient.getServerBusinessObjectFunction).toHaveBeenCalledWith('FunctionObject', 'processData');
      const resultData = JSON.parse(result.contents[0].text as string);
      expect(resultData.name).toBe('processData');
      expect(resultData.description).toBe('Processes input data and returns formatted output');
      expect(resultData.inputParameters).toHaveLength(2);
      expect(resultData.outputParameters).toHaveLength(1);
      expect(resultData.functionType).toBe('JavaScript');
      expect(resultData.code).toContain('transformData');
    });
  });

});
