import { registerDataTypesResources } from '../../src/resources/datatypes-resources';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SimplifierDataTypesResponse } from '../../src/client/types';

// Mock the resourcesresult wrapper
jest.mock('../../src/resources/resourcesresult', () => ({
  wrapResourceResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('DataTypes Resources (Namespace-based)', () => {
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
      getDataTypes: jest.fn(),
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

  const mockDataTypesResponse: SimplifierDataTypesResponse = {
    baseTypes: [
      {
        id: '22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52',
        name: 'String',
        category: 'base',
        description: 'BaseType for strings',
        baseType: 'String',
        isStruct: false,
        fields: [],
        properties: [{ name: 'Operators', value: '==, !=' }],
        editable: true,
        tags: [],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      }
    ],
    domainTypes: [
      {
        id: '817D93D86EDD594F83A83CE5A3127E8A522581DB6AB9AD2EA877B8A185154B5A',
        name: 'Email',
        category: 'domain',
        description: 'Email domain type with regex validation',
        baseType: 'String',
        derivedFrom: 'String',
        isStruct: false,
        fields: [],
        properties: [
          { name: 'Regex', value: '^[A-Za-z0-9._\\-+!?=]+[@]{1}([0-9A-Za-zÄÖÜäöü\\-][\\.]{0,1})+[.]{1}[A-Za-z]{1,63}$' },
          { name: 'Nullable', value: 'false' }
        ],
        editable: true,
        tags: [],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      },
      {
        id: 'NAMESPACE_DOMAIN_TYPE',
        name: 'NamespacedDomainType',
        nameSpace: 'con/TestConnector',
        category: 'domain',
        description: 'Domain type with namespace',
        baseType: 'String',
        derivedFrom: 'String',
        isStruct: false,
        fields: [],
        properties: [],
        editable: true,
        tags: [],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      }
    ],
    structTypes: [
      {
        id: '19170B5DCE55A3BC6313F3333227AB1858B81510E55EE3EE8ADAF274943E0E8D',
        name: 'EmailAddress_Struct',
        nameSpace: 'con/TestConnector',
        category: 'struct',
        description: 'Structure for email addresses',
        isStruct: true,
        fields: [
          {
            name: 'name',
            dataTypeId: '22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52',
            dtName: 'String',
            optional: true,
            description: 'Display name for email'
          }
        ],
        properties: [],
        editable: false,
        tags: [],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      }
    ],
    collectionTypes: [
      {
        id: 'COLLECTION_TYPE_ID',
        name: 'StringArray',
        nameSpace: 'con/TestConnector',
        category: 'base', // Collection types use base category
        description: 'Array of strings',
        baseType: 'String',
        isStruct: false,
        fields: [],
        properties: [],
        editable: true,
        tags: [],
        assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
      }
    ],
    nameSpaces: ['con/TestConnector', 'bo/TestBO', 'app/MyApp']
  };

  describe('registerDataTypesResources', () => {
    it('should register two namespace-based datatypes resources', () => {
      registerDataTypesResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(2);

      // Check datatypes-namespaces resource
      expect(mockServer.resource).toHaveBeenCalledWith(
        'datatypes-namespaces',
        expect.any(Object), // ResourceTemplate
        {
          title: 'Simplifier DataType Namespaces',
          mimeType: 'application/json',
          description: expect.any(String),
        },
        expect.any(Function)
      );

      // Check datatypes-by-namespace resource
      expect(mockServer.resource).toHaveBeenCalledWith(
        'datatypes-by-namespace',
        expect.any(Object), // ResourceTemplate
        {
          title: 'DataTypes by Namespace',
          mimeType: 'application/json',
          description: expect.any(String),
        },
        expect.any(Function)
      );
    });

    describe('namespaces handler', () => {
      let namespacesHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        namespacesHandler = mockServer.resource.mock.calls[0][3]; // First resource (namespaces)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://datatypes/namespaces');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await namespacesHandler(testUri, {}, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should return namespace list through wrapper', async () => {
        const testUri = new URL('simplifier://datatypes/namespaces');
        mockClient.getDataTypes.mockResolvedValue(mockDataTypesResponse);

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

        const result = await namespacesHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypes).toHaveBeenCalled();
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.rootNamespace).toBe('(empty namespace - includes base types)');
        expect(resultData.namespaces).toEqual(['con/TestConnector', 'bo/TestBO', 'app/MyApp']);
      });
    });

    describe('namespace filtering handler', () => {
      let namespaceHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        namespaceHandler = mockServer.resource.mock.calls[1][3]; // Second resource (by namespace)
      });

      it('should return root namespace data when namespace is empty', async () => {
        const testUri = new URL('simplifier://datatypes/namespace/');
        const variables = { namespace: '' };
        mockClient.getDataTypes.mockResolvedValue(mockDataTypesResponse);

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

        const result = await namespaceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getDataTypes).toHaveBeenCalled();
        const resultData = JSON.parse(result.contents[0].text as string);

        expect(resultData.namespace).toBe('(root - no namespace)');
        expect(resultData.baseTypes).toHaveLength(6); // Hardcoded base types
        expect(resultData.domainTypes).toHaveLength(1); // Email without namespace
        expect(resultData.totalTypes).toBeGreaterThan(0);
      });

      it('should return specific namespace data', async () => {
        const testUri = new URL('simplifier://datatypes/namespace/con/TestConnector');
        const variables = { namespace: 'con/TestConnector' };
        mockClient.getDataTypes.mockResolvedValue(mockDataTypesResponse);

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

        const result = await namespaceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getDataTypes).toHaveBeenCalled();
        const resultData = JSON.parse(result.contents[0].text as string);

        expect(resultData.namespace).toBe('con/TestConnector');
        expect(resultData.domainTypes).toHaveLength(1); // NamespacedDomainType
        expect(resultData.structTypes).toHaveLength(1); // EmailAddress_Struct
        expect(resultData.collectionTypes).toHaveLength(1); // StringArray
        expect(resultData.totalTypes).toBe(3);
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://datatypes/namespace/invalid');
        const variables = { namespace: 'invalid' };
        const testError = new Error('API Error');

        mockClient.getDataTypes.mockRejectedValue(testError);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          try {
            await fn();
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({error: 'Should not reach here'}),
                mimeType: 'application/json'
              }]
            };
          } catch (e) {
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({error: `Could not get data! ${e}`}),
                mimeType: 'application/json'
              }]
            };
          }
        });

        const result = await namespaceHandler(testUri, variables, createMockExtra());

        expect(mockClient.getDataTypes).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('API Error');
      });
    });
  });

  describe('template resource list callbacks', () => {
    describe('namespaces list callback', () => {
      let namespacesResourceTemplate: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        namespacesResourceTemplate = mockServer.resource.mock.calls[0][1]; // First resource template
      });

      it('should return list of all namespaces for discovery', async () => {
        mockClient.getDataTypes.mockResolvedValue(mockDataTypesResponse);

        const result = await namespacesResourceTemplate._callbacks.list();

        expect(result.resources).toHaveLength(4); // root + 3 namespaces

        // Check root namespace
        expect(result.resources[0]).toEqual({
          uri: 'simplifier://datatypes/namespace/',
          name: 'root',
          title: 'Root Namespace (no namespace)',
          description: 'All datatypes without a specific namespace, including base types',
          mimeType: 'application/json'
        });

        // Check first specific namespace
        expect(result.resources[1]).toEqual({
          uri: 'simplifier://datatypes/namespace/con/TestConnector',
          name: 'con/TestConnector',
          title: 'Namespace: con/TestConnector',
          description: 'All datatypes in namespace con/TestConnector',
          mimeType: 'application/json'
        });
      });

      it('should handle errors gracefully in namespaces list callback', async () => {
        mockClient.getDataTypes.mockRejectedValue(new Error('API Error'));

        const result = await namespacesResourceTemplate._callbacks.list();

        expect(result.resources).toEqual([]);
      });
    });

    describe('namespace filtering list callback', () => {
      let namespaceResourceTemplate: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        namespaceResourceTemplate = mockServer.resource.mock.calls[1][1]; // Second resource template
      });

      it('should return namespace entries for discovery', async () => {
        mockClient.getDataTypes.mockResolvedValue(mockDataTypesResponse);

        const result = await namespaceResourceTemplate._callbacks.list();

        expect(result.resources).toHaveLength(4); // root + 3 namespaces

        expect(result.resources[0]).toEqual({
          uri: 'simplifier://datatypes/namespace/',
          name: 'root',
          title: 'Root Namespace',
          description: 'All datatypes without namespace + base types',
          mimeType: 'application/json'
        });
      });

      it('should handle errors gracefully in namespace list callback', async () => {
        mockClient.getDataTypes.mockRejectedValue(new Error('API Error'));

        const result = await namespaceResourceTemplate._callbacks.list();

        expect(result.resources).toEqual([]);
      });
    });
  });
});