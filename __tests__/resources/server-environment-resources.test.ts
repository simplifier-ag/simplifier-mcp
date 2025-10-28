import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerServerEnvironmentResources } from "../../src/resources/server-environment-resources.js";
import { wrapResourceResult } from "../../src/resources/resourcesresult.js";
import { SimplifierInstance } from "../../src/client/types.js";

// Mock the wrapResourceResult function
jest.mock("../../src/resources/resourcesresult.js", () => ({
  wrapResourceResult: jest.fn()
}));

describe('registerServerEnvironmentResources', () => {
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
      getInstanceSettings: jest.fn()
    } as any;

    // Get the mocked wrapResourceResult
    mockWrapResourceResult = wrapResourceResult as jest.MockedFunction<typeof wrapResourceResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('resource registration', () => {
    it('should register active-endpoint resource', () => {
      registerServerEnvironmentResources(mockServer, mockSimplifierClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(1);

      expect(mockServer.resource).toHaveBeenCalledWith(
        "active-instance",
        "simplifier://server-active-instance",
        expect.objectContaining({
          title: "Get the active server instance",
          mimeType: "application/json",
          description: expect.any(String)
        }),
        expect.any(Function)
      );
    });

    it('should have correct metadata', () => {
      registerServerEnvironmentResources(mockServer, mockSimplifierClient);

      const resourceCall = mockServer.resource.mock.calls[0];
      const metadata = resourceCall[2];

      expect(metadata.title).toBe("Get the active server instance");
      expect(metadata.mimeType).toBe("application/json");
      expect(metadata.description).toContain("Get the active server instance");
    });
  });

  describe('resource handler', () => {
    let resourceHandler: Function;

    beforeEach(() => {
      registerServerEnvironmentResources(mockServer, mockSimplifierClient);
      resourceHandler = mockServer.resource.mock.calls[0][3];
    });

    it('should return the active server instance', async () => {
      const mockInstances: SimplifierInstance[] = [
        {
          name: "Production",
          url: "https://prod.simplifier.io",
          description: "Production environment",
          type: "production",
          active: false
        },
        {
          name: "Development",
          url: "http://localhost:8080",
          description: "Development environment",
          type: "development",
          active: true
        }
      ];

      mockSimplifierClient.getInstanceSettings.mockResolvedValue(mockInstances);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://server-active-instance", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://server-active-instance');
      await resourceHandler(testUri);

      expect(mockSimplifierClient.getInstanceSettings).toHaveBeenCalled();
      expect(mockWrapResourceResult).toHaveBeenCalledWith(
        testUri,
        expect.any(Function)
      );
      expect(capturedResult).toEqual({
        name: "Development",
        url: "http://localhost:8080",
        description: "Development environment",
        type: "development",
        active: true
      });
    });

    it('should throw error when no active instance exists', async () => {
      const mockInstances: SimplifierInstance[] = [
        {
          name: "Production",
          url: "https://prod.simplifier.io",
          description: "Production environment",
          type: "production",
          active: false
        },
        {
          name: "Staging",
          url: "https://staging.simplifier.io",
          description: "Staging environment",
          type: "staging",
          active: false
        }
      ];

      mockSimplifierClient.getInstanceSettings.mockResolvedValue(mockInstances);

      let caughtError: Error | undefined;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        try {
          await fn();
          return {
            contents: [{ uri: "simplifier://server-active-instance", text: "Success", mimeType: "application/json" }]
          };
        } catch (error) {
          caughtError = error as Error;
          throw error;
        }
      });

      const testUri = new URL('simplifier://server-active-instance');

      await expect(resourceHandler(testUri)).rejects.toThrow("The server currently does not define an active instance");
      expect(caughtError).toBeDefined();
      expect(caughtError?.message).toBe("The server currently does not define an active instance");
    });

    it('should throw error when instances list is empty', async () => {
      const mockInstances: SimplifierInstance[] = [];

      mockSimplifierClient.getInstanceSettings.mockResolvedValue(mockInstances);

      let caughtError: Error | undefined;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        try {
          await fn();
          return {
            contents: [{ uri: "simplifier://server-active-instance", text: "Success", mimeType: "application/json" }]
          };
        } catch (error) {
          caughtError = error as Error;
          throw error;
        }
      });

      const testUri = new URL('simplifier://server-active-instance');

      await expect(resourceHandler(testUri)).rejects.toThrow("The server currently does not define an active instance");
      expect(caughtError).toBeDefined();
      expect(caughtError?.message).toBe("The server currently does not define an active instance");
    });

    it('should handle single active instance', async () => {
      const mockInstances: SimplifierInstance[] = [
        {
          name: "OnlyInstance",
          url: "http://localhost:8087",
          description: "The only instance",
          type: "local",
          active: true
        }
      ];

      mockSimplifierClient.getInstanceSettings.mockResolvedValue(mockInstances);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://server-active-instance", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://server-active-instance');
      await resourceHandler(testUri);

      expect(capturedResult).toEqual({
        name: "OnlyInstance",
        url: "http://localhost:8087",
        description: "The only instance",
        type: "local",
        active: true
      });
    });

    it('should include all instance fields', async () => {
      const mockInstances: SimplifierInstance[] = [
        {
          name: "TestInstance",
          url: "http://test.local:8080",
          description: "Test environment",
          type: "test",
          active: true
        }
      ];

      mockSimplifierClient.getInstanceSettings.mockResolvedValue(mockInstances);

      let capturedResult: any;
      mockWrapResourceResult.mockImplementation(async (_uri, fn) => {
        capturedResult = await fn();
        return {
          contents: [{ uri: "simplifier://server-active-instance", text: JSON.stringify(capturedResult), mimeType: "application/json" }]
        };
      });

      const testUri = new URL('simplifier://server-active-instance');
      await resourceHandler(testUri);

      expect(capturedResult).toHaveProperty('name');
      expect(capturedResult).toHaveProperty('url');
      expect(capturedResult).toHaveProperty('description');
      expect(capturedResult).toHaveProperty('type');
      expect(capturedResult).toHaveProperty('active');
      expect(capturedResult.active).toBe(true);
    });
  });

  describe('error handling', () => {
    let resourceHandler: Function;

    beforeEach(() => {
      registerServerEnvironmentResources(mockServer, mockSimplifierClient);
      resourceHandler = mockServer.resource.mock.calls[0][3];
    });

    it('should handle API errors through wrapResourceResult', async () => {
      mockSimplifierClient.getInstanceSettings.mockRejectedValue(
        new Error("Failed to fetch instance settings")
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

      const testUri = new URL('simplifier://server-active-instance');
      await resourceHandler(testUri);

      expect(mockSimplifierClient.getInstanceSettings).toHaveBeenCalled();
      expect(mockWrapResourceResult).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockSimplifierClient.getInstanceSettings.mockRejectedValue(
        new Error("Network error: ECONNREFUSED")
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
              text: JSON.stringify({ error: (error as Error).message }),
              mimeType: "application/json"
            }]
          };
        }
      });

      const testUri = new URL('simplifier://server-active-instance');
      await resourceHandler(testUri);

      expect(mockSimplifierClient.getInstanceSettings).toHaveBeenCalled();
      expect(mockWrapResourceResult).toHaveBeenCalled();
    });
  });
});
