import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../../src/client/simplifier-client.js";
import { SimplifierLoginMethodDetailsRaw } from "../../../src/client/types.js";

/**
 * Shared test helpers for LoginMethod tool tests
 * This file provides factories and utilities to reduce code duplication across test files
 */

// Named constants for server.tool() call indices
export const TOOL_CALL_INDEX = 0; // First (and only) tool registration call

// Named constants for server.tool() argument positions
export const TOOL_ARG_SCHEMA = 2;
export const TOOL_ARG_HANDLER = 4;

// Named constants for client method call positions
export const FIRST_CALL = 0;
export const FIRST_ARG = 0;
export const SECOND_ARG = 1;

/**
 * Creates a mock McpServer
 */
export function createMockServer(): jest.Mocked<McpServer> {
  return {
    tool: jest.fn()
  } as any;
}

/**
 * Creates a mock SimplifierClient with optional method overrides
 */
export function createMockSimplifierClient(overrides?: Partial<SimplifierClient>): jest.Mocked<SimplifierClient> {
  return {
    getLoginMethodDetails: jest.fn(),
    createLoginMethod: jest.fn(),
    updateLoginMethod: jest.fn(),
    listOAuth2Clients: jest.fn(),
    ...overrides
  } as any;
}

/**
 * Creates a mock existing login method for testing updates
 */
export function createExistingLoginMethod(
  loginMethodType: "UserCredentials" | "OAuth2" | "Token" | "SingleSignOn",
  overrides?: Partial<SimplifierLoginMethodDetailsRaw>
): SimplifierLoginMethodDetailsRaw {
  const typeConfig = {
    UserCredentials: {
      technicalName: "UserCredentials",
      i18n: "Basic Auth",
      descriptionI18n: "Username/Password"
    },
    OAuth2: {
      technicalName: "OAuth2",
      i18n: "OAuth2",
      descriptionI18n: "OAuth2-based authentication"
    },
    Token: {
      technicalName: "Token",
      i18n: "Token",
      descriptionI18n: "Token-based authentication"
    },
    SingleSignOn: {
      technicalName: "SingleSignOn",
      i18n: "SAP SSO",
      descriptionI18n: "SAP Single Sign-On"
    }
  };

  return {
    name: "ExistingAuth",
    description: "Old description",
    loginMethodType: {
      ...typeConfig[loginMethodType],
      sources: [],
      targets: [],
      supportedConnectors: ["REST"]
    },
    source: 1,
    target: 0,
    sourceConfiguration: {},
    configuration: {},
    ...overrides
  };
}

/**
 * Sets up mocks for a successful create scenario
 */
export function setupSuccessfulCreate(
  mockClient: jest.Mocked<SimplifierClient>,
  response: string = "Created"
): void {
  mockClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
  mockClient.createLoginMethod.mockResolvedValue(response);
}

/**
 * Sets up mocks for a successful update scenario
 */
export function setupSuccessfulUpdate(
  mockClient: jest.Mocked<SimplifierClient>,
  existingLoginMethod: SimplifierLoginMethodDetailsRaw,
  response: string = "Updated"
): void {
  mockClient.getLoginMethodDetails.mockResolvedValue(existingLoginMethod);
  mockClient.updateLoginMethod.mockResolvedValue(response);
}

/**
 * Sets up mocks for a failure scenario
 */
export function setupFailureScenario(
  mockClient: jest.Mocked<SimplifierClient>,
  error: Error
): void {
  mockClient.getLoginMethodDetails.mockRejectedValue(new Error("Not found"));
  mockClient.createLoginMethod.mockRejectedValue(error);
}

/**
 * Mock implementation for wrapToolResult that returns success
 */
export const mockWrapToolResultSuccess = async (_caption: string, fn: Function): Promise<any> => {
  const result = await fn();
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
  };
};

/**
 * Mock implementation for wrapToolResult that returns success (simplified)
 */
export const mockWrapToolResultSimpleSuccess = async (_caption: string, fn: Function): Promise<any> => {
  await fn();
  return { content: [{ type: "text" as const, text: "Created" }] };
};

/**
 * Mock implementation for wrapToolResult that handles errors
 */
export const mockWrapToolResultWithErrorHandling = async (_caption: string, fn: Function): Promise<any> => {
  try {
    await fn();
    return { content: [{ type: "text" as const, text: "Success" }] };
  } catch (error: any) {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ error: error.message })
      }]
    };
  }
};

/**
 * Mock implementation for wrapToolResult that handles errors with full caption
 */
export const mockWrapToolResultWithFullErrorCaption = async (caption: string, fn: Function): Promise<any> => {
  try {
    await fn();
    return {
      content: [{ type: "text" as const, text: "Success" }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ error: `Tool ${caption} failed: ${error}` })
      }]
    };
  }
};

/**
 * Extracts the tool handler function from the mock server
 */
export function getToolHandler(mockServer: jest.Mocked<McpServer>): Function {
  return mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_HANDLER];
}

/**
 * Extracts the schema from the mock server
 */
export function getToolSchema(mockServer: jest.Mocked<McpServer>): any {
  return mockServer.tool.mock.calls[TOOL_CALL_INDEX][TOOL_ARG_SCHEMA];
}

/**
 * Sets up mock OAuth2 clients for validation tests
 */
export function setupMockOAuth2Clients(
  mockClient: jest.Mocked<SimplifierClient>,
  clientNames: string[] = ["infraOIDC", "testClient"]
): void {
  mockClient.listOAuth2Clients.mockResolvedValue({
    authSettings: clientNames.map(name => ({
      name,
      mechanism: "OAuth2",
      description: `${name} client`,
      hasIcon: false
    }))
  });
}

/**
 * Sets up empty OAuth2 clients list
 */
export function setupEmptyOAuth2Clients(mockClient: jest.Mocked<SimplifierClient>): void {
  mockClient.listOAuth2Clients.mockResolvedValue({
    authSettings: []
  });
}
