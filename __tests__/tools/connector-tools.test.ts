import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerConnectorTools } from "../../src/tools/connector-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SimplifierConnectorDetails, SimplifierConnectorUpdate, ConnectorTestRequest, ConnectorTestResponse } from "../../src/client/types.js";
import { readFile } from "../../src/resourceprovider.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

// Mock the resourceprovider
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: jest.fn()
}));

describe('registerConnectorTools', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    // Create a mock McpServer
    mockServer = {
      tool: jest.fn()
    } as any;

    // Create a mock SimplifierClient
    mockSimplifierClient = {
      getConnector: jest.fn(),
      createConnector: jest.fn(),
      updateConnector: jest.fn(),
      updateConnectorCall: jest.fn(),
      testConnectorCall: jest.fn()
    } as any;

    // Get the mocked functions
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

    // Setup default mock for readFile
    mockReadFile.mockReturnValue("This is the connector documentation content");

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register both connector-update and connector-call-test tools', () => {
      registerConnectorTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(3);

      // Check that readFile was called with the correct path
      expect(mockReadFile).toHaveBeenCalledWith("tools/docs/create-or-update-connector.md");

      // Check the connector-update tool registration
      expect(mockServer.tool).toHaveBeenCalledWith(
        "connector-update",
        "This is the connector documentation content",
        expect.objectContaining({
          name: expect.any(Object),
          description: expect.any(Object),
          tags: expect.any(Object),
          projectsBefore: expect.any(Object),
          projectsAfterChange: expect.any(Object),
          connectorType: expect.any(Object),
          active: expect.any(Object),
          endpointConfiguration: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Create or update a Connector",
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true
        }),
        expect.any(Function)
      );

      // Check connector-call-test tool registration
      expect(mockServer.tool).toHaveBeenCalledWith(
        "connector-call-test",
        expect.any(String),
        expect.objectContaining({
          connectorName: expect.any(Object),
          callName: expect.any(Object),
          parameters: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Test a Connector Call",
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }),
        expect.any(Function)
      );
    });
  });

  describe('connector-update tool', () => {
    describe('schema validation', () => {
      it('should validate required schema fields', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[0];
        const schema = toolCall[2];

        // Test that schema validates required fields
        expect(schema.name).toBeDefined();
        expect(schema.description).toBeDefined();
        expect(schema.tags).toBeDefined();
        expect(schema.projectsBefore).toBeDefined();
        expect(schema.projectsAfterChange).toBeDefined();
        expect(schema.connectorType).toBeDefined();
        expect(schema.active).toBeDefined();
        expect(schema.endpointConfiguration).toBeDefined();

        // Test valid data passes validation - each field individually
        const validName = "TestConnector";
        const validDescription = "Test connector description";
        const validTags = ["test", "connector"];
        const validProjectsBefore = ["Project1"];
        const validProjectsAfterChange = ["Project1", "Project2"];
        const validConnectorType = "REST";
        const validActive = true;
        const validEndpointConfiguration = {
          endpoint: "https://api.example.com",
          certificates: [],
          configuration: {},
          loginMethodName: "basicAuth"
        };

        expect(() => schema.name.parse(validName)).not.toThrow();
        expect(() => schema.description.parse(validDescription)).not.toThrow();
        expect(() => schema.tags.parse(validTags)).not.toThrow();
        expect(() => schema.projectsBefore.parse(validProjectsBefore)).not.toThrow();
        expect(() => schema.projectsAfterChange.parse(validProjectsAfterChange)).not.toThrow();
        expect(() => schema.connectorType.parse(validConnectorType)).not.toThrow();
        expect(() => schema.active.parse(validActive)).not.toThrow();
        expect(() => schema.endpointConfiguration.parse(validEndpointConfiguration)).not.toThrow();
      });

      it('should validate that name and connectorType are required', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[0];
        const schema = toolCall[2];

        // Test that valid string passes
        expect(() => schema.name.parse("ValidName")).not.toThrow();
        expect(() => schema.connectorType.parse("REST")).not.toThrow();

        // Test that undefined fails validation for required fields
        expect(() => schema.name.parse(undefined)).toThrow();
        expect(() => schema.connectorType.parse(undefined)).toThrow();

        // Test that null fails validation
        expect(() => schema.name.parse(null)).toThrow();
        expect(() => schema.connectorType.parse(null)).toThrow();
      });

      it('should allow optional fields to be omitted with defaults', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[0];
        const schema = toolCall[2];

        // Test that optional fields can be undefined and get defaults
        expect(() => schema.description.parse(undefined)).not.toThrow();
        expect(() => schema.tags.parse(undefined)).not.toThrow();
        expect(() => schema.projectsBefore.parse(undefined)).not.toThrow();
        expect(() => schema.projectsAfterChange.parse(undefined)).not.toThrow();
        expect(() => schema.active.parse(undefined)).not.toThrow();

        // Test default values are applied
        expect(schema.description.parse(undefined)).toBe("");
        expect(schema.tags.parse(undefined)).toEqual([]);
        expect(schema.projectsBefore.parse(undefined)).toEqual([]);
        expect(schema.projectsAfterChange.parse(undefined)).toEqual([]);
        expect(schema.active.parse(undefined)).toBe(true);
      });

      it('should validate endpointConfiguration structure', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[0];
        const schema = toolCall[2];

        // Valid endpoint configuration
        const validConfig = {
          endpoint: "https://api.example.com",
          certificates: ["cert1", "cert2"],
          configuration: { key: "value" },
          loginMethodName: "oauth2"
        };

        expect(() => schema.endpointConfiguration.parse(validConfig)).not.toThrow();

        // Minimal valid configuration (only required fields)
        const minimalConfig = {
          endpoint: "https://api.example.com",
          certificates: []
        };

        expect(() => schema.endpointConfiguration.parse(minimalConfig)).not.toThrow();

        // Invalid configuration (missing required endpoint)
        const invalidConfig = {
          certificates: []
        };

        expect(() => schema.endpointConfiguration.parse(invalidConfig)).toThrow();
      });
    });

    describe('tool handler - create new connector', () => {
      let toolHandler: Function;

      beforeEach(() => {
        registerConnectorTools(mockServer, mockSimplifierClient);
        toolHandler = mockServer.tool.mock.calls[0][4];
      });

      it('should create a new connector when it does not exist', async () => {
        const testParams = {
          name: "NewConnector",
          description: "New connector description",
          connectorType: "REST",
          active: true,
          endpointConfiguration: {
            endpoint: "https://api.example.com",
            certificates: [],
            configuration: {
              specificConfig1: "TEST",
              specificConfig2: "TEST"
            },
            loginMethodName: "basicAuth"
          },
          tags: ["new", "test"],
          projectsBefore: [],
          projectsAfterChange: ["Project1"]
        };

        const expectedData: SimplifierConnectorUpdate = {
          name: "NewConnector",
          description: "New connector description",
          connectorType: "REST",
          active: true,
          endpointConfiguration: {
            endpoint: "https://api.example.com",
            certificates: [],
            configuration: {
              specificConfig1: "TEST",
              specificConfig2: "TEST"
            },
            loginMethodName: "basicAuth"
          },
          tags: ["new", "test"],
          assignedProjects: {
            projectsBefore: [],
            projectsAfterChange: ["Project1"]
          },
          timeoutTime: 0  // Will be added by the actual implementation if needed
        };

        const expectedResponse = "Connector created successfully";

        // Mock that connector doesn't exist (throws error)
        mockSimplifierClient.getConnector.mockRejectedValue(
          new Error("Not found")
        );

        // Mock successful creation
        mockSimplifierClient.createConnector.mockResolvedValue(expectedResponse);

        // Mock wrapToolResult to call the function and return result
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.getConnector).toHaveBeenCalledWith("NewConnector");
        expect(mockSimplifierClient.createConnector).toHaveBeenCalledWith(expect.objectContaining({
          name: expectedData.name,
          description: expectedData.description,
          connectorType: expectedData.connectorType,
          active: expectedData.active,
          endpointConfiguration: expectedData.endpointConfiguration,
          tags: expectedData.tags,
          assignedProjects: expectedData.assignedProjects
        }));
        expect(mockSimplifierClient.updateConnector).not.toHaveBeenCalled();
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "create or update Connector NewConnector",
          expect.any(Function)
        );
      });

      it('should update existing connector when it exists', async () => {
        const testParams = {
          name: "ExistingConnector",
          description: "Updated connector description",
          connectorType: "SOAP",
          active: false,
          endpointConfiguration: {
            endpoint: "https://api.updated.com",
            certificates: ["cert1"],
            configuration: { timeout: 5000 }
          },
          tags: ["updated"],
          projectsBefore: ["Project1"],
          projectsAfterChange: ["Project1", "Project2"]
        };

        const existingConnector: SimplifierConnectorDetails = {
          name: "ExistingConnector",
          description: "Old description",
          connectorType: {
            technicalName: "REST",
            i18n: "REST Connector",
            descriptionI18n: "REST API Connector"
          },
          active: true,
          timeoutTime: 30000,
          amountOfCalls: 10,
          editable: true,
          deletable: true,
          tags: ["old"],
          assignedProjects: {
            projectsBefore: ["Project1"],
            projectsAfterChange: ["Project1"]
          },
          configuration: {
            endpoints: [{
              endpoint: "https://api.old.com",
              certificates: [],
              configuration: {}
            }]
          }
        };

        const expectedResponse = "Connector updated successfully";

        // Mock that connector exists
        mockSimplifierClient.getConnector.mockResolvedValue(existingConnector);

        // Mock successful update
        mockSimplifierClient.updateConnector.mockResolvedValue(expectedResponse);

        // Mock wrapToolResult
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.getConnector).toHaveBeenCalledWith("ExistingConnector");
        expect(mockSimplifierClient.updateConnector).toHaveBeenCalledWith(expect.objectContaining({
          name: "ExistingConnector",
          description: "Updated connector description",
          connectorType: "SOAP",
          active: false,
          endpointConfiguration: testParams.endpointConfiguration,
          tags: ["updated"],
          assignedProjects: {
            projectsBefore: ["Project1"],
            projectsAfterChange: ["Project1", "Project2"]
          }
        }));
        expect(mockSimplifierClient.createConnector).not.toHaveBeenCalled();
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "create or update Connector ExistingConnector",
          expect.any(Function)
        );
      });

      it('should handle errors gracefully', async () => {
        const testParams = {
          name: "ErrorConnector",
          description: "Test error handling",
          connectorType: "REST",
          active: true,
          endpointConfiguration: {
            endpoint: "https://api.error.com",
            certificates: []
          },
          tags: [],
          projectsBefore: [],
          projectsAfterChange: []
        };

        const errorMessage = "API Error: Unable to create connector";

        // Mock that connector doesn't exist
        mockSimplifierClient.getConnector.mockRejectedValue(new Error("Not found"));

        // Mock creation failure
        mockSimplifierClient.createConnector.mockRejectedValue(new Error(errorMessage));

        // Mock wrapToolResult to catch and handle errors
        mockWrapToolResult.mockImplementation(async (caption, fn) => {
          try {
            const result = await fn();
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: `Tool ${caption} failed: ${error}` })
              }],
              isError: true
            };
          }
        });

        const result = await toolHandler(testParams);

        expect(mockSimplifierClient.getConnector).toHaveBeenCalledWith("ErrorConnector");
        expect(mockSimplifierClient.createConnector).toHaveBeenCalledWith(expect.any(Object));
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("failed");
      });

      it('should handle complex endpoint configurations', async () => {
        const testParams = {
          name: "ComplexConnector",
          description: "Complex configuration test",
          connectorType: "OAUTH2",
          active: true,
          endpointConfiguration: {
            endpoint: "https://oauth.example.com",
            certificates: ["cert1", "cert2", "cert3"],
            configuration: {
              clientId: "test-client-id",
              clientSecret: "test-secret",
              scope: "read write",
              grantType: "authorization_code",
              redirectUri: "https://callback.example.com"
            },
            loginMethodName: "oauth2Login"
          },
          tags: ["oauth", "complex", "secure"],
          projectsBefore: ["ProjectA", "ProjectB"],
          projectsAfterChange: ["ProjectA", "ProjectC", "ProjectD"]
        };

        // Mock that connector doesn't exist
        mockSimplifierClient.getConnector.mockRejectedValue(new Error("Not found"));

        // Mock successful creation
        mockSimplifierClient.createConnector.mockResolvedValue("Complex connector created");

        // Mock wrapToolResult
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.createConnector).toHaveBeenCalledWith(
          expect.objectContaining({
            endpointConfiguration: testParams.endpointConfiguration
          })
        );
      });
    });

    describe('tool handler - correct create/update logic', () => {
      let toolHandler: Function;

      beforeEach(() => {
        registerConnectorTools(mockServer, mockSimplifierClient);
        toolHandler = mockServer.tool.mock.calls[0][4];
      });

      it('should correctly handle create and update operations', async () => {
        // This test verifies that the create/update logic works correctly:
        // When connector exists, it should call updateConnector
        // When connector doesn't exist, it should call createConnector

        const testParams = {
          name: "TestConnector",
          description: "Testing correct logic",
          connectorType: "REST",
          active: true,
          endpointConfiguration: {
            endpoint: "https://test.com",
            certificates: []
          },
          tags: [],
          projectsBefore: [],
          projectsAfterChange: []
        };

        // Case 1: Connector exists - should call updateConnector
        const existingConnector = {
          name: "TestConnector",
          description: "Existing",
          connectorType: { technicalName: "REST", i18n: "REST", descriptionI18n: "REST" },
          active: true,
          timeoutTime: 30000,
          amountOfCalls: 0,
          editable: true,
          deletable: true,
          tags: [],
          assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
        };

        mockSimplifierClient.getConnector.mockResolvedValue(existingConnector);
        mockSimplifierClient.updateConnector.mockResolvedValue("Updated");
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        });

        await toolHandler(testParams);

        // Should correctly call updateConnector when connector exists
        expect(mockSimplifierClient.updateConnector).toHaveBeenCalled();
        expect(mockSimplifierClient.createConnector).not.toHaveBeenCalled();

        // Reset mocks
        jest.clearAllMocks();

        // Case 2: Connector doesn't exist - should call createConnector
        mockSimplifierClient.getConnector.mockRejectedValue(new Error("Not found"));
        mockSimplifierClient.createConnector.mockResolvedValue("Created");

        await toolHandler(testParams);

        // Should correctly call createConnector when connector doesn't exist
        expect(mockSimplifierClient.createConnector).toHaveBeenCalled();
        expect(mockSimplifierClient.updateConnector).not.toHaveBeenCalled();
      });
    });
  });

  describe('connector-call-test tool', () => {
    describe('schema validation', () => {
      it('should validate required schema fields', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[2];
        const schema = toolCall[2];

        // Test that schema validates required fields
        expect(schema.connectorName).toBeDefined();
        expect(schema.callName).toBeDefined();
        expect(schema.parameters).toBeDefined();

        // Test valid data passes validation
        expect(() => schema.connectorName.parse("TestConnector")).not.toThrow();
        expect(() => schema.callName.parse("testCall")).not.toThrow();
        expect(() => schema.parameters.parse([{ name: "param1", value: "test" }])).not.toThrow();
      });

      it('should validate that connectorName and callName are required', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[2];
        const schema = toolCall[2];

        // Test that valid strings pass
        expect(() => schema.connectorName.parse("ValidConnector")).not.toThrow();
        expect(() => schema.callName.parse("validCall")).not.toThrow();

        // Test that undefined fails validation
        expect(() => schema.connectorName.parse(undefined)).toThrow();
        expect(() => schema.callName.parse(undefined)).toThrow();

        // Test that null fails validation
        expect(() => schema.connectorName.parse(null)).toThrow();
        expect(() => schema.callName.parse(null)).toThrow();
      });

      it('should allow parameters to be optional with empty array default', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[2];
        const schema = toolCall[2];

        // Test that parameters can be undefined and defaults to empty array
        expect(() => schema.parameters.parse(undefined)).not.toThrow();
        expect(schema.parameters.parse(undefined)).toEqual([]);
      });

      it('should validate parameter structure', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[2];
        const schema = toolCall[2];

        // Test valid parameter structure
        const validParameters = [
          { name: "param1", value: "value1" },
          { name: "param2", value: 123 }
        ];
        expect(() => schema.parameters.parse(validParameters)).not.toThrow();

        // Test that parameters require a name
        const invalidParameters = [
          { value: "value1" } // Missing name
        ];
        expect(() => schema.parameters.parse(invalidParameters)).toThrow();
      });

      it('should allow any value type in parameters', () => {
        registerConnectorTools(mockServer, mockSimplifierClient);

        const toolCall = mockServer.tool.mock.calls[2];
        const schema = toolCall[2];

        const parametersWithVariousValues = [
          { name: "string", value: "text" },
          { name: "number", value: 42 },
          { name: "boolean", value: false },
          { name: "null", value: null },
          { name: "undefined", value: undefined },
          { name: "object", value: { nested: "object" } },
          { name: "array", value: [1, 2, 3] }
        ];

        expect(() => schema.parameters.parse(parametersWithVariousValues)).not.toThrow();
      });
    });

    describe('tool handler - test connector call', () => {
      let toolHandler: Function;

      beforeEach(() => {
        registerConnectorTools(mockServer, mockSimplifierClient);
        toolHandler = mockServer.tool.mock.calls[2][4];
      });

      it('should test connector call successfully with no parameters', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "simpleCall",
          parameters: []
        };

        const expectedTestRequest: ConnectorTestRequest = {
          parameters: []
        };

        const mockResponse: ConnectorTestResponse = {
          success: true,
          result: { result: { message: "Success" } }
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.testConnectorCall).toHaveBeenCalledWith(
          "TestConnector",
          "simpleCall",
          expectedTestRequest
        );
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "test connector call TestConnector.simpleCall",
          expect.any(Function)
        );
      });

      it('should test connector call successfully with parameters', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "processData",
          parameters: [
            { name: "inputText", value: "Hello World" },
            { name: "count", value: 5 },
            { name: "enabled", value: true }
          ]
        };

        const expectedTestRequest: ConnectorTestRequest = {
          parameters: [
            { name: "inputText", value: "Hello World" },
            { name: "count", value: 5 },
            { name: "enabled", value: true }
          ]
        };

        const mockResponse: ConnectorTestResponse = {
          success: true,
          result: { result: { processedText: "HELLO WORLD", repeatCount: 5 } }
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result.success).toBe(true);
          expect(result.result).toEqual({ result: { processedText: "HELLO WORLD", repeatCount: 5 } });
          expect(result.executedWith).toEqual({
            connector: "TestConnector",
            call: "processData",
            parameters: expectedTestRequest.parameters
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.testConnectorCall).toHaveBeenCalledWith(
          "TestConnector",
          "processData",
          expectedTestRequest
        );
      });

      it('should handle various parameter value types', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "multiTypeCall",
          parameters: [
            { name: "stringParam", value: "text" },
            { name: "numberParam", value: 42 },
            { name: "floatParam", value: 3.14 },
            { name: "booleanParam", value: true },
            { name: "objectParam", value: { key: "value", nested: { data: "test" } } },
            { name: "arrayParam", value: [1, 2, 3] },
            { name: "nullParam", value: null }
          ]
        };

        const mockResponse: ConnectorTestResponse = {
          success: true,
          result: { result: { status: "processed" } }
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.testConnectorCall).toHaveBeenCalledWith(
          "TestConnector",
          "multiTypeCall",
          expect.objectContaining({
            parameters: testParams.parameters
          })
        );
      });

      it('should handle connector call execution failure', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "failingCall",
          parameters: []
        };

        const mockResponse: ConnectorTestResponse = {
          success: false,
          error: "Connector call failed: Connection timeout"
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result.success).toBe(false);
          expect(result.error).toBe("Connector call failed: Connection timeout");
          expect(result.executedWith).toEqual({
            connector: "TestConnector",
            call: "failingCall",
            parameters: []
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);

        expect(mockSimplifierClient.testConnectorCall).toHaveBeenCalledWith(
          "TestConnector",
          "failingCall",
          { parameters: [] }
        );
      });

      it('should handle connector call with message field on failure', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "failingCall",
          parameters: []
        };

        const mockResponse: ConnectorTestResponse = {
          success: false,
          message: "Invalid parameters provided"
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result.success).toBe(false);
          expect(result.error).toBe("Invalid parameters provided");
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);
      });

      it('should handle connector call with neither error nor message on failure', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "failingCall",
          parameters: []
        };

        const mockResponse: ConnectorTestResponse = {
          success: false
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result.success).toBe(false);
          expect(result.error).toBe("Unknown error");
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);
      });

      it('should handle client errors (404, 400, 500)', async () => {
        const testParams = {
          connectorName: "NonExistentConnector",
          callName: "nonExistentCall",
          parameters: []
        };

        mockSimplifierClient.testConnectorCall.mockRejectedValue(
          new Error("Connector 'NonExistentConnector' or call 'nonExistentCall' not found")
        );

        mockWrapToolResult.mockImplementation(async (caption, fn) => {
          try {
            await fn();
            return { content: [{ type: "text", text: "Success" }] };
          } catch (error) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: `Tool ${caption} failed: ${error}` })
              }]
            };
          }
        });

        await toolHandler(testParams);

        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "test connector call NonExistentConnector.nonExistentCall",
          expect.any(Function)
        );
      });

      it('should format successful response correctly', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "successCall",
          parameters: [{ name: "input", value: "test" }]
        };

        const mockResponse: ConnectorTestResponse = {
          success: true,
          result: { result: { output: "processed test" } }
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result).toEqual({
            success: true,
            message: "Connector call 'successCall' executed successfully",
            result: {result: {output: "processed test"}},
            executedWith: {
              connector: "TestConnector",
              call: "successCall",
              parameters: [{ name: "input", value: "test" }]
            }
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);
      });

      it('should format failure response correctly', async () => {
        const testParams = {
          connectorName: "TestConnector",
          callName: "failCall",
          parameters: []
        };

        const mockResponse: ConnectorTestResponse = {
          success: false,
          error: "Execution error"
        };

        mockSimplifierClient.testConnectorCall.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result).toEqual({
            success: false,
            message: "Connector call 'failCall' execution failed",
            error: "Execution error",
            executedWith: {
              connector: "TestConnector",
              call: "failCall",
              parameters: []
            }
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await toolHandler(testParams);
      });
    });
  });
});
