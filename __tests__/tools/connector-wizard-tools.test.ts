import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerConnectorWizardTools } from "../../src/tools/connector-wizard-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe("registerConnectorWizardTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      searchPossibleRFCConnectorCalls: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("registers the connector-wizard-rfc-search tool", () => {
    registerConnectorWizardTools(mockServer, mockSimplifierClient);
    expect(mockServer.tool).toHaveBeenCalledTimes(1);
    expect(mockServer.tool.mock.calls[0][0]).toBe("connector-wizard-rfc-search");
  });

  it("paginates results with page size 50 and defaults to page 0", async () => {
    const matches = Array.from({ length: 120 }, (_, i) => `FN_${i}`);
    mockSimplifierClient.searchPossibleRFCConnectorCalls.mockResolvedValue(matches);

    registerConnectorWizardTools(mockServer, mockSimplifierClient);
    const handler = mockServer.tool.mock.calls[0][4] as Function;
    await handler({ connectorName: "MyRfc", term: "USER", page: 0 });

    expect(mockSimplifierClient.searchPossibleRFCConnectorCalls).toHaveBeenCalledWith(
      "MyRfc",
      expect.objectContaining({
        searchOptions: { searchValue: "USER" },
        retrievalOptions: { filter: "%USER%", filterMode: "Simple" }
      }),
      "MCP Tool: connector-wizard-rfc-search"
    );

    const innerFn = mockWrapToolResult.mock.calls[0][1];
    const result = await innerFn() as any;
    expect(result.matches).toHaveLength(50);
    expect(result.matches[0]).toBe("FN_0");
    expect(result.page).toBe(0);
    expect(result.totalPages).toBe(3);
    expect(result.totalMatches).toBe(120);
  });

  it("returns later pages correctly", async () => {
    const matches = Array.from({ length: 120 }, (_, i) => `FN_${i}`);
    mockSimplifierClient.searchPossibleRFCConnectorCalls.mockResolvedValue(matches);
    registerConnectorWizardTools(mockServer, mockSimplifierClient);
    const handler = mockServer.tool.mock.calls[0][4] as Function;

    await handler({ connectorName: "MyRfc", term: "USER", page: 2 });

    const innerFn = mockWrapToolResult.mock.calls[0][1];
    const result = await innerFn() as any;
    expect(result.matches).toHaveLength(20);
    expect(result.matches[0]).toBe("FN_100");
    expect(result.page).toBe(2);
  });

  it("rejects negative page indexes via the schema", () => {
    registerConnectorWizardTools(mockServer, mockSimplifierClient);
    const schema = mockServer.tool.mock.calls[0][2] as any;
    expect(() => schema.page.parse(-1)).toThrow();
    expect(() => schema.page.parse(0)).not.toThrow();
    // Default
    expect(schema.page.parse(undefined)).toBe(0);
  });
});
