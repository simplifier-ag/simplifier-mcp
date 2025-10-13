import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerConnectorTools } from "../../src/tools/connector-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { ConnectorTestRequest, ConnectorTestResponse } from "../../src/client/types.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe('registerConnectorTools', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    // Create a mock McpServer
    mockServer = {
      tool: jest.fn()
    } as any;

    // Create a mock SimplifierClient
    mockSimplifierClient = {
      testConnectorCall: jest.fn()
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register connector-call-test tool', () => {
      registerConnectorTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(1);

      // Check tool registration
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

    it('should validate required schema fields', () => {
      registerConnectorTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
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

      const toolCall = mockServer.tool.mock.calls[0];
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

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that parameters can be undefined and defaults to empty array
      expect(() => schema.parameters.parse(undefined)).not.toThrow();
      expect(schema.parameters.parse(undefined)).toEqual([]);
    });
  });

  describe('tool handler - test connector call', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerConnectorTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
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
        expect(result.result).toEqual({ processedText: "HELLO WORLD", repeatCount: 5 });
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
          result: { output: "processed test" },
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

  describe('schema validation', () => {
    it('should validate parameter structure', () => {
      registerConnectorTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
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

      const toolCall = mockServer.tool.mock.calls[0];
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
});
