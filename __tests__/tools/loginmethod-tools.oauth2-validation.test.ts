import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { readFile } from "../../src/resourceprovider.js";
import {
  createMockServer,
  createMockSimplifierClient,
  setupSuccessfulCreate,
  setupMockOAuth2Clients,
  setupEmptyOAuth2Clients,
  getToolHandler,
  mockWrapToolResultSimpleSuccess,
  mockWrapToolResultWithErrorHandling
} from "./loginmethod/shared-test-helpers.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

// Mock the resourceprovider
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: jest.fn()
}));

describe('registerLoginMethodTools - OAuth2 client name validation', () => {
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockReturnValue("This is the login method documentation content");
    jest.clearAllMocks();
  });

  describe('Default source', () => {
    it('should succeed when OAuth2 Default source has valid client name', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth with valid client",
        oauth2ClientName: "infraOIDC"
      };

      setupMockOAuth2Clients(mockClient, ["infraOIDC", "testClient"]);
      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should fail when OAuth2 Default source has invalid client name', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth with invalid client",
        oauth2ClientName: "nonExistentClient"
      };

      setupMockOAuth2Clients(mockClient, ["infraOIDC", "testClient"]);
      mockClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });

    it('should fail when OAuth2 Default source missing client name', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth without client name"
        // oauth2ClientName is missing
      };

      mockClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      // Mapper throws error before validation runs, so listOAuth2Clients is never called
      expect(mockClient.listOAuth2Clients).not.toHaveBeenCalled();
      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });

  describe('Reference source', () => {
    it('should succeed when OAuth2 Reference source has valid client name', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Reference" as const,
        name: "MyOAuth",
        description: "OAuth with reference",
        oauth2ClientName: "testClient"
      };

      setupMockOAuth2Clients(mockClient, ["infraOIDC", "testClient"]);
      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should fail when OAuth2 Reference source has invalid client name', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Reference" as const,
        name: "MyOAuth",
        description: "OAuth with bad reference",
        oauth2ClientName: "badClient"
      };

      setupMockOAuth2Clients(mockClient, ["infraOIDC", "testClient"]);
      mockClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });

  describe('Skip validation for other sources', () => {
    it('should skip validation for OAuth2 ProfileReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "ProfileReference" as const,
        name: "MyOAuth",
        description: "OAuth from profile",
        profileKey: "myOAuthKey"
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      // Should NOT call listOAuth2Clients for ProfileReference
      expect(mockClient.listOAuth2Clients).not.toHaveBeenCalled();
      expect(mockClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should skip validation for OAuth2 UserAttributeReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "UserAttributeReference" as const,
        name: "MyOAuth",
        description: "OAuth from user attribute",
        userAttributeName: "oauthAttr",
        userAttributeCategory: "auth"
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      // Should NOT call listOAuth2Clients for UserAttributeReference
      expect(mockClient.listOAuth2Clients).not.toHaveBeenCalled();
      expect(mockClient.createLoginMethod).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty OAuth2 client list', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth with no clients available",
        oauth2ClientName: "anyClient"
      };

      setupEmptyOAuth2Clients(mockClient);
      mockClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });
});
