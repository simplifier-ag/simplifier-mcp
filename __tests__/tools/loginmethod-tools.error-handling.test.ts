import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { readFile } from "../../src/resourceprovider.js";
import {
  createMockServer,
  createMockSimplifierClient,
  createExistingLoginMethod,
  getRegisterToolHandler,
  mockWrapToolResultWithFullErrorCaption
} from "./loginmethod/shared-test-helpers.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

// Mock the resourceprovider
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: jest.fn()
}));

describe('registerLoginMethodTools - error handling', () => {
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockReturnValue("This is the login method documentation content");
    jest.clearAllMocks();
  });

  it('should handle errors through wrapToolResult', async () => {
    const mockServer = createMockServer();
    const mockClient = createMockSimplifierClient();

    registerLoginMethodTools(mockServer, mockClient);
    const toolHandler = getRegisterToolHandler(mockServer);

    const testParams = {
      loginMethodType: "UserCredentials" as const,
      sourceType: "Provided" as const,
      name: "ErrorAuth",
      description: "This will fail",
      username: "admin",
      password: "password"
    };

    // Mock that login method doesn't exist
    mockClient.getLoginMethodDetails.mockRejectedValue(
      new Error("Not found")
    );

    // Mock that creation fails
    mockClient.createLoginMethod.mockRejectedValue(
      new Error("Creation failed: Invalid credentials format")
    );

    // Mock wrapToolResult to handle the error
    mockWrapToolResult.mockImplementation(mockWrapToolResultWithFullErrorCaption);

    await toolHandler(testParams);

    expect(mockWrapToolResult).toHaveBeenCalledWith(
      "create or update Login Method ErrorAuth",
      expect.any(Function)
    );
  });

  it('should handle update errors', async () => {
    const mockServer = createMockServer();
    const mockClient = createMockSimplifierClient();

    registerLoginMethodTools(mockServer, mockClient);
    const toolHandler = getRegisterToolHandler(mockServer);

    const testParams = {
      loginMethodType: "UserCredentials" as const,
      sourceType: "Provided" as const,
      name: "ExistingAuth",
      description: "Update",
      username: "admin",
      password: "newpass",
      changePassword: true
    };

    const existingLoginMethod = createExistingLoginMethod("UserCredentials", {
      name: "ExistingAuth",
      description: "Old"
    });

    mockClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);
    mockClient.updateLoginMethod.mockRejectedValue(
      new Error("Update failed: Password policy violation")
    );

    mockWrapToolResult.mockImplementation(mockWrapToolResultWithFullErrorCaption);

    await toolHandler(testParams);

    expect(mockClient.updateLoginMethod).toHaveBeenCalled();
    expect(mockWrapToolResult).toHaveBeenCalled();
  });
});
