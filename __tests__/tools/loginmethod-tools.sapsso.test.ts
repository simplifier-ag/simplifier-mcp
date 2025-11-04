import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { readFile } from "../../src/resourceprovider.js";
import {
  createMockServer,
  createMockSimplifierClient,
  createExistingLoginMethod,
  setupSuccessfulCreate,
  setupSuccessfulUpdate,
  setupFailureScenario,
  getToolHandler,
  mockWrapToolResultSimpleSuccess,
  mockWrapToolResultWithErrorHandling,
  FIRST_CALL,
  FIRST_ARG,
  SECOND_ARG
} from "./loginmethod/shared-test-helpers.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

// Mock the resourceprovider
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: jest.fn()
}));

describe('registerLoginMethodTools - SingleSignOn/SAPSSO LoginMethod', () => {
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockReturnValue("This is the login method documentation content");
    jest.clearAllMocks();
  });

  describe('create - Default source', () => {
    it('should create SAPSSO with Default source (uses user logon ticket)', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Default" as const,
        name: "MySAPSSODefault",
        description: "SAPSSO with default source"
      };

      const expectedRequest = {
        name: "MySAPSSODefault",
        description: "SAPSSO with default source",
        loginMethodType: "SingleSignOn",
        source: 0,
        target: 0,
        sourceConfiguration: {}
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should create SAPSSO with Default source when no sourceType is specified', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        name: "MySAPSSODefault",
        description: "SAPSSO with default source"
      };

      const expectedRequest = {
        name: "MySAPSSODefault",
        description: "SAPSSO with default source",
        loginMethodType: "SingleSignOn",
        source: 0,
        target: 0,
        sourceConfiguration: {}
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });
  });

  describe('create - SystemReference source', () => {
    it('should create SAPSSO with SystemReference source (uses user logon ticket)', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "SystemReference" as const,
        name: "MySAPSSOSystemRef",
        description: "SAPSSO with system reference"
      };

      const expectedRequest = {
        name: "MySAPSSOSystemRef",
        description: "SAPSSO with system reference",
        loginMethodType: "SingleSignOn",
        source: 3,
        target: 0,
        sourceConfiguration: {}
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });
  });

  describe('create - Provided source', () => {
    it('should create SAPSSO with Provided source and ticket', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Provided" as const,
        name: "MySAPSSOProvided",
        description: "SAPSSO with provided ticket",
        ticket: "mySecretTicket123"
      };

      const expectedRequest = {
        name: "MySAPSSOProvided",
        description: "SAPSSO with provided ticket",
        loginMethodType: "SingleSignOn",
        source: 1,
        target: 0,
        sourceConfiguration: {
          ticket: "mySecretTicket123"
        }
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should not include changeTicket in SAPSSO create request', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Provided" as const,
        name: "MySAPSSOProvided",
        description: "Test",
        ticket: "secret",
        changeTicket: true // This should be ignored for creation
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      // Should not include changeTicket for creation
      expect(request.sourceConfiguration).not.toHaveProperty('changeTicket');
    });

    it('should throw error when ticket is missing for Provided source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Provided" as const,
        name: "MySAPSSOProvided",
        description: "SAPSSO without ticket"
        // ticket is missing
      };

      setupFailureScenario(mockClient, new Error("SAP-SSO Ticket Provided source requires 'ticket' field"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });

  describe('create - ProfileReference source', () => {
    it('should create SAPSSO with ProfileReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "ProfileReference" as const,
        name: "MySAPSSOProfile",
        description: "SAPSSO from user profile",
        profileKey: "apiTicket"
      };

      const expectedRequest = {
        name: "MySAPSSOProfile",
        description: "SAPSSO from user profile",
        loginMethodType: "SingleSignOn",
        source: 4,
        target: 0,
        sourceConfiguration: {
          key: "apiTicket"
        }
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should throw error when profileKey is missing for ProfileReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "ProfileReference" as const,
        name: "MySAPSSOProfile",
        description: "SAPSSO from profile without key"
        // profileKey is missing
      };

      setupFailureScenario(mockClient, new Error("SAP-SSO ProfileReference requires 'profileKey' field"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });

  describe('create - UserAttributeReference source', () => {
    it('should create SAPSSO with UserAttributeReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "UserAttributeReference" as const,
        name: "MySAPSSOUserAttr",
        description: "SAPSSO from user attribute",
        userAttributeName: "ticketAttribute",
        userAttributeCategory: "security"
      };

      const expectedRequest = {
        name: "MySAPSSOUserAttr",
        description: "SAPSSO from user attribute",
        loginMethodType: "SingleSignOn",
        source: 5,
        target: 0,
        sourceConfiguration: {
          name: "ticketAttribute",
          category: "security"
        }
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should throw error when userAttributeName is missing for UserAttributeReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "UserAttributeReference" as const,
        name: "MySAPSSOUserAttr",
        description: "SAPSSO from user attribute without name",
        userAttributeCategory: "security"
        // userAttributeName is missing
      };

      setupFailureScenario(mockClient, new Error("SAP-SSO UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });

    it('should throw error when userAttributeCategory is missing for UserAttributeReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "UserAttributeReference" as const,
        name: "MySAPSSOUserAttr",
        description: "SAPSSO from user attribute without category",
        userAttributeName: "ticketAttribute"
        // userAttributeCategory is missing
      };

      setupFailureScenario(mockClient, new Error("SAP-SSO UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });

  describe('update - Provided source', () => {
    it('should update SAPSSO description without changing ticket', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Provided" as const,
        name: "MySAPSSOProvided",
        description: "Updated description only",
        ticket: "<not relevant>",
        changeTicket: false
      };

      const existingLoginMethod = createExistingLoginMethod("SingleSignOn", {
        name: "MySAPSSOProvided",
        description: "Old description"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changeTicket).toBe(false);
      expect(request.description).toBe("Updated description only");
    });

    it('should update SAPSSO with changeTicket set to true', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Provided" as const,
        name: "MySAPSSOProvided",
        description: "Changing ticket",
        ticket: "newSecretTicket456",
        changeTicket: true
      };

      const existingLoginMethod = createExistingLoginMethod("SingleSignOn", {
        name: "MySAPSSOProvided",
        description: "Changing ticket"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changeTicket).toBe(true);
      expect((request.sourceConfiguration as any).ticket).toBe("newSecretTicket456");
    });
  });

  describe('update - other sources', () => {
    it('should update SAPSSO with Default source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Default" as const,
        name: "MySAPSSODefault",
        description: "Updated default SAPSSO"
      };

      const existingLoginMethod = createExistingLoginMethod("SingleSignOn", {
        name: "MySAPSSODefault",
        description: "Old description"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect(request.source).toBe(0);
      expect(request.sourceConfiguration).toEqual({});
    });

    it('should update SAPSSO with ProfileReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "ProfileReference" as const,
        name: "MySAPSSOProfile",
        description: "Updated profile reference",
        profileKey: "newApiTicket"
      };

      const existingLoginMethod = createExistingLoginMethod("SingleSignOn", {
        name: "MySAPSSOProfile",
        description: "Old description"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect(request.source).toBe(4);
      expect(request.sourceConfiguration).toEqual({ key: "newApiTicket" });
    });

    it('should update SAPSSO with UserAttributeReference source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "UserAttributeReference" as const,
        name: "MySAPSSOUserAttr",
        description: "Updated user attribute reference",
        userAttributeName: "newTicketAttr",
        userAttributeCategory: "auth"
      };

      const existingLoginMethod = createExistingLoginMethod("SingleSignOn", {
        name: "MySAPSSOUserAttr",
        description: "Old description"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect(request.source).toBe(5);
      expect(request.sourceConfiguration).toEqual({
        name: "newTicketAttr",
        category: "auth"
      });
    });
  });

  describe('target configuration', () => {
    it('should always use target 0 (Default) for SAPSSO', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Default" as const,
        name: "MySAPSSO",
        description: "SAPSSO with default target",
        targetType: "Default" as const
      };

      const expectedRequest = {
        name: "MySAPSSO",
        description: "SAPSSO with default target",
        loginMethodType: "SingleSignOn",
        source: 0,
        target: 0,
        sourceConfiguration: {}
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should ignore CustomHeader target type and use Default (0) for SAPSSO', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Default" as const,
        name: "MySAPSSO",
        description: "SAPSSO ignoring custom header",
        targetType: "CustomHeader" as const,
        customHeaderName: "X-Custom-Auth" // Should be ignored
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request.target).toBe(0);
      expect(request.targetConfiguration).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw error for unsupported source type', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "SingleSignOn" as const,
        sourceType: "Reference" as const, // Not supported for SAPSSO
        name: "MySAPSSO",
        description: "SAPSSO with unsupported source"
      };

      setupFailureScenario(mockClient, new Error("Unsupported sourceType for SAP-SSO: Reference"));
      mockWrapToolResult.mockImplementation(mockWrapToolResultWithErrorHandling);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
    });
  });
});
