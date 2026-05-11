import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerLoginMethodReadTools } from "../../src/tools/loginmethod-read-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";

jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe("registerLoginMethodReadTools", () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
    mockSimplifierClient = {
      listLoginMethods: jest.fn(),
      getLoginMethodDetails: jest.fn(),
      listOAuth2Clients: jest.fn()
    } as any;
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    jest.clearAllMocks();
    mockWrapToolResult.mockImplementation(async (_caption, fn) => {
      const result = await fn();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
  });

  it("registers three read tools", () => {
    registerLoginMethodReadTools(mockServer, mockSimplifierClient);
    expect(mockServer.tool.mock.calls.map(c => c[0])).toEqual([
      "loginmethod-list",
      "loginmethod-get",
      "oauthclient-list"
    ]);
  });

  describe("loginmethod-list", () => {
    it("returns trimmed login methods", async () => {
      mockSimplifierClient.listLoginMethods.mockResolvedValue({
        loginMethods: [
          {
            name: "MyBasic",
            description: "basic",
            loginMethodType: { technicalName: "UserCredentials", supportedConnectors: ["REST"] }
          }
        ]
      } as any);
      registerLoginMethodReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[0][4] as Function;
      await handler({});
      const innerFn = mockWrapToolResult.mock.calls[0][1];
      await expect(innerFn()).resolves.toEqual({
        loginMethods: [{
          name: "MyBasic",
          description: "basic",
          type: "UserCredentials",
          supportedConnectors: ["REST"]
        }],
        totalCount: 1
      });
    });
  });

  describe("loginmethod-get", () => {
    it("resolves source/target ids to names", async () => {
      mockSimplifierClient.getLoginMethodDetails.mockResolvedValue({
        name: "MyBasic",
        description: "basic",
        source: 1,
        target: 2,
        sourceConfiguration: { username: "u" },
        targetConfiguration: undefined,
        configuration: {},
        loginMethodType: {
          technicalName: "UserCredentials",
          sources: [{ id: 1, name: "Provided" }],
          targets: [{ id: 2, name: "Default" }],
          supportedConnectors: ["REST"]
        }
      } as any);

      registerLoginMethodReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[1][4] as Function;
      await handler({ name: "MyBasic" });

      expect(mockSimplifierClient.getLoginMethodDetails)
        .toHaveBeenCalledWith("MyBasic", "MCP Tool: loginmethod-get");

      const innerFn = mockWrapToolResult.mock.calls[0][1];
      const result = await innerFn() as any;
      expect(result.source).toEqual({ id: 1, name: "Provided" });
      expect(result.target).toEqual({ id: 2, name: "Default" });
      expect(result.type).toBe("UserCredentials");
    });
  });

  describe("oauthclient-list", () => {
    it("trims OAuth client list", async () => {
      mockSimplifierClient.listOAuth2Clients.mockResolvedValue({
        authSettings: [
          { name: "spotify", description: "Spotify", mechanism: "OAuth2", hasIcon: true }
        ]
      } as any);
      registerLoginMethodReadTools(mockServer, mockSimplifierClient);
      const handler = mockServer.tool.mock.calls[2][4] as Function;
      await handler({});
      const innerFn = mockWrapToolResult.mock.calls[0][1];
      await expect(innerFn()).resolves.toEqual({
        oauthClients: [{ name: "spotify", description: "Spotify", mechanism: "OAuth2", hasIcon: true }],
        totalCount: 1
      });
    });
  });
});
