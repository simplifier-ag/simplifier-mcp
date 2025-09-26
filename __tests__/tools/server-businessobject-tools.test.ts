import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerBusinessObjectTools } from "../../src/tools/server-businessobject-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SimplifierBusinessObjectDetails } from "../../src/client/types.js";

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
      createServerBusinessObject: jest.fn()
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register businessobject-update tool with correct parameters', () => {
      registerServerBusinessObjectTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(1);
      expect(mockServer.tool).toHaveBeenCalledWith(
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
});