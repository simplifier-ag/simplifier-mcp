import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerBusinessObjectTools } from "../../src/tools/server-businessobject-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SimplifierBusinessObjectDetails, SimplifierBusinessObjectFunction, BusinessObjectTestRequest, BusinessObjectTestResponse } from "../../src/client/types.js";

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
      updateServerBusinessObjectFunction: jest.fn(),
      testServerBusinessObjectFunction: jest.fn(),
      deleteServerBusinessObject: jest.fn(),
      deleteServerBusinessObjectFunction: jest.fn()
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register all five business object tools', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(5);

      // Check first tool (businessobject-update)
      expect(mockServer.tool).toHaveBeenNthCalledWith(1,
        "businessobject-update",
        expect.any(String),
        expect.objectContaining({
          name: expect.any(Object),
          description: expect.any(Object),
          dependencies: expect.any(Object),
          tags: expect.any(Object),
          projectsBefore: expect.any(Object),
          projectsAfterChange: expect.any(Object)
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

      // Check third tool (businessobject-function-test)
      expect(mockServer.tool).toHaveBeenNthCalledWith(3,
        "businessobject-function-test",
        expect.any(String),
        expect.objectContaining({
          businessObjectName: expect.any(Object),
          functionName: expect.any(Object),
          inputParameters: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Test a Business Object Function",
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }),
        expect.any(Function)
      );

      // Check fourth tool (businessobject-delete)
      expect(mockServer.tool).toHaveBeenNthCalledWith(4,
        "businessobject-delete",
        expect.any(String),
        expect.objectContaining({
          name: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Delete a Business Object",
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false
        }),
        expect.any(Function)
      );

      // Check fifth tool (businessobject-function-delete)
      expect(mockServer.tool).toHaveBeenNthCalledWith(5,
        "businessobject-function-delete",
        expect.any(String),
        expect.objectContaining({
          businessObjectName: expect.any(Object),
          functionName: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Delete a Business Object Function",
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false
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
      expect(schema.projectsBefore).toBeDefined();
      expect(schema.projectsAfterChange).toBeDefined();

      // Test valid data passes validation - each field individually
      const validName = "TestBO";
      const validDescription = "Test description";
      const validDependencies = [{ refType: "connector", name: "testConnector" }];
      const validTags = ["test"];
      const validProjectsBefore = ["Project1"];
      const validProjectsAfterChange = ["Project1", "Project2"];

      expect(() => schema.name.parse(validName)).not.toThrow();
      expect(() => schema.description.parse(validDescription)).not.toThrow();
      expect(() => schema.dependencies.parse(validDependencies)).not.toThrow();
      expect(() => schema.tags.parse(validTags)).not.toThrow();
      expect(() => schema.projectsBefore.parse(validProjectsBefore)).not.toThrow();
      expect(() => schema.projectsAfterChange.parse(validProjectsAfterChange)).not.toThrow();
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

    it('should require description, dependencies, and tags fields', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that description, dependencies, and tags are now required (will throw on undefined)
      expect(() => schema.description.parse(undefined)).toThrow();
      expect(() => schema.dependencies.parse(undefined)).toThrow();
      expect(() => schema.tags.parse(undefined)).toThrow();

      // Test that projectsBefore and projectsAfterChange can still be undefined (have defaults)
      expect(() => schema.projectsBefore.parse(undefined)).not.toThrow();
      expect(() => schema.projectsAfterChange.parse(undefined)).not.toThrow();

      // Test default values are applied for fields that have defaults
      expect(schema.projectsBefore.parse(undefined)).toEqual([]);
      expect(schema.projectsAfterChange.parse(undefined)).toEqual([]);
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
        tags: ["new"],
        projectsBefore: [],
        projectsAfterChange: ["Project1"]
      };

      const expectedData = {
        name: "NewBO",
        description: "New business object",
        dependencies: [{ refType: "connector", name: "testConnector" }],
        tags: ["new"],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: ["Project1"]
        }
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

      expect(mockSimplifierClient.getServerBusinessObjectDetails).toHaveBeenCalledWith("NewBO", "MCP Tool: businessobject-update");
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
        tags: ["updated"],
        projectsBefore: ["Project1"],
        projectsAfterChange: ["Project1", "Project2"]
      };

      const existingBO: SimplifierBusinessObjectDetails = {
        name: "ExistingBO",
        description: "Old description",
        dependencies: [],
        functionNames: ["test"],
        editable: true,
        deletable: true,
        tags: ["old"],
        assignedProjects: { projectsBefore: ["Project1"], projectsAfterChange: ["Project1"] }
      };

      const expectedData = {
        name: "ExistingBO",
        description: "Updated business object",
        dependencies: [{ refType: "connector", name: "testConnector" }],
        tags: ["updated"],
        assignedProjects: {
          projectsBefore: ["Project1"],
          projectsAfterChange: ["Project1", "Project2"]
        }
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

      expect(mockSimplifierClient.getServerBusinessObjectDetails).toHaveBeenCalledWith("ExistingBO", "MCP Tool: businessobject-update");
      expect(mockSimplifierClient.updateServerBusinessObject).toHaveBeenCalledWith(expect.objectContaining(expectedData));
      expect(mockSimplifierClient.createServerBusinessObject).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Business Object ExistingBO",
        expect.any(Function)
      );
    });

    it('should update with all required fields provided', async () => {
      const testParams = {
        name: "ExistingBO",
        description: "Updated description",
        dependencies: [{ refType: "connector", name: "newConnector" }],
        tags: ["updated", "v2"]
        // All required fields must now be provided
      };

      const existingBO: SimplifierBusinessObjectDetails = {
        name: "ExistingBO",
        description: "Old description",
        dependencies: [{ refType: "connector", name: "existingConnector" }],
        functionNames: ["test"],
        editable: true,
        deletable: true,
        tags: ["important", "production"],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      };

      const expectedData = {
        name: "ExistingBO",
        description: "Updated description",
        dependencies: [{ refType: "connector", name: "newConnector" }],
        tags: ["updated", "v2"],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        }
      };

      const expectedResponse = "Updated successfully";

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

      expect(mockSimplifierClient.getServerBusinessObjectDetails).toHaveBeenCalledWith("ExistingBO", "MCP Tool: businessobject-update");
      expect(mockSimplifierClient.updateServerBusinessObject).toHaveBeenCalledWith(expect.objectContaining(expectedData));
      expect(mockSimplifierClient.createServerBusinessObject).not.toHaveBeenCalled();
    });

    it('should return the string response from API', async () => {
      const testParams = {
        name: "TestBO",
        description: "Test business object",
        dependencies: [],
        tags: []
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

    it('should handle minimal data with required fields provided', async () => {
      const testParams = {
        name: "MinimalBO",
        description: "Minimal BO",
        dependencies: [],
        tags: []
        // description, dependencies, and tags are now required
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
          name: "MinimalBO",
          description: "Minimal BO",
          dependencies: [],
          tags: []
        })
      );
    });

    it('should properly assign projects when creating a new BO', async () => {
      const testParams = {
        name: "ProjectAssignedBO",
        description: "BO with projects",
        projectsBefore: [],
        projectsAfterChange: ["ProjectA", "ProjectB", "ProjectC"]
      };

      const expectedResponse = "Created";

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

      expect(mockSimplifierClient.createServerBusinessObject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ProjectAssignedBO",
          assignedProjects: {
            projectsBefore: [],
            projectsAfterChange: ["ProjectA", "ProjectB", "ProjectC"]
          }
        })
      );
    });

    it('should properly update project assignments when updating a BO', async () => {
      const testParams = {
        name: "ExistingBO",
        description: "Existing",
        dependencies: [],
        tags: [],
        projectsBefore: ["ProjectA"],
        projectsAfterChange: ["ProjectB"]
      };

      const existingBO: SimplifierBusinessObjectDetails = {
        name: "ExistingBO",
        description: "Existing",
        dependencies: [],
        functionNames: [],
        editable: true,
        deletable: true,
        tags: [],
        assignedProjects: { projectsBefore: ["ProjectA"], projectsAfterChange: ["ProjectA"] }
      };

      mockSimplifierClient.getServerBusinessObjectDetails.mockResolvedValue(existingBO);
      mockSimplifierClient.updateServerBusinessObject.mockResolvedValue("Updated");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return {
          content: [{ type: "text", text: "Updated" }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.updateServerBusinessObject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ExistingBO",
          description: "Existing",
          dependencies: [],
          tags: [],
          assignedProjects: {
            projectsBefore: ["ProjectA"],
            projectsAfterChange: ["ProjectB"]
          }
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
        description: "This will fail",
        dependencies: [],
        tags: []
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

        expect(mockSimplifierClient.getServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "newFunction", "MCP Tool: businessobject-function-update");
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

        expect(mockSimplifierClient.getServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "existingFunction", "MCP Tool: businessobject-function-update");
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

  describe('businessobject-function-test tool', () => {
    let testToolHandler: Function;

    beforeEach(() => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);
      // Get the test tool handler (third tool registered)
      testToolHandler = mockServer.tool.mock.calls[2][4];
    });

    describe('function test tool handler', () => {
      it('should test function successfully with no parameters', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "simpleFunction",
          inputParameters: []
        };

        const expectedTestRequest: BusinessObjectTestRequest = {
          parameters: []
        };

        const mockResponse: BusinessObjectTestResponse = {
          success: true,
          result: { message: "Hello World" }
        };

        mockSimplifierClient.testServerBusinessObjectFunction.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await testToolHandler(testParams);

        expect(mockSimplifierClient.testServerBusinessObjectFunction).toHaveBeenCalledWith(
          "TestBO",
          "simpleFunction",
          expectedTestRequest,
          "MCP Tool: businessobject-function-test"
        );
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "test Business Object function TestBO.simpleFunction",
          expect.any(Function)
        );
      });

      it('should test function successfully with parameters', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "processData",
          inputParameters: [
            {
              name: "inputText",
              value: "Hello World",
              dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
              optional: false
            },
            {
              name: "count",
              value: 5,
              dataTypeId: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D"
            }
          ]
        };

        const expectedTestRequest: BusinessObjectTestRequest = {
          parameters: [
            {
              name: "inputText",
              value: "Hello World",
              dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
              optional: false,
              transfer: true
            },
            {
              name: "count",
              value: 5,
              dataTypeId: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D",
              optional: false,
              transfer: true
            }
          ]
        };

        const mockResponse: BusinessObjectTestResponse = {
          success: true,
          result: { processedText: "HELLO WORLD", repeatCount: 5 }
        };

        mockSimplifierClient.testServerBusinessObjectFunction.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result.success).toBe(true);
          expect(result.result).toEqual({ processedText: "HELLO WORLD", repeatCount: 5 });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await testToolHandler(testParams);

        expect(mockSimplifierClient.testServerBusinessObjectFunction).toHaveBeenCalledWith(
          "TestBO",
          "processData",
          expectedTestRequest,
          "MCP Tool: businessobject-function-test"
        );
      });

      it('should handle function execution failure', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "failingFunction",
          inputParameters: []
        };

        const mockResponse: BusinessObjectTestResponse = {
          success: false,
          error: "Function execution failed: missing required parameter 'input'"
        };

        mockSimplifierClient.testServerBusinessObjectFunction.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result.success).toBe(false);
          expect(result.error).toBe("Function execution failed: missing required parameter 'input'");
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await testToolHandler(testParams);

        expect(mockSimplifierClient.testServerBusinessObjectFunction).toHaveBeenCalledWith(
          "TestBO",
          "failingFunction",
          { parameters: [] },
          "MCP Tool: businessobject-function-test"
        );
      });

      it('should handle client errors (404, 400, 500)', async () => {
        const testParams = {
          businessObjectName: "NonExistentBO",
          functionName: "nonExistentFunction",
          inputParameters: []
        };

        mockSimplifierClient.testServerBusinessObjectFunction.mockRejectedValue(
          new Error("Business Object 'NonExistentBO' or function 'nonExistentFunction' not found")
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

        await testToolHandler(testParams);

        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "test Business Object function NonExistentBO.nonExistentFunction",
          expect.any(Function)
        );
      });

      it('should use default parameter values correctly', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "testFunction",
          inputParameters: [
            {
              name: "param1",
              value: "test",
              // Explicitly set defaults since in real MCP these would come from schema
              dataTypeId: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB",
              optional: false
            }
          ]
        };

        const mockResponse: BusinessObjectTestResponse = {
          success: true,
          result: { output: "test processed" }
        };

        mockSimplifierClient.testServerBusinessObjectFunction.mockResolvedValue(mockResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        });

        await testToolHandler(testParams);

        const callArgs = mockSimplifierClient.testServerBusinessObjectFunction.mock.calls[0];
        const testRequest = callArgs[2] as BusinessObjectTestRequest;

        expect(testRequest.parameters[0]).toEqual({
          name: "param1",
          value: "test",
          dataTypeId: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB", // Any type default
          optional: false,
          transfer: true
        });
      });
    });

    describe('test tool schema validation', () => {
      it('should validate test tool schema fields', () => {
        registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

        const testToolCall = mockServer.tool.mock.calls[2];
        const schema = testToolCall[2];

        // Test required fields exist
        expect(schema.businessObjectName).toBeDefined();
        expect(schema.functionName).toBeDefined();
        expect(schema.inputParameters).toBeDefined();

        // Test valid data passes validation
        expect(() => schema.businessObjectName.parse("TestBO")).not.toThrow();
        expect(() => schema.functionName.parse("testFunction")).not.toThrow();

        // Test parameter validation
        const validParameters = [
          {
            name: "param1",
            value: "test value",
            dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
            optional: false
          }
        ];
        expect(() => schema.inputParameters.parse(validParameters)).not.toThrow();

        // Test defaults
        expect(schema.inputParameters.parse(undefined)).toEqual([]);
      });

      it('should handle various parameter value types', () => {
        registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

        const testToolCall = mockServer.tool.mock.calls[2];
        const schema = testToolCall[2];

        // Test different value types
        const parametersWithDifferentTypes = [
          { name: "stringParam", value: "text" },
          { name: "numberParam", value: 42 },
          { name: "booleanParam", value: true },
          { name: "objectParam", value: { key: "value" } },
          { name: "arrayParam", value: [1, 2, 3] },
          { name: "nullParam", value: null }
        ];

        expect(() => schema.inputParameters.parse(parametersWithDifferentTypes)).not.toThrow();
      });
    });
  });

  describe('businessobject-delete tool', () => {
    let deleteToolHandler: Function;

    beforeEach(() => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);
      // Get the delete tool handler (fourth tool registered)
      deleteToolHandler = mockServer.tool.mock.calls[3][4];
    });

    describe('delete tool registration', () => {
      it('should register delete tool with correct schema', () => {
        registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

        const deleteToolCall = mockServer.tool.mock.calls[3];
        const schema = deleteToolCall[2];

        // Test required fields exist
        expect(schema.name).toBeDefined();

        // Test valid data passes validation
        expect(() => schema.name.parse("TestBO")).not.toThrow();

        // Test that name is required
        expect(() => schema.name.parse(undefined)).toThrow();
        expect(() => schema.name.parse(null)).toThrow();
      });
    });

    describe('delete tool handler', () => {
      it('should successfully delete a business object', async () => {
        const testParams = {
          name: "TestBO"
        };

        const expectedResponse = "Business Object 'TestBO' deleted successfully";

        mockSimplifierClient.deleteServerBusinessObject.mockResolvedValue(expectedResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObject).toHaveBeenCalledWith("TestBO", "MCP Tool: businessobject-delete");
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "Delete Business Object TestBO",
          expect.any(Function)
        );
      });

      it('should handle deletion of business object with special characters in name', async () => {
        const testParams = {
          name: "Test_BO-v2.0"
        };

        const expectedResponse = "Business Object 'Test_BO-v2.0' deleted successfully";

        mockSimplifierClient.deleteServerBusinessObject.mockResolvedValue(expectedResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObject).toHaveBeenCalledWith("Test_BO-v2.0", "MCP Tool: businessobject-delete");
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "Delete Business Object Test_BO-v2.0",
          expect.any(Function)
        );
      });

      it('should handle errors when business object does not exist', async () => {
        const testParams = {
          name: "NonExistentBO"
        };

        mockSimplifierClient.deleteServerBusinessObject.mockRejectedValue(
          new Error("Business Object 'NonExistentBO' not found")
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

        await deleteToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObject).toHaveBeenCalledWith("NonExistentBO", "MCP Tool: businessobject-delete");
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "Delete Business Object NonExistentBO",
          expect.any(Function)
        );
      });

      it('should handle errors when business object is not deletable', async () => {
        const testParams = {
          name: "ProtectedBO"
        };

        mockSimplifierClient.deleteServerBusinessObject.mockRejectedValue(
          new Error("Business Object 'ProtectedBO' cannot be deleted: still in use")
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

        await deleteToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObject).toHaveBeenCalledWith("ProtectedBO", "MCP Tool: businessobject-delete");
      });

      it('should return the string response from API on successful deletion', async () => {
        const testParams = {
          name: "TestBO"
        };

        const expectedResponse = "Deleted successfully";

        mockSimplifierClient.deleteServerBusinessObject.mockResolvedValue(expectedResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result).toBe("Deleted successfully");
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteToolHandler(testParams);

        expect(mockWrapToolResult).toHaveBeenCalled();
      });
    });
  });

  describe('businessobject-function-delete tool', () => {
    let deleteFunctionToolHandler: Function;

    beforeEach(() => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);
      // Get the delete function tool handler (fifth tool registered)
      deleteFunctionToolHandler = mockServer.tool.mock.calls[4][4];
    });

    describe('delete function tool registration', () => {
      it('should register delete function tool with correct schema', () => {
        registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

        const deleteFunctionToolCall = mockServer.tool.mock.calls[4];
        const schema = deleteFunctionToolCall[2];

        // Test required fields exist
        expect(schema.businessObjectName).toBeDefined();
        expect(schema.functionName).toBeDefined();

        // Test valid data passes validation
        expect(() => schema.businessObjectName.parse("TestBO")).not.toThrow();
        expect(() => schema.functionName.parse("testFunction")).not.toThrow();

        // Test that fields are required
        expect(() => schema.businessObjectName.parse(undefined)).toThrow();
        expect(() => schema.functionName.parse(undefined)).toThrow();
        expect(() => schema.businessObjectName.parse(null)).toThrow();
        expect(() => schema.functionName.parse(null)).toThrow();
      });
    });

    describe('delete function tool handler', () => {
      it('should successfully delete a business object function', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "testFunction"
        };

        const expectedResponse = "Function 'testFunction' deleted successfully from Business Object 'TestBO'";

        mockSimplifierClient.deleteServerBusinessObjectFunction.mockResolvedValue(expectedResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteFunctionToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "testFunction", "MCP Tool: businessobject-function-delete");
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "Delete Business Object Function TestBO.testFunction",
          expect.any(Function)
        );
      });

      it('should handle deletion of function with special characters in names', async () => {
        const testParams = {
          businessObjectName: "Test_BO-v2",
          functionName: "get_user_data"
        };

        const expectedResponse = "Function 'get_user_data' deleted successfully from Business Object 'Test_BO-v2'";

        mockSimplifierClient.deleteServerBusinessObjectFunction.mockResolvedValue(expectedResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteFunctionToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenCalledWith("Test_BO-v2", "get_user_data", "MCP Tool: businessobject-function-delete");
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "Delete Business Object Function Test_BO-v2.get_user_data",
          expect.any(Function)
        );
      });

      it('should handle errors when business object does not exist', async () => {
        const testParams = {
          businessObjectName: "NonExistentBO",
          functionName: "testFunction"
        };

        mockSimplifierClient.deleteServerBusinessObjectFunction.mockRejectedValue(
          new Error("Business Object 'NonExistentBO' not found")
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

        await deleteFunctionToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenCalledWith("NonExistentBO", "testFunction", "MCP Tool: businessobject-function-delete");
        expect(mockWrapToolResult).toHaveBeenCalledWith(
          "Delete Business Object Function NonExistentBO.testFunction",
          expect.any(Function)
        );
      });

      it('should handle errors when function does not exist', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "nonExistentFunction"
        };

        mockSimplifierClient.deleteServerBusinessObjectFunction.mockRejectedValue(
          new Error("Function 'nonExistentFunction' not found in Business Object 'TestBO'")
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

        await deleteFunctionToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "nonExistentFunction", "MCP Tool: businessobject-function-delete");
      });

      it('should handle errors when function is not deletable', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "protectedFunction"
        };

        mockSimplifierClient.deleteServerBusinessObjectFunction.mockRejectedValue(
          new Error("Function 'protectedFunction' cannot be deleted: still in use by other components")
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

        await deleteFunctionToolHandler(testParams);

        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenCalledWith("TestBO", "protectedFunction", "MCP Tool: businessobject-function-delete");
      });

      it('should return the string response from API on successful deletion', async () => {
        const testParams = {
          businessObjectName: "TestBO",
          functionName: "testFunction"
        };

        const expectedResponse = "Deleted successfully";

        mockSimplifierClient.deleteServerBusinessObjectFunction.mockResolvedValue(expectedResponse);

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          expect(result).toBe("Deleted successfully");
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteFunctionToolHandler(testParams);

        expect(mockWrapToolResult).toHaveBeenCalled();
      });

      it('should handle multiple consecutive deletions', async () => {
        const testParams1 = {
          businessObjectName: "TestBO",
          functionName: "function1"
        };

        const testParams2 = {
          businessObjectName: "TestBO",
          functionName: "function2"
        };

        mockSimplifierClient.deleteServerBusinessObjectFunction
          .mockResolvedValueOnce("Function 'function1' deleted")
          .mockResolvedValueOnce("Function 'function2' deleted");

        mockWrapToolResult.mockImplementation(async (_caption, fn) => {
          const result = await fn();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        });

        await deleteFunctionToolHandler(testParams1);
        await deleteFunctionToolHandler(testParams2);

        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenCalledTimes(2);
        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenNthCalledWith(1, "TestBO", "function1", "MCP Tool: businessobject-function-delete");
        expect(mockSimplifierClient.deleteServerBusinessObjectFunction).toHaveBeenNthCalledWith(2, "TestBO", "function2", "MCP Tool: businessobject-function-delete");
      });
    });
  });
});