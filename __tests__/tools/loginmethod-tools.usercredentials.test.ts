import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { readFile } from "../../src/resourceprovider.js";
import {
  createMockServer,
  createMockSimplifierClient,
  createExistingLoginMethod,
  setupSuccessfulCreate,
  setupSuccessfulUpdate,
  getToolHandler,
  mockWrapToolResultSuccess,
  mockWrapToolResultSimpleSuccess,
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

describe('registerLoginMethodTools - UserCredentials LoginMethod', () => {
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockReturnValue("This is the login method documentation content");
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new login method when it does not exist', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "NewBasicAuth",
        description: "New basic auth login method",
        username: "admin",
        password: "mySecurePassword"
      };

      const expectedRequest = {
        name: "NewBasicAuth",
        description: "New basic auth login method",
        loginMethodType: "UserCredentials",
        source: 1,
        target: 0,
        sourceConfiguration: {
          username: "admin",
          password: "mySecurePassword"
        }
      };

      const expectedResponse = "Successfully created Login Method 'NewBasicAuth'";

      setupSuccessfulCreate(mockClient, expectedResponse);
      mockWrapToolResult.mockImplementation(mockWrapToolResultSuccess);

      await toolHandler(testParams);

      expect(mockClient.getLoginMethodDetails).toHaveBeenCalledWith("NewBasicAuth");
      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
      expect(mockClient.updateLoginMethod).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Login Method NewBasicAuth",
        expect.any(Function)
      );
    });

    it('should not include changePassword in create request', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "NewBasicAuth",
        description: "Test",
        username: "admin",
        password: "secret",
        changePassword: true // This should be ignored for creation
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      // Should not include changePassword for creation
      expect(request.sourceConfiguration).not.toHaveProperty('changePassword');
    });

    it('should return the success message from API', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "TestAuth",
        description: "Test login method",
        username: "testuser",
        password: "testpass"
      };

      const expectedResponse = "Successfully created Login Method 'TestAuth'";

      setupSuccessfulCreate(mockClient, expectedResponse);

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        expect(result).toBe(expectedResponse);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockWrapToolResult).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update existing login method when it exists', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "ExistingAuth",
        description: "Updated description",
        username: "admin",
        password: "newPassword",
        changePassword: true
      };

      const existingLoginMethod = createExistingLoginMethod("UserCredentials", {
        name: "ExistingAuth",
        description: "Old description",
        sourceConfiguration: {
          username: "admin",
          password: "*****"
        }
      });

      const expectedRequest = {
        name: "ExistingAuth",
        description: "Updated description",
        loginMethodType: "UserCredentials",
        source: 1,
        target: 0,
        sourceConfiguration: {
          username: "admin",
          password: "newPassword",
          changePassword: true
        }
      };

      const expectedResponse = "Successfully updated Login Method 'ExistingAuth'";

      setupSuccessfulUpdate(mockClient, existingLoginMethod, expectedResponse);
      mockWrapToolResult.mockImplementation(mockWrapToolResultSuccess);

      await toolHandler(testParams);

      expect(mockClient.getLoginMethodDetails).toHaveBeenCalledWith("ExistingAuth");
      expect(mockClient.updateLoginMethod).toHaveBeenCalledWith("ExistingAuth", expectedRequest);
      expect(mockClient.createLoginMethod).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Login Method ExistingAuth",
        expect.any(Function)
      );
    });

    it('should update description without changing password', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "ExistingAuth",
        description: "Updated description only",
        username: "admin",
        password: "<not relevant>",
        changePassword: false
      };

      const existingLoginMethod = createExistingLoginMethod("UserCredentials", {
        name: "ExistingAuth",
        description: "Old description"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changePassword).toBe(false);
      expect((request.sourceConfiguration as any).password).toBe("<not relevant>");
      expect(request.description).toBe("Updated description only");
    });

    it('should include changePassword when updating with new password', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "ExistingAuth",
        description: "Changing password",
        username: "admin",
        password: "newSecurePassword123",
        changePassword: true
      };

      const existingLoginMethod = createExistingLoginMethod("UserCredentials", {
        name: "ExistingAuth",
        description: "Changing password"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changePassword).toBe(true);
      expect((request.sourceConfiguration as any).password).toBe("newSecurePassword123");
    });

    it('should update username along with other fields', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getToolHandler(mockServer);

      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
        name: "ExistingAuth",
        description: "Updated",
        username: "newAdmin",
        password: "password",
        changePassword: false
      };

      const existingLoginMethod = createExistingLoginMethod("UserCredentials", {
        name: "ExistingAuth",
        description: "Old"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).username).toBe("newAdmin");
    });
  });
});
