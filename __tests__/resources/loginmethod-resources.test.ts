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
      getLoginMethodDetails: jest.fn(),
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
    it('should register two login methods resources', () => {
      registerLoginMethodResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(2);

      // Check that specific resources are registered
      const calls = mockServer.resource.mock.calls;
      const resourceNames = calls.map(call => call[0]);

      expect(resourceNames).toContain('loginmethods-list');
      expect(resourceNames).toContain('loginmethod-details');
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

      it('should return simplified login method information', async () => {
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

        expect(resultData.loginMethods[0].name).toBe('TestUserCredentials');
        expect(resultData.loginMethods[0].type).toBe('UserCredentials');
        expect(resultData.loginMethods[1].name).toBe('OAuthSpotify');
        expect(resultData.loginMethods[1].type).toBe('OAuth2');
        expect(resultData.loginMethods[2].name).toBe('TokenMethod');
        expect(resultData.loginMethods[2].type).toBe('Token');
      });

      it('should include only essential fields in the response', async () => {
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

        // Should have these fields
        expect(firstLoginMethod).toHaveProperty('uri');
        expect(firstLoginMethod).toHaveProperty('name');
        expect(firstLoginMethod).toHaveProperty('description');
        expect(firstLoginMethod).toHaveProperty('type');
        expect(firstLoginMethod).toHaveProperty('supportedConnectors');
        expect(firstLoginMethod).toHaveProperty('updateInfo');

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

    describe('loginmethod details handler', () => {
      let loginMethodDetailsHandler: any;

      beforeEach(() => {
        registerLoginMethodResources(mockServer, mockClient);
        loginMethodDetailsHandler = mockServer.resource.mock.calls[1][3]; // Second resource (loginmethod details)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://loginmethod/TestUserCredentials');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should return UserCredentials login method details with discriminated unions', async () => {
        const testUri = new URL('simplifier://loginmethod/TestUserCredentials');
        const mockRawDetails = {
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
          sourceConfiguration: {
            jsonClass: 'de.itizzimo.simplifier.api.plugin.loginmethod.LoginData',
            username: 'testuser',
            password: '*****',
            changePassword: false
          },
          targetConfiguration: {},
          configuration: {
            convertTargetToBase64: false,
            convertSourceFromBase64: false
          }
        };

        mockClient.getLoginMethodDetails.mockResolvedValue(mockRawDetails);

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

        const result = await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLoginMethodDetails).toHaveBeenCalledWith('TestUserCredentials', 'MCP Resource: loginmethod-details');
        const resultData = JSON.parse(result.contents[0].text as string);

        expect(resultData.name).toBe('TestUserCredentials');
        expect(resultData.type).toBe('UserCredentials');
        expect(resultData.source.id).toBe(0);
        expect(resultData.source.name).toBe('DEFAULT');
        expect(resultData.target.id).toBe(0);
        expect(resultData.target.name).toBe('DEFAULT');

        // Check that discriminators were added
        expect(resultData.sourceConfiguration.type).toBe('UserCredentials');
        expect(resultData.sourceConfiguration.source).toBe(0);
        expect(resultData.configuration.type).toBe('UserCredentials');
        expect(resultData.targetConfiguration.target).toBe(0);
      });

      it('should return OAuth2 login method details with HEADER target', async () => {
        const testUri = new URL('simplifier://loginmethod/oAuthSpotify');
        const mockRawDetails = {
          name: 'oAuthSpotify',
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
          sourceConfiguration: {
            jsonClass: 'de.itizzimo.simplifier.api.plugin.loginmethod.LoginData',
            clientName: 'SpotifyOAuthClient'
          },
          targetConfiguration: {
            name: 'Authorization'
          },
          configuration: {}
        };

        mockClient.getLoginMethodDetails.mockResolvedValue(mockRawDetails);

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

        const result = await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLoginMethodDetails).toHaveBeenCalledWith('oAuthSpotify', 'MCP Resource: loginmethod-details');
        const resultData = JSON.parse(result.contents[0].text as string);

        expect(resultData.name).toBe('oAuthSpotify');
        expect(resultData.type).toBe('OAuth2');
        expect(resultData.target.id).toBe(1);
        expect(resultData.target.name).toBe('HEADER');
        expect(resultData.targetConfiguration.name).toBe('Authorization');

        // Check OAuth2-specific discriminators
        expect(resultData.sourceConfiguration.type).toBe('OAuth2');
        expect(resultData.configuration.type).toBe('OAuth2');
      });

      it('should return Token login method details', async () => {
        const testUri = new URL('simplifier://loginmethod/TokenMethod');
        const mockRawDetails = {
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
          sourceConfiguration: {},
          targetConfiguration: {
            name: 'Authorization'
          },
          configuration: {
            convertTargetToBase64: false,
            convertSourceFromBase64: false
          }
        };

        mockClient.getLoginMethodDetails.mockResolvedValue(mockRawDetails);

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

        const result = await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLoginMethodDetails).toHaveBeenCalledWith('TokenMethod', 'MCP Resource: loginmethod-details');
        const resultData = JSON.parse(result.contents[0].text as string);

        expect(resultData.name).toBe('TokenMethod');
        expect(resultData.type).toBe('Token');
        expect(resultData.sourceConfiguration.type).toBe('Token');
        expect(resultData.configuration.type).toBe('Token');
      });

      it('should extract login method name from URI path correctly', async () => {
        const testUri = new URL('simplifier://loginmethod/MyCustomMethod');

        mockClient.getLoginMethodDetails.mockResolvedValue({
          name: 'MyCustomMethod',
          description: 'Custom method',
          loginMethodType: {
            technicalName: 'UserCredentials',
            i18n: 'test',
            descriptionI18n: 'test',
            sources: [{ id: 0, name: 'DEFAULT', i18nName: 'test', i18nDescription: 'test' }],
            targets: [{ id: 0, name: 'DEFAULT', i18nName: 'test', i18nDescription: 'test' }],
            supportedConnectors: []
          },
          source: 0,
          target: 0,
          sourceConfiguration: {},
          targetConfiguration: {},
          configuration: {}
        });

        mockWrapResourceResult.mockImplementation(async (_uri: URL, fn: () => any) => {
          await fn();
          return { contents: [] };
        });

        await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLoginMethodDetails).toHaveBeenCalledWith('MyCustomMethod', 'MCP Resource: loginmethod-details');
      });

      it('should handle API errors through wrapper', async () => {
        const testUri = new URL('simplifier://loginmethod/NonExistent');
        const testError = new Error('Not Found');
        mockClient.getLoginMethodDetails.mockRejectedValue(testError);

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

        const result = await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLoginMethodDetails).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Failed to fetch');
        expect(result.contents[0].text).toContain('Not Found');
      });

      it('should handle unknown source/target IDs gracefully', async () => {
        const testUri = new URL('simplifier://loginmethod/BadIdsMethod');
        const mockRawDetails = {
          name: 'BadIdsMethod',
          description: 'Method with invalid IDs',
          loginMethodType: {
            technicalName: 'UserCredentials',
            i18n: 'test',
            descriptionI18n: 'test',
            sources: [{ id: 0, name: 'DEFAULT', i18nName: 'test', i18nDescription: 'test' }],
            targets: [{ id: 0, name: 'DEFAULT', i18nName: 'test', i18nDescription: 'test' }],
            supportedConnectors: []
          },
          source: 999, // Invalid
          target: 888, // Invalid
          sourceConfiguration: {},
          targetConfiguration: {},
          configuration: {}
        };

        mockClient.getLoginMethodDetails.mockResolvedValue(mockRawDetails);

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

        const result = await loginMethodDetailsHandler(testUri, {}, createMockExtra());

        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.source.name).toBe('UNKNOWN');
        expect(resultData.target.name).toBe('UNKNOWN');
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
