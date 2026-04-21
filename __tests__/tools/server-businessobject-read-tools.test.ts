import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerBusinessObjectReadTools } from "../../src/tools/server-businessobject-read-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe("registerServerBusinessObjectReadTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      getServerBusinessObjects: jest.fn(),
      getServerBusinessObjectDetails: jest.fn(),
      getServerBusinessObjectFunction: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    // Default pass-through implementation
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("should register all three read tools", () => {
    registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);

    expect(mockServer.tool).toHaveBeenCalledTimes(3);
    const names = mockServer.tool.mock.calls.map(c => c[0]);
    expect(names).toEqual([
      "businessobject-list",
      "businessobject-get",
      "businessobject-function-get"
    ]);
  });

  it("all registered tools should be marked as read-only and non-destructive", () => {
    registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);

    for (const call of mockServer.tool.mock.calls) {
      const annotations = call[3] as any;
      expect(annotations.readOnlyHint).toBe(true);
      expect(annotations.destructiveHint).toBe(false);
      expect(annotations.idempotentHint).toBe(true);
      expect(annotations.openWorldHint).toBe(false);
    }
  });

  describe("businessobject-list", () => {
    it("returns the list of BO names with the expected tracking key", async () => {
      mockSimplifierClient.getServerBusinessObjects.mockResolvedValue([
        { name: "Foo" } as any,
        { name: "Bar" } as any
      ]);

      registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[0][4] as Function;

      await handler({});

      expect(mockSimplifierClient.getServerBusinessObjects)
        .toHaveBeenCalledWith("MCP Tool: businessobject-list");
      expect(mockWrapToolResult).toHaveBeenCalledWith("list Business Objects", expect.any(Function));

      // Verify the inner fn yields the trimmed list
      const innerFn = mockWrapToolResult.mock.calls[0][1];
      await expect(innerFn()).resolves.toEqual([{ name: "Foo" }, { name: "Bar" }]);
    });
  });

  describe("businessobject-get", () => {
    it("forwards the name and tracking key to SimplifierClient", async () => {
      const expectedBo = { name: "Foo", description: "d" } as any;
      mockSimplifierClient.getServerBusinessObjectDetails.mockResolvedValue(expectedBo);

      registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[1][4] as Function;

      await handler({ name: "Foo" });

      expect(mockSimplifierClient.getServerBusinessObjectDetails)
        .toHaveBeenCalledWith("Foo", "MCP Tool: businessobject-get");
      expect(mockWrapToolResult).toHaveBeenCalledWith("get Business Object Foo", expect.any(Function));
    });

    it("requires the name argument in its schema", () => {
      registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);
      const schema = mockServer.tool.mock.calls[1][2] as any;
      expect(() => schema.name.parse("ValidName")).not.toThrow();
      expect(() => schema.name.parse(undefined)).toThrow();
    });
  });

  describe("businessobject-function-get", () => {
    it("forwards both parameters and the tracking key", async () => {
      const expectedFn = { name: "doIt", inputParameters: [], outputParameters: [] } as any;
      mockSimplifierClient.getServerBusinessObjectFunction.mockResolvedValue(expectedFn);

      registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[2][4] as Function;

      await handler({ businessObjectName: "MyBO", functionName: "doIt" });

      expect(mockSimplifierClient.getServerBusinessObjectFunction)
        .toHaveBeenCalledWith("MyBO", "doIt", "MCP Tool: businessobject-function-get");
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "get BO function MyBO.doIt",
        expect.any(Function)
      );
    });

    it("requires both businessObjectName and functionName in its schema", () => {
      registerServerBusinessObjectReadTools(mockServer, mockSimplifierClient);
      const schema = mockServer.tool.mock.calls[2][2] as any;
      expect(() => schema.businessObjectName.parse("ValidBo")).not.toThrow();
      expect(() => schema.businessObjectName.parse(undefined)).toThrow();
      expect(() => schema.functionName.parse("validFn")).not.toThrow();
      expect(() => schema.functionName.parse(undefined)).toThrow();
    });
  });
});
