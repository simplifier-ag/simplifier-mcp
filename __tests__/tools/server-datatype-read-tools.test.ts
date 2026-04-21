import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerDatatypeReadTools } from "../../src/tools/server-datatype-read-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe("registerServerDatatypeReadTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      getDataTypes: jest.fn(),
      getDataTypeByName: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("should register list and get tools", () => {
    registerServerDatatypeReadTools(mockServer, mockSimplifierClient);
    expect(mockServer.tool).toHaveBeenCalledTimes(2);
    expect(mockServer.tool.mock.calls.map(c => c[0])).toEqual(["datatype-list", "datatype-get"]);
  });

  describe("datatype-list", () => {
    const dataTypes = {
      domainTypes: [
        { name: "Email", id: "e1", category: "domain", nameSpace: undefined },
        { name: "BoName", id: "d1", category: "domain", nameSpace: "bo/Foo" }
      ],
      structTypes: [
        { name: "RootStruct", id: "s1", category: "struct", nameSpace: undefined, fields: [] },
        { name: "FooStruct", id: "s2", category: "struct", nameSpace: "bo/Foo", fields: [] }
      ],
      collectionTypes: [
        { name: "RootColl", id: "c1", category: "collection", nameSpace: undefined },
        { name: "FooColl", id: "c2", category: "collection", nameSpace: "bo/Foo" }
      ],
      nameSpaces: ["bo/Foo", "con/Bar"]
    };

    it("returns root-namespace data types when no namespace arg is passed", async () => {
      mockSimplifierClient.getDataTypes.mockResolvedValue(dataTypes as any);
      registerServerDatatypeReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[0][4] as Function;

      await handler({});

      const innerFn = mockWrapToolResult.mock.calls[0][1];
      const result = await innerFn() as any;
      expect(result.namespace).toMatch(/root/);
      expect(result.domainTypes.map((d: any) => d.name)).toEqual(["Email"]);
      expect(result.structTypes.map((d: any) => d.name)).toEqual(["RootStruct"]);
      expect(result.collectionTypes.map((d: any) => d.name)).toEqual(["RootColl"]);
      expect(result.availableNamespaces).toEqual(["bo/Foo", "con/Bar"]);
    });

    it("filters by namespace when namespace arg is passed", async () => {
      mockSimplifierClient.getDataTypes.mockResolvedValue(dataTypes as any);
      registerServerDatatypeReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[0][4] as Function;

      await handler({ namespace: "bo/Foo" });

      const innerFn = mockWrapToolResult.mock.calls[0][1];
      const result = await innerFn() as any;
      expect(result.namespace).toBe("bo/Foo");
      expect(result.domainTypes.map((d: any) => d.name)).toEqual(["BoName"]);
      expect(result.structTypes.map((d: any) => d.name)).toEqual(["FooStruct"]);
      expect(result.collectionTypes.map((d: any) => d.name)).toEqual(["FooColl"]);
    });
  });

  describe("datatype-get", () => {
    it("forwards qualified name + tracking key", async () => {
      mockSimplifierClient.getDataTypeByName.mockResolvedValue({ name: "Email" } as any);
      registerServerDatatypeReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[1][4] as Function;

      await handler({ qualifiedName: "bo/Foo/FooStruct" });

      expect(mockSimplifierClient.getDataTypeByName)
        .toHaveBeenCalledWith("bo/Foo/FooStruct", "MCP Tool: datatype-get");
    });
  });
});
