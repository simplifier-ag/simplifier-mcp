import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerConnectorReadTools } from "../../src/tools/connector-read-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe("registerConnectorReadTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      listConnectors: jest.fn(),
      getConnector: jest.fn(),
      listConnectorCalls: jest.fn(),
      getConnectorCall: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("should register all four read tools", () => {
    registerConnectorReadTools(mockServer, mockSimplifierClient);
    expect(mockServer.tool).toHaveBeenCalledTimes(4);
    expect(mockServer.tool.mock.calls.map(c => c[0])).toEqual([
      "connector-list",
      "connector-get",
      "connector-call-list",
      "connector-call-get"
    ]);
  });

  describe("connector-list", () => {
    it("maps the SimplifierClient response into a trimmed list", async () => {
      mockSimplifierClient.listConnectors.mockResolvedValue({
        connectors: [
          {
            name: "MyRest",
            description: "desc",
            connectorType: { technicalName: "REST" },
            active: true,
            amountOfCalls: 3
          },
          {
            name: "MySoap",
            description: "",
            connectorType: { technicalName: "SOAP" },
            active: false,
            amountOfCalls: 0
          }
        ]
      } as any);

      registerConnectorReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[0][4] as Function;
      await handler({});

      expect(mockSimplifierClient.listConnectors)
        .toHaveBeenCalledWith("MCP Tool: connector-list");
      const innerFn = mockWrapToolResult.mock.calls[0][1];
      await expect(innerFn()).resolves.toEqual({
        connectors: [
          { name: "MyRest", description: "desc", type: "REST", active: true, amountOfCalls: 3 },
          { name: "MySoap", description: "", type: "SOAP", active: false, amountOfCalls: 0 }
        ],
        totalCount: 2
      });
    });
  });

  describe("connector-get", () => {
    it("forwards name with withEndpointConfigurations=true", async () => {
      mockSimplifierClient.getConnector.mockResolvedValue({ name: "MyRest" } as any);
      registerConnectorReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[1][4] as Function;

      await handler({ name: "MyRest" });

      expect(mockSimplifierClient.getConnector)
        .toHaveBeenCalledWith("MyRest", "MCP Tool: connector-get", true);
    });
  });

  describe("connector-call-list", () => {
    it("trims the call list appropriately", async () => {
      mockSimplifierClient.listConnectorCalls.mockResolvedValue({
        connectorCalls: [
          {
            name: "getUser",
            description: "Get user",
            amountOfInputParameters: 1,
            amountOfOutputParameters: 2,
            executable: true
          }
        ]
      } as any);
      registerConnectorReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[2][4] as Function;

      await handler({ connectorName: "MyRest" });

      expect(mockSimplifierClient.listConnectorCalls)
        .toHaveBeenCalledWith("MyRest", "MCP Tool: connector-call-list");
      const innerFn = mockWrapToolResult.mock.calls[0][1];
      await expect(innerFn()).resolves.toEqual({
        connectorName: "MyRest",
        calls: [{
          name: "getUser",
          description: "Get user",
          inputParameters: 1,
          outputParameters: 2,
          executable: true
        }],
        totalCount: 1
      });
    });
  });

  describe("connector-call-get", () => {
    it("forwards connectorName + callName + tracking key", async () => {
      mockSimplifierClient.getConnectorCall.mockResolvedValue({ name: "c" } as any);
      registerConnectorReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[3][4] as Function;

      await handler({ connectorName: "MyRest", callName: "getUser" });

      expect(mockSimplifierClient.getConnectorCall)
        .toHaveBeenCalledWith("MyRest", "getUser", "MCP Tool: connector-call-get");
    });
  });
});
