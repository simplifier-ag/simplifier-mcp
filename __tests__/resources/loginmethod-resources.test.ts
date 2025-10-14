import { registerLoginMethodResources } from '../../src/resources/loginmethod-resources';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SimplifierLoginMethodsResponse } from '../../src/client/types';

// Mock the resourcesresult wrapper
jest.mock('../../src/resources/resourcesresult', () => ({
  wrapResourceResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('LoginMethod Resources', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockClient: jest.Mocked<SimplifierClient>;
  let mockWrapResourceResult: jest.MockedFunction<any>;

  beforeEach(() => {
    // Create mock server with resource method
    mockServer = {
      resource: jest.fn(),
    } as any;

    // Create mock client
    mockClient = {
      listLoginMethods: jest.fn(),
    } as any;

    // Get the mocked wrapResourceResult
    mockWrapResourceResult = require('../../src/resources/resourcesresult').wrapResourceResult;
    mockWrapResourceResult.mockClear();
  });

  const createMockExtra = () => ({
    signal: new AbortController().signal,
    requestId: 'test-request-id',
    sendNotification: jest.fn(),
    sendRequest: jest.fn()
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockLoginMethodsResponse: SimplifierLoginMethodsResponse = {
    loginMethods: [
      {
        name: 'TestUserCredentials',
        description: 'Test user credentials login',
        loginMethodType: {
          technicalName: 'UserCredentials',
          i18n: 'loginMethodType_UserCredentials_Caption',
          descriptionI18n: 'loginMethodType_UserCredentials_Description',
          sources: [
            {
              id: 0,
              name: 'DEFAULT',
              i18nName: 'login_method_source_default',
              i18nDescription: 'login_method_source_default_description'
            },
            {
              id: 1,
              name: 'PROVIDED',
              i18nName: 'login_method_source_provided',
              i18nDescription: 'login_method_source_provided_description'
            }
          ],
          targets: [
            {
              id: 0,
              name: 'DEFAULT',
              i18nName: 'login_method_target_default',
              i18nDescription: 'login_method_target_undefined_description'
            }
          ],
          supportedConnectors: ['Email', 'MQTT', 'OData', 'REST', 'SOAP', 'SQL']
        },
        source: 0,
        target: 0,
        updateInfo: {
          created: '2025-05-08T16:01:40+02:00',
          creator: {
            loginName: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            platformDomain: 'localhost',
            differentPlatformDomain: false
          }
        },
        editable: true,
        deletable: true
      },
      {
        name: 'OAuthSpotify',
        description: 'OAuth for Spotify API',
        loginMethodType: {
          technicalName: 'OAuth2',
          i18n: 'loginMethodType_OAuth2_Caption',
          descriptionI18n: 'loginMethodType_OAuth2_Description',
          sources: [
            {
              id: 0,
              name: 'DEFAULT',
              i18nName: 'login_method_source_default',
              i18nDescription: 'login_method_source_default_description'
            }
          ],
          targets: [
            {
              id: 0,
              name: 'DEFAULT',
              i18nName: 'login_method_target_default',
              i18nDescription: 'login_method_target_undefined_description'
            },
            {
              id: 1,
              name: 'HEADER',
              i18nName: 'login_method_target_header',
              i18nDescription: 'login_method_target_header_description'
            }
          ],
          supportedConnectors: ['Email', 'OData', 'REST', 'SOAP']
        },
        source: 0,
        target: 1,
        updateInfo: {
          created: '2025-07-07T11:53:08+02:00',
          creator: {
            loginName: 'volkervonsimplifier',
            firstName: 'volkervonsimplifier',
            lastName: 'volkervonsimplifier',
            platformDomain: 'localhost',
            differentPlatformDomain: false
          }
        },
        editable: true,
        deletable: true
      },
      {
        name: 'TokenMethod',
        description: 'Bearer token authentication',
        loginMethodType: {
          technicalName: 'Token',
          i18n: 'loginMethodType_Token_Caption',
          descriptionI18n: 'loginMethodType_Token_Description',
          sources: [
            {
              id: 0,
              name: 'DEFAULT',
              i18nName: 'login_method_source_default',
              i18nDescription: 'login_method_source_default_description'
            }
          ],
          targets: [
            {
              id: 0,
              name: 'DEFAULT',
              i18nName: 'login_method_target_default',
              i18nDescription: 'login_method_target_undefined_description'
            },
            {
              id: 1,
              name: 'HEADER',
              i18nName: 'login_method_target_header',
              i18nDescription: 'login_method_target_header_description'
            }
          ],
          supportedConnectors: ['Email', 'MQTT', 'OData', 'ProxyV2', 'REST', 'SAPRFC', 'SOAP', 'SQL']
        },
        source: 0,
        target: 1,
        editable: true,
        deletable: true
      }
    ]
  };

  describe('registerLoginMethodResources', () => {
    it('should register one login methods resource', () => {
      registerLoginMethodResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(1);

      // Check that specific resource is registered
      const calls = mockServer.resource.mock.calls;
      const resourceNames = calls.map(call => call[0]);

      expect(resourceNames).toContain('loginmethods-list');
    });

    describe('loginmethods list handler', () => {
      let loginMethodsListHandler: any;

      beforeEach(() => {
        registerLoginMethodResources(mockServer, mockClient);
        loginMethodsListHandler = mockServer.resource.mock.calls[0][3]; // First resource (loginmethods list)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://loginmethods');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await loginMethodsListHandler(testUri, {}, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should return login methods list through wrapper', async () => {
        const testUri = new URL('simplifier://loginmethods');
        mockClient.listLoginMethods.mockResolvedValue(mockLoginMethodsResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLoginMethods).toHaveBeenCalled();
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.loginMethods).toHaveLength(3);
        expect(resultData.totalCount).toBe(3);
        expect(resultData.resourcePatterns).toHaveLength(2);
      });

      it('should map source and target IDs to names correctly', async () => {
        const testUri = new URL('simplifier://loginmethods');
        mockClient.listLoginMethods.mockResolvedValue(mockLoginMethodsResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        const resultData = JSON.parse(result.contents[0].text as string);

        // First login method: source=0 (DEFAULT), target=0 (DEFAULT)
        expect(resultData.loginMethods[0].name).toBe('TestUserCredentials');
        expect(resultData.loginMethods[0].source).toBe('DEFAULT');
        expect(resultData.loginMethods[0].target).toBe('DEFAULT');

        // Second login method: source=0 (DEFAULT), target=1 (HEADER)
        expect(resultData.loginMethods[1].name).toBe('OAuthSpotify');
        expect(resultData.loginMethods[1].source).toBe('DEFAULT');
        expect(resultData.loginMethods[1].target).toBe('HEADER');

        // Third login method: source=0 (DEFAULT), target=1 (HEADER)
        expect(resultData.loginMethods[2].name).toBe('TokenMethod');
        expect(resultData.loginMethods[2].source).toBe('DEFAULT');
        expect(resultData.loginMethods[2].target).toBe('HEADER');
      });

      it('should include all relevant fields in the response', async () => {
        const testUri = new URL('simplifier://loginmethods');
        mockClient.listLoginMethods.mockResolvedValue(mockLoginMethodsResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        const resultData = JSON.parse(result.contents[0].text as string);
        const firstLoginMethod = resultData.loginMethods[0];

        expect(firstLoginMethod).toHaveProperty('uri');
        expect(firstLoginMethod).toHaveProperty('name');
        expect(firstLoginMethod).toHaveProperty('description');
        expect(firstLoginMethod).toHaveProperty('type');
        expect(firstLoginMethod).toHaveProperty('source');
        expect(firstLoginMethod).toHaveProperty('target');
        expect(firstLoginMethod).toHaveProperty('supportedConnectors');
        expect(firstLoginMethod).toHaveProperty('updateInfo');
        expect(firstLoginMethod).toHaveProperty('editable');
        expect(firstLoginMethod).toHaveProperty('deletable');

        expect(firstLoginMethod.uri).toBe('simplifier://loginmethod/TestUserCredentials');
        expect(firstLoginMethod.type).toBe('UserCredentials');
        expect(firstLoginMethod.supportedConnectors).toContain('REST');
      });

      it('should handle login methods without updateInfo', async () => {
        const testUri = new URL('simplifier://loginmethods');
        const { updateInfo, ...loginMethodWithoutUpdateInfo } = mockLoginMethodsResponse.loginMethods[2];
        const responseWithoutUpdateInfo: SimplifierLoginMethodsResponse = {
          loginMethods: [loginMethodWithoutUpdateInfo as any]
        };
        mockClient.listLoginMethods.mockResolvedValue(responseWithoutUpdateInfo);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.loginMethods[0].updateInfo).toBeUndefined();
      });

      it('should handle unknown source/target IDs gracefully', async () => {
        const testUri = new URL('simplifier://loginmethods');
        const responseWithBadIds: SimplifierLoginMethodsResponse = {
          loginMethods: [{
            ...mockLoginMethodsResponse.loginMethods[0],
            source: 999, // Invalid ID
            target: 888  // Invalid ID
          }]
        };
        mockClient.listLoginMethods.mockResolvedValue(responseWithBadIds);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.loginMethods[0].source).toBe('UNKNOWN');
        expect(resultData.loginMethods[0].target).toBe('UNKNOWN');
      });

      it('should handle API errors through wrapper', async () => {
        const testUri = new URL('simplifier://loginmethods');
        const testError = new Error('API Error');
        mockClient.listLoginMethods.mockRejectedValue(testError);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          try {
            await fn();
            return { contents: [] };
          } catch (e) {
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({ error: `Failed to fetch: ${e}` }),
                mimeType: 'application/json'
              }]
            };
          }
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLoginMethods).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Failed to fetch');
        expect(result.contents[0].text).toContain('API Error');
      });

      it('should handle empty login methods list', async () => {
        const testUri = new URL('simplifier://loginmethods');
        const emptyResponse: SimplifierLoginMethodsResponse = {
          loginMethods: []
        };
        mockClient.listLoginMethods.mockResolvedValue(emptyResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loginMethodsListHandler(testUri, {}, createMockExtra());

        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.loginMethods).toHaveLength(0);
        expect(resultData.totalCount).toBe(0);
      });
    });
  });

  describe('resource registration configuration', () => {
    it('should register loginmethods-list as a simple resource', () => {
      registerLoginMethodResources(mockServer, mockClient);

      // First call should be simple resource (string URI)
      expect(mockServer.resource).toHaveBeenNthCalledWith(
        1,
        'loginmethods-list',
        'simplifier://loginmethods',
        expect.objectContaining({
          title: 'List All Login Methods',
          mimeType: 'application/json'
        }),
        expect.any(Function)
      );
    });

    it('should have comprehensive description', () => {
      registerLoginMethodResources(mockServer, mockClient);

      const firstCall = mockServer.resource.mock.calls[0];
      const config = firstCall[2];

      expect(config.description).toContain('Login Methods');
      expect(config.description).toContain('authentication');
      expect(config.description).toContain('connectors');
    });
  });
});
