import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerSapSystemTools } from "../../src/tools/sap-system-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

/**
 * Focused tests for the `sap-system-list` and `sap-system-get` read-only tool
 * mirrors that were appended to sap-system-tools.ts. The existing
 * sap-system-tools.test.ts covers the create/update/delete tools; this file
 * covers only the new read surface.
 */
describe("sap-system read tools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      getSapSystem: jest.fn(),
      listSapSystems: jest.fn(),
      createSapSystem: jest.fn(),
      updateSapSystem: jest.fn(),
      deleteSapSystem: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("registers sap-system-list and sap-system-get in addition to the existing write tools", () => {
    registerSapSystemTools(mockServer, mockSimplifierClient);
    const names = mockServer.tool.mock.calls.map(c => c[0]);
    expect(names).toEqual(expect.arrayContaining([
      "sap-system-update", "sap-system-delete", "sap-system-list", "sap-system-get"
    ]));
    // Read tools should come after write/delete tools in registration order
    expect(names).toEqual([
      "sap-system-update", "sap-system-delete", "sap-system-list", "sap-system-get"
    ]);
  });

  it("sap-system-list calls listSapSystems with the expected tracking key", async () => {
    mockSimplifierClient.listSapSystems.mockResolvedValue({
      sapSystems: [{ name: "ID4" }, { name: "ID5" }]
    } as any);

    registerSapSystemTools(mockServer, mockSimplifierClient);
    const listHandler = mockServer.tool.mock.calls[2][4] as Function;
    await listHandler({});

    expect(mockSimplifierClient.listSapSystems)
      .toHaveBeenCalledWith("MCP Tool: sap-system-list");

    const innerFn = mockWrapToolResult.mock.calls[0][1];
    await expect(innerFn()).resolves.toEqual({
      sapSystems: [{ name: "ID4" }, { name: "ID5" }],
      totalCount: 2
    });
  });

  it("sap-system-get resolves SNC quality back to its string form", async () => {
    mockSimplifierClient.getSapSystem.mockResolvedValue({
      name: "ID4",
      configuration: { sncQualityOfProtection: 3, systemId: "ID4" }
    } as any);

    registerSapSystemTools(mockServer, mockSimplifierClient);
    const getHandler = mockServer.tool.mock.calls[3][4] as Function;
    await getHandler({ name: "ID4" });

    expect(mockSimplifierClient.getSapSystem)
      .toHaveBeenCalledWith("ID4", "MCP Tool: sap-system-get");

    const innerFn = mockWrapToolResult.mock.calls[0][1];
    const result = await innerFn() as any;
    expect(result.configuration.sncQualityOfProtection).toBe("privacy+integrity+authentication");
  });

  it("the read tools are marked readOnlyHint=true", () => {
    registerSapSystemTools(mockServer, mockSimplifierClient);
    const listAnn = mockServer.tool.mock.calls[2][3] as any;
    const getAnn = mockServer.tool.mock.calls[3][3] as any;
    for (const ann of [listAnn, getAnn]) {
      expect(ann.readOnlyHint).toBe(true);
      expect(ann.destructiveHint).toBe(false);
      expect(ann.idempotentHint).toBe(true);
      expect(ann.openWorldHint).toBe(false);
    }
  });
});
