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
      updateLoginMethod: jest.fn(),
      listOAuth2Clients: jest.fn()
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

  describe('Token LoginMethod - create and update', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should create Token with PROVIDED source', async () => {
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

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.createLoginMethod).toHaveBeenCalledWith(expectedRequest);
    });

    it('should not include changeToken in Token create request', async () => {
      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Test",
        token: "secret",
        changeToken: true // This should be ignored for creation
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

      // Should not include changeToken for creation
      expect(request.sourceConfiguration).not.toHaveProperty('changeToken');
    });

    it('should update Token description without changing token', async () => {
      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Updated description only",
        token: "<not relevant>",
        changeToken: false
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "TokenProvided",
        description: "Old description",
        loginMethodType: {
          technicalName: "Token",
          i18n: "Token",
          descriptionI18n: "Token-based authentication",
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

      expect((request.sourceConfiguration as any).changeToken).toBe(false);
      expect(request.description).toBe("Updated description only");
    });

    it('should update Token with changeToken set to true', async () => {
      const testParams = {
        loginMethodType: "Token" as const,
        sourceType: "Provided" as const,
        name: "TokenProvided",
        description: "Changing token",
        token: "newSecretToken456",
        changeToken: true
      };

      const existingLoginMethod: SimplifierLoginMethodDetailsRaw = {
        name: "TokenProvided",
        description: "Changing token",
        loginMethodType: {
          technicalName: "Token",
          i18n: "Token",
          descriptionI18n: "Token-based authentication",
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

      expect((request.sourceConfiguration as any).changeToken).toBe(true);
      expect((request.sourceConfiguration as any).token).toBe("newSecretToken456");
    });
  });


  describe('OAuth2 client name validation', () => {
    let toolHandler: Function;

    beforeEach(() => {
      registerLoginMethodTools(mockServer, mockSimplifierClient);
      toolHandler = mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
    });

    it('should succeed when OAuth2 Default source has valid client name', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth with valid client",
        oauth2ClientName: "infraOIDC"
      };

      // Mock available OAuth2 clients
      mockSimplifierClient.listOAuth2Clients.mockResolvedValue({
        authSettings: [
          { name: "infraOIDC", mechanism: "OAuth2", description: "Test client", hasIcon: false },
          { name: "testClient", mechanism: "OAuth2", description: "Another client", hasIcon: false }
        ]
      });

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should fail when OAuth2 Default source has invalid client name', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth with invalid client",
        oauth2ClientName: "nonExistentClient"
      };

      // Mock available OAuth2 clients
      mockSimplifierClient.listOAuth2Clients.mockResolvedValue({
        authSettings: [
          { name: "infraOIDC", mechanism: "OAuth2", description: "Test client", hasIcon: false },
          { name: "testClient", mechanism: "OAuth2", description: "Another client", hasIcon: false }
        ]
      });

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        try {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        } catch (error: any) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: error.message })
            }]
          };
        }
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).not.toHaveBeenCalled();
    });

    it('should fail when OAuth2 Default source missing client name', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth without client name"
        // oauth2ClientName is missing
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        try {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        } catch (error: any) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: error.message })
            }]
          };
        }
      });

      await toolHandler(testParams);

      // Mapper throws error before validation runs, so listOAuth2Clients is never called
      expect(mockSimplifierClient.listOAuth2Clients).not.toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).not.toHaveBeenCalled();
    });

    it('should succeed when OAuth2 Reference source has valid client name', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Reference" as const,
        name: "MyOAuth",
        description: "OAuth with reference",
        oauth2ClientName: "testClient"
      };

      // Mock available OAuth2 clients
      mockSimplifierClient.listOAuth2Clients.mockResolvedValue({
        authSettings: [
          { name: "infraOIDC", mechanism: "OAuth2", description: "Test client", hasIcon: false },
          { name: "testClient", mechanism: "OAuth2", description: "Another client", hasIcon: false }
        ]
      });

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should fail when OAuth2 Reference source has invalid client name', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Reference" as const,
        name: "MyOAuth",
        description: "OAuth with bad reference",
        oauth2ClientName: "badClient"
      };

      // Mock available OAuth2 clients
      mockSimplifierClient.listOAuth2Clients.mockResolvedValue({
        authSettings: [
          { name: "infraOIDC", mechanism: "OAuth2", description: "Test client", hasIcon: false },
          { name: "testClient", mechanism: "OAuth2", description: "Another client", hasIcon: false }
        ]
      });

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        try {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        } catch (error: any) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: error.message })
            }]
          };
        }
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).not.toHaveBeenCalled();
    });

    it('should skip validation for OAuth2 ProfileReference source', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "ProfileReference" as const,
        name: "MyOAuth",
        description: "OAuth from profile",
        profileKey: "myOAuthKey"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      // Should NOT call listOAuth2Clients for ProfileReference
      expect(mockSimplifierClient.listOAuth2Clients).not.toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should skip validation for OAuth2 UserAttributeReference source', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "UserAttributeReference" as const,
        name: "MyOAuth",
        description: "OAuth from user attribute",
        userAttributeName: "oauthAttr",
        userAttributeCategory: "auth"
      };

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createLoginMethod.mockResolvedValue("Created");

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        await fn();
        return { content: [{ type: "text", text: "Created" }] };
      });

      await toolHandler(testParams);

      // Should NOT call listOAuth2Clients for UserAttributeReference
      expect(mockSimplifierClient.listOAuth2Clients).not.toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).toHaveBeenCalled();
    });

    it('should handle empty OAuth2 client list', async () => {
      const testParams = {
        loginMethodType: "OAuth2" as const,
        sourceType: "Default" as const,
        name: "MyOAuth",
        description: "OAuth with no clients available",
        oauth2ClientName: "anyClient"
      };

      // Mock empty OAuth2 clients list
      mockSimplifierClient.listOAuth2Clients.mockResolvedValue({
        authSettings: []
      });

      mockSimplifierClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));

      mockWrapToolResult.mockImplementation(async (_caption, fn) => {
        try {
          await fn();
          return { content: [{ type: "text", text: "Success" }] };
        } catch (error: any) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: error.message })
            }]
          };
        }
      });

      await toolHandler(testParams);

      expect(mockSimplifierClient.listOAuth2Clients).toHaveBeenCalled();
      expect(mockSimplifierClient.createLoginMethod).not.toHaveBeenCalled();
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
});
