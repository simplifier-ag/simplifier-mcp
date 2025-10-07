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

  describe('listConnectors', () => {
    it('should call listConnectors endpoint', async () => {
      const mockResponse = {
        connectors: [
          {
            name: 'TestConnector',
            description: 'A test connector',
            connectorType: {
              technicalName: 'REST',
              i18n: 'REST API',
              descriptionI18n: 'REST API Connector'
            },
            active: true,
            timeoutTime: 30000,
            amountOfCalls: 5,
            editable: true,
            deletable: true,
            tags: ['test', 'api'],
            assignedProjects: {
              projectsBefore: ['project1'],
              projectsAfterChange: ['project1', 'project2']
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.listConnectors();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/connectors',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.connectors).toHaveLength(1);
      expect(result.connectors[0].name).toBe('TestConnector');
    });
  });

  describe('getConnector', () => {
    it('should call getConnector endpoint with connector name', async () => {
      const mockResponse = {
        name: 'TestConnector',
        description: 'A test connector',
        connectorType: {
          technicalName: 'REST',
          i18n: 'REST API',
          descriptionI18n: 'REST API Connector'
        },
        active: true,
        timeoutTime: 30000,
        amountOfCalls: 5,
        editable: true,
        deletable: true,
        tags: ['test'],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        },
        configuration: {
          endpoints: [
            {
              endpointName: 'production',
              endpointType: 'REST'
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getConnector('TestConnector');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/connectors/TestConnector',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.name).toBe('TestConnector');
    });

    it('should call getConnector endpoint without endpoint configurations when requested', async () => {
      const mockResponse = {
        name: 'TestConnector',
        description: 'A test connector',
        connectorType: {
          technicalName: 'REST',
          i18n: 'REST API',
          descriptionI18n: 'REST API Connector'
        },
        active: true,
        timeoutTime: 30000,
        amountOfCalls: 5,
        editable: true,
        deletable: true,
        tags: [],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getConnector('TestConnector', false);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/connectors/TestConnector?withEndpointConfigurations=false',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

  });

  describe('listConnectorCalls', () => {
    it('should call listConnectorCalls endpoint with connector name', async () => {
      const mockResponse = {
        connectorCalls: [
          {
            name: 'getData',
            description: 'Fetch data from API',
            validateIn: true,
            validateOut: true,
            editable: true,
            executable: true,
            autoGenerated: false,
            amountOfInputParameters: 2,
            amountOfOutputParameters: 1
          },
          {
            name: 'postData',
            description: 'Send data to API',
            validateIn: true,
            validateOut: false,
            editable: true,
            executable: true,
            autoGenerated: false,
            amountOfInputParameters: 3,
            amountOfOutputParameters: 0
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.listConnectorCalls('TestConnector');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/connectors/TestConnector/calls',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.connectorCalls).toHaveLength(2);
      expect(result.connectorCalls[0].name).toBe('getData');
    });

  });

  describe('getConnectorCall', () => {
    it('should call getConnectorCall endpoint with connector and call names', async () => {
      const mockResponse = {
        name: 'getData',
        description: 'Fetch data from API',
        validateIn: true,
        validateOut: true,
        editable: true,
        executable: true,
        autoGenerated: false,
        async: false,
        connectorName: 'TestConnector',
        connectorCallParameters: [
          {
            name: 'id',
            alias: 'recordId',
            isInput: true,
            dataType: {
              name: 'String',
              category: 'base'
            },
            optional: false,
            position: 0
          },
          {
            name: 'result',
            isInput: false,
            dataType: {
              name: 'DataRecord',
              nameSpace: 'con/TestConnector',
              category: 'struct'
            },
            optional: false,
            position: 0
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getConnectorCall('TestConnector', 'getData');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/connectors/TestConnector/calls/getData',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.connectorCallParameters).toHaveLength(2);
      expect(result.connectorCallParameters[0].name).toBe('id');
    });
  });

  describe('getDataTypeById', () => {
    it('should call getDataTypeById endpoint with fully qualified datatype id (namespace/name)', async () => {
      const mockResponse = {
        id: "B5CEB602A6EEFBAFA6585B64E7D6AAAB03D0D5CD6701BCFE4F0F5EAA712CB884",
        name: "getUser_groups_Struct",
        nameSpace: "bo/SF_User",
        category: "struct",
        description: "auto generated data type",
        isStruct: true,
        fields: [
          {
            name: "description",
            dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
            dtName: "String",
            optional: true,
            description: "auto generated field"
          },
          {
            name: "id",
            dataTypeId: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D",
            dtName: "Integer",
            optional: true,
            description: "auto generated field"
          }
        ],
        properties: [],
        editable: false,
        tags: [],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getDataTypeById('bo/SF_User/getUser_groups_Struct');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/datatypes/bo/SF_User/getUser_groups_Struct?woAutoGen=false&detailLevel=detailed',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.nameSpace).toBe('bo/SF_User');
      expect(result.name).toBe('getUser_groups_Struct');
    });

    it('should call getDataTypeById endpoint with root namespace datatype (no namespace)', async () => {
      const mockResponse = {
        id: "ABC123",
        name: "_ITIZ_B_BUS2038_DATA",
        category: "domain",
        description: "Custom data type in root namespace",
        isStruct: false,
        fields: [],
        properties: [],
        editable: true,
        tags: [],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getDataTypeById('_ITIZ_B_BUS2038_DATA');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.test/UserInterface/api/datatypes/_ITIZ_B_BUS2038_DATA?woAutoGen=false&detailLevel=detailed',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'SimplifierToken': 'test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.name).toBe('_ITIZ_B_BUS2038_DATA');
    });

    it('should handle 404 error when datatype not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Datatype not found'
      } as Response);

      await expect(client.getDataTypeById('nonexistent/datatype'))
        .rejects
        .toThrow("Failed request GET http://some.test/UserInterface/api/datatypes/nonexistent/datatype?woAutoGen=false&detailLevel=detailed: HTTP 404: Not Found");
    });
  });
});