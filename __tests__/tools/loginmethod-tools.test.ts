import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { readFile } from "../../src/resourceprovider.js";
import { SimplifierLoginMethodDetailsRaw } from "../../src/client/types.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

// Mock the resourceprovider
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: jest.fn()
}));

describe('registerLoginMethodTools', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockSimplifierClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<typeof wrapToolResult>;
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  // Named constants for server.tool() call indices
  const TOOL_CALL_INDEX = 0; // First (and only) tool registration call

  // Named constants for server.tool() argument positions
  const TOOL_ARG_SCHEMA = 2;
  const TOOL_ARG_HANDLER = 4;

  // Named constants for client method call positions
  const FIRST_CALL = 0;
  const FIRST_ARG = 0;
  const SECOND_ARG = 1;

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

    // Get the mocked functions
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

    // Setup default mock for readFile
    mockReadFile.mockReturnValue("This is the login method documentation content");

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

      const toolCall = mockServer.tool.mock.calls[TOOL_CALL_INDEX];
      const schema = toolCall[TOOL_ARG_SCHEMA];

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

      const toolCall = mockServer.tool.mock.calls[TOOL_CALL_INDEX];
      const schema = toolCall[TOOL_ARG_SCHEMA];

      // Test default value for changePassword
      expect(schema.changePassword.parse(undefined)).toBe(false);
    });

    it('should require name, description, and loginMethodType', () => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);

      const toolCall = mockServer.tool.mock.calls[TOOL_CALL_INDEX];
      const schema = toolCall[TOOL_ARG_SCHEMA];

      // Test that required fields throw on undefined
      expect(() => schema.name.parse(undefined)).toThrow();
      expect(() => schema.description.parse(undefined)).toThrow();
      expect(() => schema.loginMethodType.parse(undefined)).toThrow();

      // Test that username and password are optional
      expect(() => schema.username.parse(undefined)).not.toThrow();
      expect(() => schema.password.parse(undefined)).not.toThrow();
    });
  });

  describe('tool handler - create new login method', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create a new login method when it does not exist', async () => {
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
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      // Should not include changePassword for creation
      expect(request.sourceConfiguration).not.toHaveProperty('changePassword');
    });

    it('should return the success message from API', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should update existing login method when it exists', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changePassword).toBe(false);
      expect((request.sourceConfiguration as any).password).toBe("<not relevant>");
      expect(request.description).toBe("Updated description only");
    });

    it('should include changePassword when updating with new password', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).changePassword).toBe(true);
      expect((request.sourceConfiguration as any).password).toBe("newSecurePassword123");
    });

    it('should update username along with other fields', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.updateLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[SECOND_ARG];

      expect((request.sourceConfiguration as any).username).toBe("newAdmin");
    });
  });

  describe('error handling', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should handle errors through wrapToolResult', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should always use source ID 1 (Provided)', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request.source).toBe(1);
    });

    it('should always use target ID 0 (Default)', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request.target).toBe(0);
    });

    it('should always use UserCredentials loginMethodType', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "Provided" as const,
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

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request.loginMethodType).toBe("UserCredentials");
    });
  });

  // OAuth2 Tests
  describe('OAuth2 - ClientReference', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create OAuth2 login method with default header', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "ClientReference" as const,
        name: "TestOAuth",
        description: "OAuth with infraOIDC",
        oauth2ClientName: "infraOIDC",
        targetType: "Default" as const
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestOAuth",
        description: "OAuth with infraOIDC",
        loginMethodType: "OAuth2",
        source: 0,
        target: 0,
        sourceConfiguration: { clientName: "infraOIDC" }
      });
    });

    it('should create OAuth2 login method with custom header', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "ClientReference" as const,
        name: "TestOAuth",
        description: "OAuth with custom header",
        oauth2ClientName: "infraOIDC",
        targetType: "CustomHeader" as const,
        customHeaderName: "X-Custom-Auth"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestOAuth",
        description: "OAuth with custom header",
        loginMethodType: "OAuth2",
        source: 0,
        target: 1,
        sourceConfiguration: { clientName: "infraOIDC" },
        targetConfiguration: { name: "X-Custom-Auth" }
      });
    });

    it('should create OAuth2 login method with query parameter', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "ClientReference" as const,
        name: "TestOAuth",
        description: "OAuth as query param",
        oauth2ClientName: "infraOIDC",
        targetType: "QueryParameter" as const,
        queryParameterKey: "authToken"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestOAuth",
        description: "OAuth as query param",
        loginMethodType: "OAuth2",
        source: 0,
        target: 2,
        sourceConfiguration: { clientName: "infraOIDC" },
        targetConfiguration: { key: "authToken" }
      });
    });
  });

  describe('OAuth2 - ProfileReference', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create OAuth2 login method with profile reference', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "ProfileReference" as const,
        name: "TestOAuth",
        description: "OAuth from user profile",
        profileKey: "oauthToken",
        targetType: "Default" as const
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestOAuth",
        description: "OAuth from user profile",
        loginMethodType: "OAuth2",
        source: 4,
        target: 0,
        sourceConfiguration: { key: "oauthToken" }
      });
    });
  });

  describe('OAuth2 - UserAttributeReference', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create OAuth2 login method with user attribute reference', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "UserAttributeReference" as const,
        name: "TestOAuth",
        description: "OAuth from user attribute",
        userAttributeName: "myAttrName",
        userAttributeCategory: "myAttrCat",
        targetType: "Default" as const
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestOAuth",
        description: "OAuth from user attribute",
        loginMethodType: "OAuth2",
        source: 5,
        target: 0,
        sourceConfiguration: {
          name: "myAttrName",
          category: "myAttrCat"
        }
      });
    });
  });

  // UserCredentials with different source types
  describe('UserCredentials - ProfileReference', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create UserCredentials login method with profile reference', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "ProfileReference" as const,
        name: "TestBasicAuth",
        description: "BasicAuth from user profile",
        profileKey: "credentialsKey"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestBasicAuth",
        description: "BasicAuth from user profile",
        loginMethodType: "UserCredentials",
        source: 4,
        target: 0,
        sourceConfiguration: { key: "credentialsKey" }
      });
    });
  });

  describe('UserCredentials - UserAttributeReference', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create UserCredentials login method with user attribute reference', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        sourceType: "UserAttributeReference" as const,
        name: "TestBasicAuth",
        description: "BasicAuth from user attribute",
        userAttributeName: "myAttrName",
        userAttributeCategory: "myAttrCat"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request).toEqual({
        name: "TestBasicAuth",
        description: "BasicAuth from user attribute",
        loginMethodType: "UserCredentials",
        source: 5,
        target: 0,
        sourceConfiguration: {
          name: "myAttrName",
          category: "myAttrCat"
        }
      });
    });
  });

  // Test default sourceType values
  describe('Default sourceType values', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should default to "Provided" sourceType for UserCredentials when sourceType is omitted', async () => {
      const testParams = {
        loginMethodType: "UserCredentials" as const,
        // sourceType omitted - should default to "Provided"
        name: "TestBasicAuth",
        description: "BasicAuth with default source",
        username: "admin",
        password: "password"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request.source).toBe(1); // Provided source
      expect(request.sourceConfiguration).toHaveProperty('username');
      expect(request.sourceConfiguration).toHaveProperty('password');
    });

    it('should default to "ClientReference" sourceType for OAuth2 when sourceType is omitted', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        // sourceType omitted - should default to "ClientReference"
        name: "TestOAuth",
        description: "OAuth with default source",
        oauth2ClientName: "infraOIDC",
        targetType: "Default" as const
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      const callArgs = mockSimplifierClient.createLoginMethod.mock.calls[FIRST_CALL];
      const request = callArgs[FIRST_ARG];

      expect(request.source).toBe(0); // ClientReference source
      expect(request.sourceConfiguration).toHaveProperty('clientName');
    });
  });
});
