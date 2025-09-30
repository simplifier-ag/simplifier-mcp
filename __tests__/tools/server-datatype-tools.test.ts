import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerDatatypeTools } from "../../src/tools/server-datatype-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe('registerServerDatatypeTools', () => {
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
      getSingleDataType: jest.fn(),
      updateDataType: jest.fn(),
      createDataType: jest.fn(),
      deleteDataType: jest.fn()
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register datatype-update and datatype-delete tools', () => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(2);
      expect(mockServer.tool).toHaveBeenCalledWith(
        "datatype-update",
        expect.any(String),
        expect.objectContaining({
          qualifiedName: expect.any(Object),
          description: expect.any(Object),
          derivedFrom: expect.any(Object),
          collectionDatatype: expect.any(Object),
          fields: expect.any(Object),
          tags: expect.any(Object),
          projectAssignments: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Create or update a Data Type",
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: true
        }),
        expect.any(Function)
      );

      expect(mockServer.tool).toHaveBeenCalledWith(
        "datatype-delete",
        expect.any(String),
        expect.objectContaining({
          qualifiedName: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Delete a Data Type",
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: true
        }),
        expect.any(Function)
      );
    });

    it('should validate datatype-update required schema fields', () => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that schema validates required fields
      expect(schema.qualifiedName).toBeDefined();
      expect(schema.tags).toBeDefined();

      // Test valid data passes validation
      const validQualifiedName = "bo/TestBO/MyType";
      const validTags = ["test"];

      expect(() => schema.qualifiedName.parse(validQualifiedName)).not.toThrow();
      expect(() => schema.tags.parse(validTags)).not.toThrow();
    });

    it('should validate that qualifiedName is required', () => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that valid string passes
      expect(() => schema.qualifiedName.parse("ValidName")).not.toThrow();

      // Test that undefined fails validation (qualifiedName is required)
      expect(() => schema.qualifiedName.parse(undefined)).toThrow();

      // Test that null fails validation
      expect(() => schema.qualifiedName.parse(null)).toThrow();
    });

    it('should allow optional fields to be omitted', () => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that optional fields can be undefined
      expect(() => schema.description.parse(undefined)).not.toThrow();
      expect(() => schema.derivedFrom.parse(undefined)).not.toThrow();
      expect(() => schema.collectionDatatype.parse(undefined)).not.toThrow();
      expect(() => schema.fields.parse(undefined)).not.toThrow();
      expect(() => schema.projectAssignments.parse(undefined)).not.toThrow();

      // Test default values are applied
      expect(schema.description.parse(undefined)).toBe("");
    });
  });

  describe('datatype-update tool handler - struct type', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should create a new struct datatype when it does not exist', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/MyStruct",
        description: "Test struct type",
        fields: [
          { name: "field1", optional: false, dataType: "string", description: "First field" },
          { name: "field2", optional: true, dataType: "number" }
        ],
        tags: ["test"]
      };

      const expectedResponse = "Datatype created successfully";

      // Mock that datatype doesn't exist (throws error)
      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      // Mock successful creation
      mockSimplifierClient.createDataType.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult to call the function and return result
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getSingleDataType).toHaveBeenCalledWith("MyStruct", "bo/TestBO");
      expect(mockSimplifierClient.createDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "MyStruct",
          nameSpace: "bo/TestBO",
          category: "struct",
          isStruct: true,
          fields: expect.any(Array),
          description: "Test struct type",
          tags: ["test"]
        })
      );
      expect(mockSimplifierClient.updateDataType).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update data type bo/TestBO/MyStruct",
        expect.any(Function)
      );
    });

    it('should update existing struct datatype when it exists', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/ExistingStruct",
        description: "Updated struct type",
        fields: [
          { name: "newField", optional: false, dataType: "string" }
        ],
        tags: ["updated"]
      };

      const existingDatatype = {
        id: "123",
        name: "ExistingStruct",
        nameSpace: "bo/TestBO",
        category: "struct" as const,
        description: "Old description",
        baseType: "struct",
        isStruct: true,
        fields: [],
        properties: [],
        editable: true,
        tags: ["old"],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      };

      const expectedResponse = "Datatype updated successfully";

      // Mock that datatype exists
      mockSimplifierClient.getSingleDataType.mockResolvedValue(existingDatatype);

      // Mock successful update
      mockSimplifierClient.updateDataType.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getSingleDataType).toHaveBeenCalledWith("ExistingStruct", "bo/TestBO");
      expect(mockSimplifierClient.updateDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ExistingStruct",
          nameSpace: "bo/TestBO",
          category: "struct",
          description: "Updated struct type",
          tags: ["updated"]
        })
      );
      expect(mockSimplifierClient.createDataType).not.toHaveBeenCalled();
    });
  });

  describe('datatype-update tool handler - domain type', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should create a new domain datatype derived from another type', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/MyDomain",
        description: "Test domain type",
        derivedFrom: "string",
        tags: ["test"]
      };

      const expectedResponse = "Datatype created successfully";

      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createDataType.mockResolvedValue(expectedResponse);

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.createDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "MyDomain",
          nameSpace: "bo/TestBO",
          category: "domain",
          derivedFrom: "string",
          derivedFromNS: undefined,
          description: "Test domain type",
          tags: ["test"]
        })
      );
    });

    it('should handle namespaced derivedFrom types', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/MyDomain",
        derivedFrom: "bo/OtherBO/BaseType",
        tags: []
      };

      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createDataType.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.createDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          derivedFrom: "BaseType",
          derivedFromNS: "bo/OtherBO",
          category: "domain"
        })
      );
    });
  });

  describe('datatype-update tool handler - collection type', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should create a new collection datatype', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/MyCollection",
        description: "Test collection type",
        collectionDatatype: "string",
        tags: ["test"]
      };

      const expectedResponse = "Datatype created successfully";

      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createDataType.mockResolvedValue(expectedResponse);

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.createDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "MyCollection",
          nameSpace: "bo/TestBO",
          category: "collection",
          collDtName: "string",
          collDtNS: undefined,
          description: "Test collection type",
          tags: ["test"]
        })
      );
    });

    it('should handle namespaced collectionDatatype', async () => {
      const testParams = {
        qualifiedName: "con/TestCon/MyCollection",
        collectionDatatype: "bo/TestBO/CustomType",
        tags: []
      };

      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createDataType.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.createDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          collDtName: "CustomType",
          collDtNS: "bo/TestBO",
          category: "collection"
        })
      );
    });
  });

  describe('datatype-update tool handler - base type rejection', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should reject creating base types', async () => {
      const testParams = {
        qualifiedName: "MyBaseType",
        tags: []
        // No fields, no derivedFrom, no collectionDatatype = base type
      };

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        try {
          await fn();
        } catch (error) {
          expect(error).toEqual(new Error("creating base types is not allowed"));
          throw error;
        }
        return {
          content: [{ type: "text", text: "Should not reach here" }]
        };
      });

      await expect(toolHandler(testParams)).rejects.toThrow();

      expect(mockSimplifierClient.createDataType).not.toHaveBeenCalled();
      expect(mockSimplifierClient.updateDataType).not.toHaveBeenCalled();
    });
  });

  describe('datatype-update tool handler - namespace parsing', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should handle qualified names without namespace', async () => {
      const testParams = {
        qualifiedName: "SimpleType",
        derivedFrom: "string",
        tags: []
      };

      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createDataType.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getSingleDataType).toHaveBeenCalledWith("SimpleType", undefined);
      expect(mockSimplifierClient.createDataType).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "SimpleType",
          nameSpace: undefined
        })
      );
    });
  });

  describe('datatype-delete tool handler', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[1][4]; // Second tool registered
    });

    it('should delete a datatype with namespace', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/MyType"
      };

      const expectedResponse = "Datatype deleted successfully";

      mockSimplifierClient.deleteDataType.mockResolvedValue(expectedResponse);

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.deleteDataType).toHaveBeenCalledWith("MyType", "bo/TestBO");
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "delete data type bo/TestBO/MyType",
        expect.any(Function)
      );
    });

    it('should delete a datatype without namespace', async () => {
      const testParams = {
        qualifiedName: "SimpleType"
      };

      const expectedResponse = "Datatype deleted successfully";

      mockSimplifierClient.deleteDataType.mockResolvedValue(expectedResponse);

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.deleteDataType).toHaveBeenCalledWith("SimpleType", undefined);
    });
  });

  describe('error handling', () => {
    let updateHandler: Function;
    let deleteHandler: Function;

    beforeEach(() => {
      registerServerDatatypeTools(mockServer, mockSimplifierClient);
      updateHandler = mockServer.tool.mock.calls[0][4];
      deleteHandler = mockServer.tool.mock.calls[1][4];
    });

    it('should handle errors in datatype-update through wrapToolResult', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/ErrorType",
        fields: [{ name: "test", optional: false, dataType: "string" }],
        tags: []
      };

      mockSimplifierClient.getSingleDataType.mockRejectedValue(
        new Error("Not found")
      );

      mockSimplifierClient.createDataType.mockRejectedValue(
        new Error("Creation failed")
      );

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

      await updateHandler(testParams);

      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update data type bo/TestBO/ErrorType",
        expect.any(Function)
      );
    });

    it('should handle errors in datatype-delete through wrapToolResult', async () => {
      const testParams = {
        qualifiedName: "bo/TestBO/ErrorType"
      };

      mockSimplifierClient.deleteDataType.mockRejectedValue(
        new Error("Deletion failed")
      );

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

      await deleteHandler(testParams);

      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "delete data type bo/TestBO/ErrorType",
        expect.any(Function)
      );
    });
  });
});