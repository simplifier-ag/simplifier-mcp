import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerBusinessObjectCompletionTools } from "../../src/tools/server-businessobject-completion-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SimplifierBusinessObjectCompletions, SimplifierCompletionNode } from "../../src/client/types.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

function bigLeafChildren(count: number): SimplifierCompletionNode[] {
  return Array.from({ length: count }, (_, i) => ({
    kind: "function",
    name: `call${i}`,
    doc: "A fairly long piece of documentation text repeated to inflate the payload size. ".repeat(10),
    params: [{ name: "payload", typeExpr: "object", optional: true, doc: "" }],
    returnType: "object",
    returnDoc: ""
  }));
}

function buildFixture(): SimplifierBusinessObjectCompletions {
  return {
    name: "BusinessObject-Api",
    definitions: [
      {
        kind: "interface", name: "BooksQueryBuilder", doc: "", properties: [
          { kind: "property", name: "execute", doc: "", typeExpr: "fn() -> BooksQueryResult", optional: false }
        ]
      },
      {
        kind: "interface", name: "BooksQueryResult", doc: "", properties: [
          { kind: "property", name: "records", doc: "", typeExpr: "[BooksRecord]", optional: false }
        ]
      },
      {
        kind: "interface", name: "BooksRecord", doc: "", properties: [
          { kind: "property", name: "title", doc: "", typeExpr: "string", optional: false }
        ]
      },
      {
        kind: "interface", name: "Unrelated", doc: "should never be pulled in", properties: []
      }
    ],
    modules: [
      {
        kind: "module",
        name: "Simplifier",
        doc: "root",
        children: [
          {
            kind: "module", name: "Log", doc: "Provides operations for logging.\nmore text", children: [
              { kind: "function", name: "debug", doc: "Creates a log entry.", params: [{ name: "message", typeExpr: "string", optional: false, doc: "" }], returnType: "void", returnDoc: "" }
            ]
          },
          {
            kind: "module", name: "Connector", doc: "Provides operations to exchange data via connectors.", children: [
              {
                kind: "module", name: "MyODataConn", doc: "OData connector 'MyODataConn'", children: [
                  {
                    kind: "module", name: "Books", doc: "", children: [
                      { kind: "function", name: "query", doc: "Build a query for Books.", params: [], returnType: "BooksQueryBuilder", returnDoc: "" }
                    ]
                  }
                ]
              },
              {
                kind: "module", name: "BigConn", doc: "A connector with many calls", children: bigLeafChildren(200)
              }
            ]
          }
        ]
      }
    ],
    globals: []
  };
}

describe("registerServerBusinessObjectCompletionTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      getServerBusinessObjectCompletions: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  function registerAndGetHandler() {
    registerServerBusinessObjectCompletionTools(mockServer, mockSimplifierClient);
    return mockServer.tool.mock.calls[0][4] as Function;
  }

  it("registers a single read-only tool", () => {
    registerServerBusinessObjectCompletionTools(mockServer, mockSimplifierClient);

    expect(mockServer.tool).toHaveBeenCalledTimes(1);
    expect(mockServer.tool.mock.calls[0][0]).toBe("businessobject-completions");
    const annotations = mockServer.tool.mock.calls[0][3] as any;
    expect(annotations.readOnlyHint).toBe(true);
    expect(annotations.destructiveHint).toBe(false);
    expect(annotations.idempotentHint).toBe(true);
    expect(annotations.openWorldHint).toBe(false);
  });

  it("fetches completions with the tracking key and forwards the business object name", async () => {
    mockSimplifierClient.getServerBusinessObjectCompletions.mockResolvedValue(buildFixture());
    const handler = registerAndGetHandler();

    await handler({ businessObjectName: "MyBO", paths: [] });

    expect(mockSimplifierClient.getServerBusinessObjectCompletions)
      .toHaveBeenCalledWith("MyBO", "MCP Tool: businessobject-completions");
    expect(mockWrapToolResult).toHaveBeenCalledWith(
      "get code completions for Business Object MyBO",
      expect.any(Function)
    );
  });

  describe("without paths", () => {
    it("returns a compact outline with one level of child names, not full signatures", async () => {
      mockSimplifierClient.getServerBusinessObjectCompletions.mockResolvedValue(buildFixture());
      const handler = registerAndGetHandler();

      const result = await handler({ businessObjectName: "MyBO", paths: [] });
      const body = JSON.parse(result.content[0].text);

      expect(body.businessObjectName).toBe("MyBO");
      expect(body.details).toBeUndefined();
      expect(body.hint).toEqual(expect.any(String));

      const log = body.outline.find((n: any) => n.name === "Log");
      expect(log).toEqual({
        name: "Log",
        kind: "module",
        doc: "Provides operations for logging.",
        childCount: 1,
        children: [{ name: "debug", kind: "function" }]
      });

      const connector = body.outline.find((n: any) => n.name === "Connector");
      expect(connector.childCount).toBe(2);
      expect(connector.children).toEqual(
        expect.arrayContaining([{ name: "MyODataConn", kind: "module" }, { name: "BigConn", kind: "module" }])
      );
      // Full function signatures/params must not leak into the outline
      expect(JSON.stringify(body.outline)).not.toContain("Creates a log entry");
    });
  });

  describe("with paths", () => {
    it("returns full detail (with resolved type closure) for a small subtree", async () => {
      mockSimplifierClient.getServerBusinessObjectCompletions.mockResolvedValue(buildFixture());
      const handler = registerAndGetHandler();

      const result = await handler({ businessObjectName: "MyBO", paths: ["Connector.MyODataConn.Books"] });
      const body = JSON.parse(result.content[0].text);

      const detail = body.details["Connector.MyODataConn.Books"];
      expect(detail.truncated).toBeUndefined();
      expect(detail.children).toEqual([
        { kind: "function", name: "query", doc: "Build a query for Books.", params: [], returnType: "BooksQueryBuilder", returnDoc: "" }
      ]);

      const defNames = body.definitions.map((d: any) => d.name);
      expect(defNames).toEqual(expect.arrayContaining(["BooksQueryBuilder", "BooksQueryResult", "BooksRecord"]));
      expect(defNames).not.toContain("Unrelated");
    });

    it("returns the node itself for a leaf (function) path", async () => {
      mockSimplifierClient.getServerBusinessObjectCompletions.mockResolvedValue(buildFixture());
      const handler = registerAndGetHandler();

      const result = await handler({ businessObjectName: "MyBO", paths: ["Connector.MyODataConn.Books.query"] });
      const body = JSON.parse(result.content[0].text);

      expect(body.details["Connector.MyODataConn.Books.query"]).toEqual({
        kind: "function", name: "query", doc: "Build a query for Books.", params: [], returnType: "BooksQueryBuilder", returnDoc: ""
      });
    });

    it("falls back to a compact child-name outline when the subtree is too large, with a hint to drill deeper", async () => {
      mockSimplifierClient.getServerBusinessObjectCompletions.mockResolvedValue(buildFixture());
      const handler = registerAndGetHandler();

      const result = await handler({ businessObjectName: "MyBO", paths: ["Connector.BigConn"] });
      const body = JSON.parse(result.content[0].text);

      const detail = body.details["Connector.BigConn"];
      expect(detail.truncated).toBe(true);
      expect(detail.note).toEqual(expect.stringContaining("200 children"));
      expect(detail.children).toHaveLength(200);
      expect(detail.children[0]).toEqual({ name: "call0", kind: "function" });
    });

    it("reports an error for an unresolvable path without failing the whole call", async () => {
      mockSimplifierClient.getServerBusinessObjectCompletions.mockResolvedValue(buildFixture());
      const handler = registerAndGetHandler();

      const result = await handler({
        businessObjectName: "MyBO",
        paths: ["Connector.DoesNotExist", "Connector.MyODataConn.Books"]
      });
      const body = JSON.parse(result.content[0].text);

      expect(body.errors).toEqual({
        "Connector.DoesNotExist": 'No completion entry found at path "Connector.DoesNotExist".'
      });
      expect(body.details["Connector.MyODataConn.Books"]).toBeDefined();
    });
  });
});
