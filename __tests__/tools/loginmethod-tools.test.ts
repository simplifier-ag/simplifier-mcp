import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SimplifierLoginMethodDetailsRaw } from "../../src/client/types.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe('registerLoginMethodTools', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;

  beforeEach(() => {
    // Create a mock McpServer
    mockServer = {
      tool: jest.fn()
    } as any;

    // Create a mock SimplifierClient
    mockSimplifierClient = {
      getLoginMethodDetails: jest.fn(),
      createLoginMethod: jest.fn(),
      updateLoginMethod: jest.fn()
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register loginmethod-update tool', () => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(1);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "loginmethod-update",
        expect.any(String),
        expect.objectContaining({
          name: expect.any(Object),
          description: expect.any(Object),
          username: expect.any(Object),
          password: expect.any(Object),
          changePassword: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Create or update a Login Method",
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true
        }),
        expect.any(Function)
      );
    });

    it('should validate required schema fields', () => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that schema validates required fields
      expect(schema.name).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.username).toBeDefined();
      expect(schema.password).toBeDefined();
      expect(schema.changePassword).toBeDefined();

      // Test valid data passes validation
      expect(() => schema.name.parse("MyLoginMethod")).not.toThrow();
      expect(() => schema.description.parse("Test description")).not.toThrow();
      expect(() => schema.username.parse("admin")).not.toThrow();
      expect(() => schema.password.parse("secretPassword")).not.toThrow();
      expect(() => schema.changePassword.parse(true)).not.toThrow();
    });

    it('should have default value for changePassword', () => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test default value for changePassword
      expect(schema.changePassword.parse(undefined)).toBe(false);
    });

    it('should require name, description, username, and password', () => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[0];
      const schema = toolCall[2];

      // Test that required fields throw on undefined
      expect(() => schema.name.parse(undefined)).toThrow();
      expect(() => schema.description.parse(undefined)).toThrow();
      expect(() => schema.username.parse(undefined)).toThrow();
      expect(() => schema.password.parse(undefined)).toThrow();
    });
  });

  describe('tool handler - create new login method', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should create a new login method when it does not exist', async () => {
      const testParams = {
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

      // Mock that login method doesn't exist (throws error)
      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(
        new Error("Not found")
      );

      // Mock successful creation
      mockSimplifierClient.createLoginMethod.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult to call the function and return result
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getLoginMethodDetails).toHaveBeenCalledWith("NewBasicAuth");
      expect(mockSimplifierClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
      expect(mockSimplifierClient.updateLoginMethod).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Login Method NewBasicAuth",
        expect.any(Function)
      );
    });

    it('should not include changePassword in create request', async () => {
      const testParams = {
        name: "NewBasicAuth",
        description: "Test",
        username: "admin",
        password: "secret",
        changePassword: true // This should be ignored for creation
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[0];
      const request = callArgs[0];

      // Should not include changePassword for creation
      expect(request.sourceConfiguration).not.toHaveProperty('changePassword');
    });

    it('should return the success message from API', async () => {
      const testParams = {
        name: "TestAuth",
        description: "Test login method",
        username: "testuser",
        password: "testpass"
      };

      const expectedResponse = "Successfully created Login Method 'TestAuth'";

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue(expectedResponse);

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

  describe('tool handler - update existing login method', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should update existing login method when it exists', async () => {
      const testParams = {
        name: "ExistingAuth",
        description: "Updated description",
        username: "admin",
        password: "newPassword",
        changePassword: true
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "ExistingAuth",
        description: "Old description",
        loginMethodType: {
          technicalName: "UserCredentials",
          i18n: "Basic Auth",
          descriptionI18n: "Username/Password",
          sources: [],
          targets: [],
          supportedConnectors: ["REST"]
        },
        source: 1,
        target: 0,
        sourceConfiguration: {
          username: "admin",
          password: "*****"
        },
        configuration: {}
      };

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

      // Mock that login method exists
      mockSimplifierClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);

      // Mock successful update
      mockSimplifierClient.updateLoginMethod.mockResolvedValue(expectedResponse);

      // Mock wrapToolResult
      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        const result = await fn();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.getLoginMethodDetails).toHaveBeenCalledWith("ExistingAuth");
      expect(mockSimplifierClient.updateLoginMethod).toHaveBeenCalledWith("ExistingAuth", expectedRequest);
      expect(mockSimplifierClient.createLoginMethod).not.toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Login Method ExistingAuth",
        expect.any(Function)
      );
    });

    it('should update description without changing password', async () => {
      const testParams = {
        name: "ExistingAuth",
        description: "Updated description only",
        username: "admin",
        password: "<not relevant>",
        changePassword: false
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "ExistingAuth",
        description: "Old description",
        loginMethodType: {
          technicalName: "UserCredentials",
          i18n: "Basic Auth",
          descriptionI18n: "Username/Password",
          sources: [],
          targets: [],
          supportedConnectors: ["REST"]
        },
        source: 1,
        target: 0,
        sourceConfiguration: {},
        configuration: {}
      };

      mockSimplifierClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);
      mockSimplifierClient.updateLoginMethod.mockResolvedValue("Updated");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Updated" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.updateLoginMethod.mock.calls[0];
      const request = callArgs[1];

      expect(request.sourceConfiguration.changePassword).toBe(false);
      expect(request.sourceConfiguration.password).toBe("<not relevant>");
      expect(request.description).toBe("Updated description only");
    });

    it('should include changePassword when updating with new password', async () => {
      const testParams = {
        name: "ExistingAuth",
        description: "Changing password",
        username: "admin",
        password: "newSecurePassword123",
        changePassword: true
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "ExistingAuth",
        description: "Changing password",
        loginMethodType: {
          technicalName: "UserCredentials",
          i18n: "Basic Auth",
          descriptionI18n: "Username/Password",
          sources: [],
          targets: [],
          supportedConnectors: ["REST"]
        },
        source: 1,
        target: 0,
        sourceConfiguration: {},
        configuration: {}
      };

      mockSimplifierClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);
      mockSimplifierClient.updateLoginMethod.mockResolvedValue("Updated");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Updated" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.updateLoginMethod.mock.calls[0];
      const request = callArgs[1];

      expect(request.sourceConfiguration.changePassword).toBe(true);
      expect(request.sourceConfiguration.password).toBe("newSecurePassword123");
    });

    it('should update username along with other fields', async () => {
      const testParams = {
        name: "ExistingAuth",
        description: "Updated",
        username: "newAdmin",
        password: "password",
        changePassword: false
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "ExistingAuth",
        description: "Old",
        loginMethodType: {
          technicalName: "UserCredentials",
          i18n: "Basic Auth",
          descriptionI18n: "Username/Password",
          sources: [],
          targets: [],
          supportedConnectors: ["REST"]
        },
        source: 1,
        target: 0,
        sourceConfiguration: {},
        configuration: {}
      };

      mockSimplifierClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);
      mockSimplifierClient.updateLoginMethod.mockResolvedValue("Updated");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Updated" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.updateLoginMethod.mock.calls[0];
      const request = callArgs[1];

      expect(request.sourceConfiguration.username).toBe("newAdmin");
    });
  });

  describe('error handling', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should handle errors through wrapToolResult', async () => {
      const testParams = {
        name: "ErrorAuth",
        description: "This will fail",
        username: "admin",
        password: "password"
      };

      // Mock that login method doesn't exist
      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(
        new Error("Not found")
      );

      // Mock that creation fails
      mockSimplifierClient.createLoginMethod.mockRejectedValue(
        new Error("Creation failed: Invalid credentials format")
      );

      // Mock wrapToolResult to handle the error
      mockWrapToolResult.mockImplementation(async (caption, fn) => {
        try {
          await fn();
          return {
            content: [{ type: "text", text: "Success" }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: `Tool ${caption} failed: ${error}` })
            }]
          };
        }
      });

      await toolHandler(testParams);

      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "create or update Login Method ErrorAuth",
        expect.any(Function)
      );
    });

    it('should handle update errors', async () => {
      const testParams = {
        name: "ExistingAuth",
        description: "Update",
        username: "admin",
        password: "newpass",
        changePassword: true
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "ExistingAuth",
        description: "Old",
        loginMethodType: {
          technicalName: "UserCredentials",
          i18n: "Basic Auth",
          descriptionI18n: "Username/Password",
          sources: [],
          targets: [],
          supportedConnectors: ["REST"]
        },
        source: 1,
        target: 0,
        sourceConfiguration: {},
        configuration: {}
      };

      mockSimplifierClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);
      mockSimplifierClient.updateLoginMethod.mockRejectedValue(
        new Error("Update failed: Password policy violation")
      );

      mockWrapToolResult.mockImplementation(async (caption, fn) => {
        try {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: `Tool ${caption} failed: ${error}` })
            }]
          };
        }
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.updateLoginMethod).toHaveBeenCalled();
      expect(mockWrapToolResult).toHaveBeenCalled();
    });
  });

  describe('request structure validation', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[0][4];
    });

    it('should always use source ID 1 (Provided)', async () => {
      const testParams = {
        name: "TestAuth",
        description: "Test",
        username: "user",
        password: "pass"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[0];
      const request = callArgs[0];

      expect(request.source).toBe(1);
    });

    it('should always use target ID 0 (Default)', async () => {
      const testParams = {
        name: "TestAuth",
        description: "Test",
        username: "user",
        password: "pass"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[0];
      const request = callArgs[0];

      expect(request.target).toBe(0);
    });

    it('should always use UserCredentials loginMethodType', async () => {
      const testParams = {
        name: "TestAuth",
        description: "Test",
        username: "user",
        password: "pass"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[0];
      const request = callArgs[0];

      expect(request.loginMethodType).toBe("UserCredentials");
    });
  });
});
