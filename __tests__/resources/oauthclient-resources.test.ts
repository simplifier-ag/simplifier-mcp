import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerOAuth2ClientResources } from "../../src/resources/oauthclient-resources.js";
import { wrapResourceResult } from "../../src/resources/resourcesresult.js";
import { SimplifierOAuth2ClientsResponse } from "../../src/client/types.js";

// Mock the wrapResourceResult function
jest.mock("../../src/resources/resourcesresult.js", () => ({
  wrapResourceResult: jest.fn()
}));

describe('registerOAuth2ClientResources', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapResourceResult: jest.MockedFunction<typeof wrapResourceResult>;

  beforeEach(() => {
    // Create a mock McpServer
    mockServer = {
      resource: jest.fn()
    } as any;

    // Create a mock SimplifierClient
    mockSimplifierClient = {
      listOAuth2Clients: jest.fn()
    } as any;

    // Get the mocked wrapResourceResult
    mockWrapResourceResult = wrapResourceResult as jest.MockedFunction<typeof wrapResourceResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('resource registration', () => {
    it('should register oauthclients-list resource', () => {
      registerOAuth2ClientResources(mockServer, mockSimplifierClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(1);

      expect(mockServer.resource).toHaveBeenCalledWith(
        "oauthclients-list",
        "simplifier://oauthclients",
        expect.objectContaining({
          title: "List All OAuth2 Clients",
          mimeType: "application/json",
          description: expect.stringContaining("OAuth2 Clients")
        }),
        expect.any(Function)
      );
    });

    it('should have correct metadata', () => {
      registerOAuth2ClientResources(mockServer, mockSimplifierClient);

      const resourceCall = mockServer.resource.mock.calls[0];
      const metadata = resourceCall[2];

      expect(metadata.title).toBe("List All OAuth2 Clients");
      expect(metadata.mimeType).toBe("application/json");
      expect(metadata.description).toContain("OAuth2 Clients");
      expect(metadata.description).toContain("clientName");
    });
  });

  describe('resource handler', () => {
    let resourceHandler: Function;

    beforeEach(() => {
      registerOAuth2ClientResources(mockServer, mockSimplifierClient);
      resourceHandler = mockServer.resource.mock.calls[0][3];
    });

    it('should return list of OAuth2 clients', async () => {
      const mockResponse: SimplifierOAuth2ClientsResponse = {
        authSettings: [
          {
            name: "infraOIDC",
            mechanism: "OAuth2",
            description: "Infrastructure OIDC",
            hasIcon: false
          },
          {
            name: "Spotify",
            mechanism: "OAuth2",
            description: "Spotify OAuth",
            hasIcon: true
          }
        ]
      };

      mockSimplifierClient.listOAuth2Clients.mockResolvedValue(mockResponse);

      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        const result = await fn();
        return {
          contents: [{ uri: "simplifier://oauthclients", text: JSON.stringify(result), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockWrapResourceResult).toHaveBeenCalledWith(
        testUri,
        expect.any(Function)
      );
    });

    it('should format OAuth2 clients correctly', async () => {
      const mockResponse: SimplifierOAuth2ClientsResponse = {
        authSettings: [
          {
            name: "btpTest",
            mechanism: "OAuth2",
            description: "SAP BTP Test",
            hasIcon: false
          },
          {
            name: "vvoauth",
            mechanism: "OAuth2",
            description: "VV OAuth Provider",
            hasIcon: true
          }
        ]
      };

      mockSimplifierClient.listOAuth2Clients.mockResolvedValue(mockResponse);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://oauthclients", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      expect(capturedResult).toEqual({
        oauthClients: [
          {
            name: "btpTest",
            description: "SAP BTP Test",
            mechanism: "OAuth2",
            hasIcon: false
          },
          {
            name: "vvoauth",
            description: "VV OAuth Provider",
            mechanism: "OAuth2",
            hasIcon: true
          }
        ],
        totalCount: 2,
        usage: "Use the 'name' field as clientName when creating OAuth2 login methods"
      });
    });

    it('should include all client fields', async () => {
      const mockResponse: SimplifierOAuth2ClientsResponse = {
        authSettings: [
          {
            name: "testClient",
            mechanism: "OAuth2",
            description: "Test OAuth2 Client",
            hasIcon: true
          }
        ]
      };

      mockSimplifierClient.listOAuth2Clients.mockResolvedValue(mockResponse);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://oauthclients", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      const firstClient = capturedResult.oauthClients[0];
      expect(firstClient).toHaveProperty('name');
      expect(firstClient).toHaveProperty('description');
      expect(firstClient).toHaveProperty('mechanism');
      expect(firstClient).toHaveProperty('hasIcon');
      expect(firstClient.mechanism).toBe('OAuth2');
    });

    it('should handle empty OAuth2 clients list', async () => {
      const mockResponse: SimplifierOAuth2ClientsResponse = {
        authSettings: []
      };

      mockSimplifierClient.listOAuth2Clients.mockResolvedValue(mockResponse);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://oauthclients", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      expect(capturedResult).toEqual({
        oauthClients: [],
        totalCount: 0,
        usage: "Use the 'name' field as clientName when creating OAuth2 login methods"
      });
    });

    it('should include usage hint in response', async () => {
      const mockResponse: SimplifierOAuth2ClientsResponse = {
        authSettings: [
          {
            name: "testClient",
            mechanism: "OAuth2",
            description: "Test",
            hasIcon: false
          }
        ]
      };

      mockSimplifierClient.listOAuth2Clients.mockResolvedValue(mockResponse);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://oauthclients", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      expect(capturedResult.usage).toBe("Use the 'name' field as clientName when creating OAuth2 login methods");
    });

    it('should correctly count total OAuth2 clients', async () => {
      const mockResponse: SimplifierOAuth2ClientsResponse = {
        authSettings: [
          { name: "client1", mechanism: "OAuth2", description: "Client 1", hasIcon: false },
          { name: "client2", mechanism: "OAuth2", description: "Client 2", hasIcon: false },
          { name: "client3", mechanism: "OAuth2", description: "Client 3", hasIcon: true },
          { name: "client4", mechanism: "OAuth2", description: "Client 4", hasIcon: false },
          { name: "client5", mechanism: "OAuth2", description: "Client 5", hasIcon: true }
        ]
      };

      mockSimplifierClient.listOAuth2Clients.mockResolvedValue(mockResponse);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://oauthclients", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      expect(capturedResult.totalCount).toBe(5);
      expect(capturedResult.oauthClients).toHaveLength(5);
    });
  });

  describe('error handling', () => {
    let resourceHandler: Function;

    beforeEach(() => {
      registerOAuth2ClientResources(mockServer, mockSimplifierClient);
      resourceHandler = mockServer.resource.mock.calls[0][3];
    });

    it('should handle API errors through wrapResourceResult', async () => {
      mockSimplifierClient.listOAuth2Clients.mockRejectedValue(
        new Error("Failed to fetch OAuth2 clients")
      );

      mockWrapResourceResult.mockImplementation(async (uri, fn) => {
        try {
          await fn();
          return {
            contents: [{ uri: uri.toString(), text: "Success", mimeType: "application/json" }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.toString(),
              text: JSON.stringify({ error: `Failed: ${error}` }),
              mimeType: "application/json"
            }]
          };
        }
      });

      const testUri = new URL('simplifier://oauthclients');
      await resourceHandler(testUri);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockWrapResourceResult).toHaveBeenCalled();
    });
  });
});
