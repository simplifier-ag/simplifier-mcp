import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { readFile } from "../../src/resourceprovider.js";
import {
  createMockServer,
  createMockSimplifierClient,
  createExistingLoginMethod,
  setupSuccessfulCreate,
  setupSuccessfulUpdate,
  getRegisterToolHandler,
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

describe('registerLoginMethodTools - Token LoginMethod', () => {
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockReturnValue("This is the login method documentation content");
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create Token with PROVIDED source', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getRegisterToolHandler(mockServer);

      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Token with provided token value",
        token: "mySecretToken123"
      };

      const expectedRequest = {
        name: "TokenProvided",
        description: "Token with provided token value",
        loginMethodType: "Token",
        source: 1,
        target: 0,
        sourceConfiguration: {
          token: "mySecretToken123"
        }
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      expect(mockClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should not include changeToken in Token create request', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getRegisterToolHandler(mockServer);

      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Test",
        token: "secret",
        changeToken: true // This should be ignored for creation
      };

      setupSuccessfulCreate(mockClient, "Created");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      // Should not include changeToken for creation
      expect(request.sourceConfiguration).not.toHaveProperty('changeToken');
    });
  });

  describe('update', () => {
    it('should update Token description without changing token', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getRegisterToolHandler(mockServer);

      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Updated description only",
        token: "<not relevant>",
        changeToken: false
      };

      const existingLoginMethod = createExistingLoginMethod("Token", {
        name: "TokenProvided",
        description: "Old description"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changeToken).toBe(false);
      expect(request.description).toBe("Updated description only");
    });

    it('should update Token with changeToken set to true', async () => {
      const mockServer = createMockServer();
      const mockClient = createMockSimplifierClient();

      registerLoginMethodTools(mockServer, mockClient);
      const toolHandler = getRegisterToolHandler(mockServer);

      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Changing token",
        token: "newSecretToken456",
        changeToken: true
      };

      const existingLoginMethod = createExistingLoginMethod("Token", {
        name: "TokenProvided",
        description: "Changing token"
      });

      setupSuccessfulUpdate(mockClient, existingLoginMethod, "Updated");
      mockWrapToolResult.mockImplementation(mockWrapToolResultSimpleSuccess);

      await toolHandler(testParams);

      const callArgs = mockClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changeToken).toBe(true);
      expect((request.sourceConfiguration as any).token).toBe("newSecretToken456");
    });
  });
});
