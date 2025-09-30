// Mock config for this test
jest.mock('../../src/config', () => ({
  config: {
    simplifierBaseUrl: 'http://some.test',
    nodeEnv: 'test',
    simplifierToken: 'test-token'
  }
}));

import { SimplifierClient } from '../../src/client/simplifier-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('SimplifierClient', () => {
  let client: SimplifierClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new SimplifierClient();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create client with base URL from config', () => {
      expect(client).toBeInstanceOf(SimplifierClient);
      expect(client.getBaseUrl()).toBe('http://some.test');
    });
  });


  describe('list all server business objects', () => {
    it('should call getBusinessObjects endpoint', async () => {
      const mockResponse = {
        success: true,
        result: [{ id: '1', name: 'Test BO', script: 'return "hello";' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getServerBusinessObjects();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjects/server",
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

  });

  describe('get server business object details', () => {
    it('should call getBusinessObjectDetails endpoint with object name', async () => {
      const mockResponse = {
        success: true,
        result: {
          name: 'Test Business Object',
          description: 'A test business object for API testing',
          dependencies: [{
            refType: 'connector',
            name: 'testApi'
          }],
          functionNames: ['execute', 'validate'],
          editable: true,
          deletable: true,
          tags: ['test', 'api'],
          assignedProjects: {
            projectsBefore: ['init'],
            projectsAfter: ['cleanup']
          }
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getServerBusinessObjectDetails('TestObject');

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjects/server/TestObject",
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

  });

  describe('get server business object function', () => {
    it('should call getBusinessObjectFunction endpoint with object name and function name', async () => {
      const mockResponse = {
        success: true,
        result: {
          businessObjectName: 'TestObject',
          name: 'testFunction',
          description: 'A test function for demonstration',
          validateIn: true,
          validateOut: false,
          inputParameters: [
            {
              name: 'inputParam',
              description: 'Input parameter description',
              alias: 'input',
              dataTypeId: 'string',
              dataType: 'String',
              isOptional: false
            }
          ],
          outputParameters: [
            {
              name: 'outputParam',
              description: 'Output parameter description',
              alias: 'output',
              dataTypeId: 'string',
              dataType: 'String',
              isOptional: false
            }
          ],
          functionType: 'JavaScript',
          code: 'function testFunction(inputParam) { return inputParam.toLowerCase(); }'
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getServerBusinessObjectFunction('TestObject', 'testFunction');

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjects/server/TestObject/functions/testFunction?completions=false&dataTypes=true",
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

  });

  describe('get server business object functions', () => {
    it('should call getBusinessObjectFunctions endpoint with object name', async () => {
      const mockResponse = {
        success: true,
        result: [
          {
            businessObjectName: 'TestObject',
            name: 'function1',
            description: 'First function',
            validateIn: true,
            validateOut: false,
            inputParameters: [],
            outputParameters: [],
            functionType: 'JavaScript',
            code: 'return "function1";'
          },
          {
            businessObjectName: 'TestObject',
            name: 'function2',
            description: 'Second function',
            validateIn: false,
            validateOut: true,
            inputParameters: [],
            outputParameters: [],
            functionType: 'JavaScript',
            code: 'return "function2";'
          }
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getServerBusinessObjectFunctions('TestObject');

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjects/server/TestObject/functions",
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });
  });

  describe('create server business object function', () => {
    it('should call createBusinessObjectFunction endpoint with function data', async () => {
      const functionData = {
        businessObjectName: 'TestObject',
        name: 'newFunction',
        description: 'A new test function',
        validateIn: false,
        validateOut: false,
        inputParameters: [],
        outputParameters: [],
        functionType: 'JavaScript' as const,
        code: 'return "hello world";'
      };

      const mockResponse = {
        success: true,
        result: 'Function created successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.createServerBusinessObjectFunction('TestObject', functionData);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjects/server/TestObject/functions",
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
          body: JSON.stringify(functionData)
        })
      );

      expect(result).toBe("Successfully created function 'newFunction' in Business Object 'TestObject'");
    });
  });

  describe('update server business object function', () => {
    it('should call updateBusinessObjectFunction endpoint with function data', async () => {
      const functionData = {
        businessObjectName: 'TestObject',
        name: 'existingFunction',
        description: 'An updated test function',
        validateIn: true,
        validateOut: true,
        inputParameters: [
          {
            name: 'input',
            description: 'Input parameter',
            alias: 'input',
            dataTypeId: 'string-id',
            dataType: 'String',
            isOptional: false
          }
        ],
        outputParameters: [],
        functionType: 'JavaScript' as const,
        code: 'return input.toUpperCase();'
      };

      const mockResponse = {
        success: true,
        result: 'Function updated successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.updateServerBusinessObjectFunction('TestObject', 'existingFunction', functionData);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjects/server/TestObject/functions/existingFunction",
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
          body: JSON.stringify(functionData)
        })
      );

      expect(result).toBe("Successfully updated function 'existingFunction' in Business Object 'TestObject'");
    });
  });

  describe('test server business object function', () => {
    it('should call testBusinessObjectFunction endpoint with test request', async () => {
      const testRequest = {
        parameters: [
          {
            name: "inputParam",
            value: "test value",
            dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
            optional: false,
            transfer: true
          }
        ]
      };

      const mockResponse = {
        success: true,
        result: { output: "processed test value" }
      };

      // Note: testServerBusinessObjectFunction uses executeRequest directly, not makeRequest
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.testServerBusinessObjectFunction('TestObject', 'testFunction', testRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://some.test/UserInterface/api/businessobjecttest/TestObject/methods/testFunction",
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
          body: JSON.stringify(testRequest)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 error with descriptive message', async () => {
      const testRequest = { parameters: [] };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify(testRequest)
      } as Response);

      await expect(client.testServerBusinessObjectFunction('NonExistentBO', 'nonExistentFunction', testRequest))
        .rejects
        .toThrow("Failed request POST http://some.test/UserInterface/api/businessobjecttest/NonExistentBO/methods/nonExistentFunction: HTTP 404: Not Found");
    });

    it('should handle 400 error with descriptive message', async () => {
      const testRequest = { parameters: [] };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify(testRequest)
      } as Response);

      await expect(client.testServerBusinessObjectFunction('TestBO', 'testFunction', testRequest))
        .rejects
        .toThrow("Failed request POST http://some.test/UserInterface/api/businessobjecttest/TestBO/methods/testFunction: HTTP 400: Bad Request");
    });

    it('should handle 500 error with descriptive message', async () => {
      const testRequest = { parameters: [] };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => JSON.stringify(testRequest)
      } as Response);

      await expect(client.testServerBusinessObjectFunction('TestBO', 'testFunction', testRequest))
        .rejects
        .toThrow("Failed request POST http://some.test/UserInterface/api/businessobjecttest/TestBO/methods/testFunction: HTTP 500: Internal Server Error");
    });

    it('should handle function execution that returns success false', async () => {
      const testRequest = { parameters: [] };

      const mockResponse = {
        success: false,
        error: "Function execution failed: missing required parameter"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await expect(client.testServerBusinessObjectFunction('TestBO', 'testFunction', testRequest))
        .rejects
        .toThrow("Received error: Function execution failed: missing required parameter");
    });
  });
});