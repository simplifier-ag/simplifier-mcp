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
    it('should register business object details resource with correct parameters', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledWith(
        'businessobject-details',
        expect.any(Object), // ResourceTemplate
        {
          title: 'Business Object Details',
          mimeType: 'application/json',
          description: '#Get details on a particular server side Business Object',
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
          description: `
# Get details on a Function of a Server Side Business Object

Use this template resource in order to access 
* Metadata
* Input and Output Parameters
* Source Code
`,
        },
        expect.any(Function)
      );
    });

    it('should register all two resources', () => {
      registerServerBusinessObjectResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(2);
    });

    // Note: The business object list handler tests were removed since the businessobject-list resource no longer exists in the refactor

    describe('business object details handler', () => {
      let detailsResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        detailsResourceHandler = mockServer.resource.mock.calls[0][3]; // First resource (details)
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
        const mockBusinessObject: SimplifierBusinessObjectDetails = {
          name: 'My Business Object',
          description: 'Detailed business object for testing',
          dependencies: [{
            refType: 'businessobject',
            name: 'dataProcessor'
          }],
          functionNames: ['processData', 'validateInput'],
          editable: true,
          deletable: false,
          tags: ['production', 'critical'],
          assignedProperties: {
            projectsBefore: [],
            projectsAfter: ['finalProject']
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

    describe('business object function handler', () => {
      let functionResourceHandler: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        functionResourceHandler = mockServer.resource.mock.calls[1][3]; // Second resource (function)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://businessobjects/TestObject/functions/testFunction');
        const variables = { objectName: 'TestObject', functionName: 'testFunction' };
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await functionResourceHandler(testUri, variables, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should call getServerBusinessObjectFunction through the wrapper', async () => {
        const testUri = new URL('simplifier://businessobjects/MyBusinessObject/functions/myFunction');
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
        const testUri = new URL('simplifier://businessobjects/NonExistentObject/functions/nonExistentFunction');
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
    // Note: The first two integration tests were removed since they tested the businessobject-list resource that no longer exists

    it('should handle business object details retrieval', async () => {
      const testUri = new URL('simplifier://businessobjects/DetailedObject');
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
        assignedProperties: {
          projectsBefore: ['dataSetup', 'validation'],
          projectsAfter: ['reporting', 'audit']
        }
      };

      mockClient.getServerBusinessObjectDetails.mockResolvedValue(detailedBusinessObject);

      registerServerBusinessObjectResources(mockServer, mockClient);
      const detailsResourceHandler = mockServer.resource.mock.calls[0][3];

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
    });

    it('should handle business object function details retrieval', async () => {
      const testUri = new URL('simplifier://businessobjects/FunctionObject/functions/processData');
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
      const functionResourceHandler = mockServer.resource.mock.calls[1][3];

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

  describe('template resource list callbacks', () => {
    describe('business object details list callback', () => {
      let detailsResourceTemplate: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        detailsResourceTemplate = mockServer.resource.mock.calls[0][1]; // First resource (details) template
      });

      it('should return list of business objects for discovery', async () => {
        const mockBusinessObjects: SimplifierBusinessObjectDetails[] = [
          {
            name: 'UserManager',
            description: 'Manages user accounts',
            dependencies: [{ refType: 'connector', name: 'database' }],
            functionNames: ['createUser', 'deleteUser'],
            editable: true,
            deletable: true,
            tags: ['user', 'management'],
            assignedProperties: { projectsBefore: [], projectsAfter: [] }
          },
          {
            name: 'OrderProcessor',
            description: 'Processes customer orders',
            dependencies: [{ refType: 'plugin', name: 'payment' }],
            functionNames: ['processOrder', 'cancelOrder'],
            editable: true,
            deletable: false,
            tags: ['order', 'ecommerce'],
            assignedProperties: { projectsBefore: ['validate'], projectsAfter: ['notify'] }
          }
        ];

        mockClient.getServerBusinessObjects.mockResolvedValue(mockBusinessObjects);

        const result = await detailsResourceTemplate._callbacks.list();

        expect(result.resources).toHaveLength(2);
        expect(result.resources[0]).toEqual({
          uri: 'simplifier://businessobjects/UserManager',
          name: 'UserManager',
          title: 'Business Object: UserManager',
          description: 'Manages user accounts',
          mimeType: 'application/json'
        });
        expect(result.resources[1]).toEqual({
          uri: 'simplifier://businessobjects/OrderProcessor',
          name: 'OrderProcessor',
          title: 'Business Object: OrderProcessor',
          description: 'Processes customer orders',
          mimeType: 'application/json'
        });
      });

      it('should handle errors gracefully in list callback', async () => {
        mockClient.getServerBusinessObjects.mockRejectedValue(new Error('API Error'));

        const result = await detailsResourceTemplate._callbacks.list();

        expect(result.resources).toEqual([]);
      });
    });

    describe('business object function list callback', () => {
      let functionResourceTemplate: any;

      beforeEach(() => {
        registerServerBusinessObjectResources(mockServer, mockClient);
        functionResourceTemplate = mockServer.resource.mock.calls[1][1]; // Second resource (function) template
      });

      it('should return list of all business object functions for discovery', async () => {
        const mockBusinessObjects: SimplifierBusinessObjectDetails[] = [
          {
            name: 'UserManager',
            description: 'Manages user accounts',
            dependencies: [{ refType: 'connector', name: 'database' }],
            functionNames: ['createUser', 'deleteUser'],
            editable: true,
            deletable: true,
            tags: ['user', 'management'],
            assignedProperties: { projectsBefore: [], projectsAfter: [] }
          },
          {
            name: 'OrderProcessor',
            description: 'Processes customer orders',
            dependencies: [{ refType: 'plugin', name: 'payment' }],
            functionNames: ['processOrder'],
            editable: true,
            deletable: false,
            tags: ['order', 'ecommerce'],
            assignedProperties: { projectsBefore: ['validate'], projectsAfter: ['notify'] }
          }
        ];

        mockClient.getServerBusinessObjects.mockResolvedValue(mockBusinessObjects);

        const result = await functionResourceTemplate._callbacks.list();

        expect(result.resources).toHaveLength(3);
        expect(result.resources[0]).toEqual({
          uri: 'simplifier://businessobjects/UserManager/functions/createUser',
          name: 'UserManager.createUser',
          title: 'Function: createUser (UserManager)',
          description: 'Function createUser of business object UserManager',
          mimeType: 'application/json'
        });
        expect(result.resources[1]).toEqual({
          uri: 'simplifier://businessobjects/UserManager/functions/deleteUser',
          name: 'UserManager.deleteUser',
          title: 'Function: deleteUser (UserManager)',
          description: 'Function deleteUser of business object UserManager',
          mimeType: 'application/json'
        });
        expect(result.resources[2]).toEqual({
          uri: 'simplifier://businessobjects/OrderProcessor/functions/processOrder',
          name: 'OrderProcessor.processOrder',
          title: 'Function: processOrder (OrderProcessor)',
          description: 'Function processOrder of business object OrderProcessor',
          mimeType: 'application/json'
        });
      });

      it('should handle business objects with no functions', async () => {
        const mockBusinessObjects: SimplifierBusinessObjectDetails[] = [
          {
            name: 'EmptyBO',
            description: 'Business object with no functions',
            dependencies: [],
            functionNames: [],
            editable: true,
            deletable: true,
            tags: [],
            assignedProperties: { projectsBefore: [], projectsAfter: [] }
          }
        ];

        mockClient.getServerBusinessObjects.mockResolvedValue(mockBusinessObjects);

        const result = await functionResourceTemplate._callbacks.list();

        expect(result.resources).toEqual([]);
      });

      it('should handle errors gracefully in function list callback', async () => {
        mockClient.getServerBusinessObjects.mockRejectedValue(new Error('API Error'));

        const result = await functionResourceTemplate._callbacks.list();

        expect(result.resources).toEqual([]);
      });
    });
  });
});