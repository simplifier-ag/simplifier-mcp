import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerBusinessObjectTools } from "../../src/tools/server-businessobject-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SimplifierBusinessObjectDetails, SimplifierBusinessObjectFunction } from "../../src/client/types.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe('registerServerBusinessObjectResources', () => {
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
      getServerBusinessObjectDetails: jest.fn(),
      updateServerBusinessObject: jest.fn(),
      createServerBusinessObject: jest.fn(),
      getServerBusinessObjectFunction: jest.fn(),
      createServerBusinessObjectFunction: jest.fn(),
      updateServerBusinessObjectFunction: jest.fn()
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register both businessobject-update and businessobject-function-update tools', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(2);

      // Check first tool (businessobject-update)
      expect(mockServer.tool).toHaveBeenNthCalledWith(1,
        "businessobject-update",
        expect.any(String),
        expect.objectContaining({
          name: expect.any(Object),
          description: expect.any(Object),
          dependencies: expect.any(Object),
          tags: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Create or update a Business Object",
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true
        }),
        expect.any(Function)
      );

      // Check second tool (businessobject-function-update)
      expect(mockServer.tool).toHaveBeenNthCalledWith(2,
        "businessobject-function-update",
        expect.any(String),
        expect.objectContaining({
          businessObjectName: expect.any(Object),
          functionName: expect.any(Object),
          description: expect.any(Object),
          code: expect.any(Object),
          validateIn: expect.any(Object),
          validateOut: expect.any(Object),
          inputParameters: expect.any(Object),
          outputParameters: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Create or update a Business Object Function",
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true
        }),
        expect.any(Function)
      );
    });

    it('should validate required schema fields', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that schema validates required fields
      expect(schema.name).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.dependencies).toBeDefined();
      expect(schema.tags).toBeDefined();

      // Test valid data passes validation - each field individually
      const validName = "TestBO";
      const validDescription = "Test description";
      const validDependencies = [{ refType: "connector", name: "testConnector" }];
      const validTags = ["test"];

      expect(() => schema.name.parse(validName)).not.toThrow();
      expect(() => schema.description.parse(validDescription)).not.toThrow();
      expect(() => schema.dependencies.parse(validDependencies)).not.toThrow();
      expect(() => schema.tags.parse(validTags)).not.toThrow();
    });

    it('should validate that name is required', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that valid string passes
      expect(() => schema.name.parse("ValidName")).not.toThrow();

      // Test that undefined fails validation (name is required)
      expect(() => schema.name.parse(undefined)).toThrow();

      // Test that null fails validation
      expect(() => schema.name.parse(null)).toThrow();
    });

    it('should allow optional fields to be omitted', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that optional fields can be undefined
      expect(() => schema.description.parse(undefined)).not.toThrow();
      expect(() => schema.dependencies.parse(undefined)).not.toThrow();
      expect(() => schema.tags.parse(undefined)).not.toThrow();

      // Test default values are applied
      expect(schema.description.parse(undefined)).toBe("");
      expect(schema.dependencies.parse(undefined)).toEqual([]);
      expect(schema.tags.parse(undefined)).toEqual([]);
    });
  });

  describe('tool handler - create new business object', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should create a new business object when it does not exist', async () => {
      const testParams = {
        name: "NewBO",
        description: "New business object",
        dependencies: [{ refType: "connector", name: "testConnector" }],
        tags: ["new"]
      };

      const expectedData = {
        name: "NewBO",
        description: "New business object",
        dependencies: [{ refType: "connector", name: "testConnector" }],
        tags: ["new"]
      };

      const expectedResponse = "Business object created successfully";

      // Mock that business object doesn't exist (throws error)
      mockSimplifierClient.getServerBusinessObjectDetails.mockRejectedValue(
        new Error("Not found")
      );

      // Mock successful creation
      mockSimplifierClient.createServerBusinessObject.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult to call the function and return result
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getServerBusinessObjectDetails).toHaveBeenCalledWith("NewBO");
      expect(mockSimplifierClient.createServerBusinessObject).toHaveBeenCalledWith(expect.objectContaining(expectedData));
      expect(mockSimplifierClient.updateServerBusinessObject).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Business Object NewBO",
        expect.any(Function)
      );
    });

    it('should update existing business object when it exists', async () => {
      const testParams = {
        name: "ExistingBO",
        description: "Updated business object",
        dependencies: [{ refType: "connector", name: "testConnector" }],
        tags: ["updated"]
      };

      const existingBO: SimplifierBusinessObjectDetails = {
        name: "ExistingBO",
        description: "Old description",
        dependencies: [],
        functionNames: ["test"],
        editable: true,
        deletable: true,
        tags: ["old"],
        assignedProperties: { projectsBefore: [], projectsAfter: [] }
      };

      const expectedData = {
        name: "ExistingBO",
        description: "Updated business object",
        dependencies: [{ refType: "connector", name: "testConnector" }],
        tags: ["updated"]
      };

      const expectedResponse = "Business object updated successfully";

      // Mock that business object exists
      mockSimplifierClient.getServerBusinessObjectDetails.mockResolvedValue(existingBO);

      // Mock successful update
      mockSimplifierClient.updateServerBusinessObject.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getServerBusinessObjectDetails).toHaveBeenCalledWith("ExistingBO");
      expect(mockSimplifierClient.updateServerBusinessObject).toHaveBeenCalledWith(expect.objectContaining(expectedData));
      expect(mockSimplifierClient.createServerBusinessObject).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Business Object ExistingBO",
        expect.any(Function)
      );
    });

    it('should return the string response from API', async () => {
      const testParams = {
        name: "TestBO",
        description: "Test business object"
      };

      const expectedResponse = "Created successfully";

      // Mock that business object doesn't exist
      mockSimplifierClient.getServerBusinessObjectDetails.mockRejectedValue(
        new Error("Not found")
      );

      // Mock successful creation
      mockSimplifierClient.createServerBusinessObject.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult to return the actual result
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        expect(result).toBe("Created successfully");
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockWrapToolResult).toHaveBeenCalled();
    });

    it('should handle minimal data with optional fields', async () => {
      const testParams = {
        name: "MinimalBO"
        // Optional fields will get defaults from Zod schema: description="", dependencies=[], tags=[]
      };

      const expectedResponse = "Created";

      // Mock that business object doesn't exist
      mockSimplifierClient.getServerBusinessObjectDetails.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createServerBusinessObject.mockResolvedValue(expectedResponse);

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return {
          content: [{ type: "text", text: "Created" }]
        };
      });

      await toolHandler(testParams);

      // Verify that createServerBusinessObject was called
      expect(mockSimplifierClient.createServerBusinessObject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "MinimalBO"
        })
      );
    });
  });

  describe('error handling', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should handle errors through wrapToolResult', async () => {
      const testParams = {
        name: "ErrorBO",
        description: "This will fail"
      };

      // Mock that business object doesn't exist
      mockSimplifierClient.getServerBusinessObjectDetails.mockRejectedValue(
        new Error("Not found")
      );

      // Mock that creation fails
      mockSimplifierClient.createServerBusinessObject.mockRejectedValue(
        new Error("Creation failed")
      );

      // Mock wrapToolResult to handle the error
      mockWrapToolResult.mockImplementation(async (caption, fn) => {
        try {
          await fn();
          return {
            content: [{ type: "text", text: "Success" }]
          };
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
        "create or update Business Object ErrorBO",
        expect.any(Function)
      );
    });
  });

  describe('businessobject-function-update tool', () => {
    let functionToolHandler: Function;

    beforeEach(() => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);
      // Get the function tool handler (second tool registered)
      functionToolHandler = mockServer.tool.mock.calls[1][4];
    });

    describe('function tool handler - create new function', () => {
      it('should create a new function when it does not exist', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "newFunction",
          description: "A new test function",
          code: 'return "Hello World";',
          validateIn: false,
          validateOut: false,
          inputParameters: [],
          outputParameters: []
        };

        const expectedFunctionData: SimplifierBusinessObjectFunction = {
          businessObjectName: "TestBO",
          name: "newFunction",
          description: "A new test function",
          validateIn: false,
          validateOut: false,
          inputParameters: [],
          outputParameters: [],
          functionType: "JavaScript",
          code: 'return "Hello World";'
        };

        const expectedResponse = "Successfully created function 'newFunction' in Business Object 'TestBO'";

        // Mock that function doesn't exist (throws error)
        mockSimplifierClient.getServerBusinessObjectFunction.mockRejectedValue(
          new Error("Function not found")
        );

        // Mock successful creation
        mockSimplifierClient.createServerBusinessObjectFunction.mockResolvedValue(expectedResponse);

        // Mock wrapToolResult to call the function and return result
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await functionToolHandler(testParams);

        expect(mockSimplifierClient.getServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "newFunction");
        expect(mockSimplifierClient.createServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", expectedFunctionData);
        expect(mockSimplifierClient.updateServerBusinessObjectFunction).not.toHaveBeenCalled();
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "create or update Business Object function TestBO.newFunction",
          expect.any(Function)
        );
      });

      it('should update existing function when it exists', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "existingFunction",
          description: "Updated function",
          code: 'return "Updated";',
          validateIn: true,
          validateOut: true,
          inputParameters: [
            {
              name: "input",
              description: "Input param",
              alias: "input",
              dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
              isOptional: false
            }
          ],
          outputParameters: []
        };

        const existingFunction: SimplifierBusinessObjectFunction = {
          businessObjectName: "TestBO",
          name: "existingFunction",
          description: "Old description",
          validateIn: false,
          validateOut: false,
          inputParameters: [],
          outputParameters: [],
          functionType: "JavaScript",
          code: 'return "Old";'
        };

        const expectedFunctionData: SimplifierBusinessObjectFunction = {
          businessObjectName: "TestBO",
          name: "existingFunction",
          description: "Updated function",
          validateIn: true,
          validateOut: true,
          inputParameters: [
            {
              name: "input",
              description: "Input param",
              alias: "input",
              dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
              dataType: null,
              isOptional: false
            }
          ],
          outputParameters: [],
          functionType: "JavaScript",
          code: 'return "Updated";'
        };

        const expectedResponse = "Successfully updated function 'existingFunction' in Business Object 'TestBO'";

        // Mock that function exists
        mockSimplifierClient.getServerBusinessObjectFunction.mockResolvedValue(existingFunction);

        // Mock successful update
        mockSimplifierClient.updateServerBusinessObjectFunction.mockResolvedValue(expectedResponse);

        // Mock wrapToolResult
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await functionToolHandler(testParams);

        expect(mockSimplifierClient.getServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "existingFunction");
        expect(mockSimplifierClient.updateServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "existingFunction", expectedFunctionData);
        expect(mockSimplifierClient.createServerBusinessObjectFunction).not.toHaveBeenCalled();
      });

      it('should handle minimal function with defaults', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "minimalFunction",
          // Explicitly set defaults since in real MCP these would come from schema
          description: "",
          code: "return {};",
          validateIn: false,
          validateOut: false,
          inputParameters: [],
          outputParameters: []
        };

        const expectedFunctionData: SimplifierBusinessObjectFunction = {
          businessObjectName: "TestBO",
          name: "minimalFunction",
          description: "",
          validateIn: false,
          validateOut: false,
          inputParameters: [],
          outputParameters: [],
          functionType: "JavaScript",
          code: "return {};"
        };

        // Mock that function doesn't exist
        mockSimplifierClient.getServerBusinessObjectFunction.mockRejectedValue(
          new Error("Not found")
        );

        mockSimplifierClient.createServerBusinessObjectFunction.mockResolvedValue("Created");

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          await fn();
          return {
            content: [{ type: "text", text: "Created" }]
          };
        });

        await functionToolHandler(testParams);

        expect(mockSimplifierClient.createServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", expectedFunctionData);
      });

      it('should handle parameters with default alias', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "paramFunction",
          inputParameters: [
            {
              name: "testParam",
              dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52"
              // alias should default to name
            }
          ],
          outputParameters: [
            {
              name: "result",
              description: "The result",
              dataTypeId: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D"
              // alias should default to name
            }
          ]
        };

        mockSimplifierClient.getServerBusinessObjectFunction.mockRejectedValue(new Error("Not found"));
        mockSimplifierClient.createServerBusinessObjectFunction.mockResolvedValue("Created");
        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          await fn();
          return { content: [{ type: "text", text: "Created" }] };
        });

        await functionToolHandler(testParams);

        const callArgs = mockSimplifierClient.createServerBusinessObjectFunction.mock.calls[0];
        const functionData = callArgs[1] as SimplifierBusinessObjectFunction;

        expect(functionData.inputParameters).toEqual([
          {
            name: "testParam",
            description: "",
            alias: "testParam", // Should default to name
            dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
            dataType: null,
            isOptional: false
          }
        ]);

        expect(functionData.outputParameters).toEqual([
          {
            name: "result",
            description: "The result",
            alias: "result", // Should default to name
            dataTypeId: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D",
            dataType: null,
            isOptional: false
          }
        ]);
      });
    });

    describe('function tool schema validation', () => {
      it('should validate function tool schema fields', () => {
        registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

        const functionToolCall = mockServer.tool.mock.calls[1];
        const schema = functionToolCall[2];

        // Test required fields exist
        expect(schema.businessObjectName).toBeDefined();
        expect(schema.functionName).toBeDefined();

        // Test valid data passes validation
        expect(() => schema.businessObjectName.parse("TestBO")).not.toThrow();
        expect(() => schema.functionName.parse("testFunction")).not.toThrow();
        expect(() => schema.description.parse("Test description")).not.toThrow();
        expect(() => schema.code.parse('return "test";')).not.toThrow();
        expect(() => schema.validateIn.parse(true)).not.toThrow();
        expect(() => schema.validateOut.parse(false)).not.toThrow();

        // Test default values
        expect(schema.description.parse(undefined)).toBe("");
        expect(schema.code.parse(undefined)).toBe("return {};");
        expect(schema.validateIn.parse(undefined)).toBe(false);
        expect(schema.validateOut.parse(undefined)).toBe(false);
        expect(schema.inputParameters.parse(undefined)).toEqual([]);
        expect(schema.outputParameters.parse(undefined)).toEqual([]);
      });

      it('should validate parameter schema', () => {
        registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

        const functionToolCall = mockServer.tool.mock.calls[1];
        const schema = functionToolCall[2];

        const validParameters = [
          {
            name: "param1",
            description: "Test param",
            alias: "p1",
            dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
            isOptional: false
          }
        ];

        expect(() => schema.inputParameters.parse(validParameters)).not.toThrow();
        expect(() => schema.outputParameters.parse(validParameters)).not.toThrow();

        // Test parameter defaults
        const minimalParam = [{ name: "testParam" }];
        const result = schema.inputParameters.parse(minimalParam);
        expect(result[0]).toEqual({
          name: "testParam",
          description: "",
          alias: "",
          dataTypeId: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB", // Any type default
          isOptional: false
        });
      });
    });
  });
});