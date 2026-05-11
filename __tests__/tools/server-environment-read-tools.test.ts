import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerEnvironmentReadTools } from "../../src/tools/server-environment-read-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe("registerServerEnvironmentReadTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      getInstanceSettings: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("registers two tools", () => {
    registerServerEnvironmentReadTools(mockServer, mockSimplifierClient);
    expect(mockServer.tool.mock.calls.map(c => c[0])).toEqual([
      "server-instance-list",
      "server-active-instance-get"
    ]);
  });

  it("server-instance-list returns all instances", async () => {
    mockSimplifierClient.getInstanceSettings.mockResolvedValue([
      { name: "dev", active: true },
      { name: "prod", active: false }
    ] as any);
    registerServerEnvironmentReadTools(mockServer, mockSimplifierClient);
    const handler = mockServer.tool.mock.calls[0][4] as Function;
    await handler({});
    expect(mockSimplifierClient.getInstanceSettings)
      .toHaveBeenCalledWith("MCP Tool: server-instance-list");
    const innerFn = mockWrapToolResult.mock.calls[0][1];
    await expect(innerFn()).resolves.toEqual([
      { name: "dev", active: true },
      { name: "prod", active: false }
    ]);
  });

  it("server-active-instance-get returns the single active instance", async () => {
    mockSimplifierClient.getInstanceSettings.mockResolvedValue([
      { name: "dev", active: true },
      { name: "prod", active: false }
    ] as any);
    registerServerEnvironmentReadTools(mockServer, mockSimplifierClient);
    const handler = mockServer.tool.mock.calls[1][4] as Function;
    await handler({});
    const innerFn = mockWrapToolResult.mock.calls[0][1];
    await expect(innerFn()).resolves.toEqual({ name: "dev", active: true });
  });

  it("server-active-instance-get throws when none is active", async () => {
    mockSimplifierClient.getInstanceSettings.mockResolvedValue([
      { name: "dev", active: false }
    ] as any);

    // Capture the inner fn without running it, so we can assert it rejects
    let captured: (() => any) | undefined;
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      captured = fn;
      return { content: [{ type: "text", text: "ignored" }] };
    });

    registerServerEnvironmentReadTools(mockServer, mockSimplifierClient);
    const handler = mockServer.tool.mock.calls[1][4] as Function;
    await handler({});

    expect(captured).toBeDefined();
    await expect(captured!()).rejects.toThrow(/does not define an active instance/);
  });
});
