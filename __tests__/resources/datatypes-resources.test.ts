import { registerDataTypesResources, calculateDatatypeCount, calculateWeight } from '../../src/resources/datatypes-resources';
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
      getDataTypeByName: jest.fn(),
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
    it('should register seven datatypes resources', () => {
      registerDataTypesResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(7);

      // Check that specific resources are registered
      const calls = mockServer.resource.mock.calls;
      const resourceNames = calls.map(call => call[0]);

      expect(resourceNames).toContain('datatypes-namespaces-list');
      expect(resourceNames).toContain('datatypes-root-namespace-nodetails');
      expect(resourceNames).toContain('datatypes-root-namespace-withdetails');
      expect(resourceNames).toContain('datatypes-by-namespace-nodetails');
      expect(resourceNames).toContain('datatypes-by-namespace-withdetails');
      expect(resourceNames).toContain('datatype-with-namespace');
      expect(resourceNames).toContain('datatype-root');
    });

    describe('namespaces handler', () => {
      let namespacesHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        namespacesHandler = mockServer.resource.mock.calls[0][3]; // First resource (namespaces list)
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

      it('should return namespace list with dynamic URIs based on weight', async () => {
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
        expect(resultData.availableResources).toBeDefined();
        expect(resultData.availableResources).toHaveLength(4); // root + 3 namespaces

        // Check that URIs are dynamically generated based on weight
        const rootResource = resultData.availableResources.find((r: any) => r.name === 'root');
        expect(rootResource).toBeDefined();
        expect(rootResource.weight).toBe(70); // 7 types * 10 + 0 fields * 2
        expect(rootResource.uri).toBe('simplifier://datatypes/namespace/withDetails'); // weight < 2000

        const testConnectorResource = resultData.availableResources.find((r: any) => r.name === 'con/TestConnector');
        expect(testConnectorResource).toBeDefined();
        expect(testConnectorResource.weight).toBe(32); // 3 types * 10 + 1 field * 2
        expect(testConnectorResource.uri).toBe('simplifier://datatypes/namespace/withDetails/con/TestConnector'); // weight < 2000

        expect(resultData.resourcePatterns).toEqual([
          "simplifier://datatypes/namespace/noDetails - Root namespace datatypes (minimal: name, id, category, detailUri only)",
          "simplifier://datatypes/namespace/withDetails - Root namespace datatypes (with all fields + detailUri) **Important:** cannot be used with large results",
          "simplifier://datatypes/namespace/noDetails/{namespace} - Namespace datatypes (minimal: name, id, category, detailUri only)",
          "simplifier://datatypes/namespace/withDetails/{namespace} - Namespace datatypes (with all fields + detailUri) **Important:** cannot be used with large results",
          "simplifier://datatype/{dataTypeName} - Single datatype in root namespace",
          "simplifier://datatype/{namespace}/{dataTypeName} - Single datatype in specific namespace"
        ]);
        expect(resultData.recommendation).toContain("prefer using the single datatype patterns");
      });

      it('should use noDetails URI for heavy namespaces (weight > 2000)', async () => {
        // Create a heavy namespace with many datatypes (201 types × 10 = 2010 > 2000)
        const heavyDataTypesResponse = {
          ...mockDataTypesResponse,
          nameSpaces: ['heavy/namespace'],
          domainTypes: [
            ...mockDataTypesResponse.domainTypes,
            ...Array(201).fill(null).map((_, i) => ({
              id: `HEAVY_DOMAIN_${i}`,
              name: `HeavyDomain${i}`,
              nameSpace: 'heavy/namespace',
              category: 'domain' as const,
              description: `Heavy domain type ${i}`,
              baseType: 'String',
              isStruct: false,
              fields: [],
              properties: [],
              editable: true,
              tags: [],
              assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
            }))
          ]
        };

        const testUri = new URL('simplifier://datatypes/namespaces');
        mockClient.getDataTypes.mockResolvedValue(heavyDataTypesResponse);

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

        const resultData = JSON.parse(result.contents[0].text as string);
        const heavyResource = resultData.availableResources.find((r: any) => r.name === 'heavy/namespace');

        expect(heavyResource).toBeDefined();
        expect(heavyResource.weight).toBeGreaterThan(2000); // Should be 201 types * 10 = 2010 > 2000
        expect(heavyResource.uri).toBe('simplifier://datatypes/namespace/noDetails/heavy/namespace'); // weight > 2000
      });
    });

    describe('root namespace withDetails handler', () => {
      let rootNamespaceHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        rootNamespaceHandler = mockServer.resource.mock.calls[2][3]; // Third resource (root namespace withDetails)
      });

      it('should return root namespace data with details', async () => {
        const testUri = new URL('simplifier://datatypes/namespace/withDetails');
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

        const result = await rootNamespaceHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypes).toHaveBeenCalled();
        const resultData = JSON.parse(result.contents[0].text as string);

        expect(resultData.namespace).toBe('(root - no namespace)');
        expect(resultData.baseTypes).toHaveLength(6); // Hardcoded base types
        expect(resultData.domainTypes).toHaveLength(1); // Email without namespace
        expect(resultData.structTypes).toBeDefined();
        expect(resultData.collectionTypes).toBeDefined();
      });

      it('should throw error when root namespace weight exceeds limit', async () => {
        // Create a very heavy root namespace (310 types × 10 = 3100 > 3000)
        const veryHeavyDataTypesResponse = {
          ...mockDataTypesResponse,
          domainTypes: [
            ...mockDataTypesResponse.domainTypes,
            ...Array(310).fill(null).map((_, i) => ({
              id: `VERY_HEAVY_DOMAIN_${i}`,
              name: `VeryHeavyDomain${i}`,
              category: 'domain' as const,
              description: `Very heavy domain type ${i}`,
              baseType: 'String',
              isStruct: false,
              fields: [],
              properties: [],
              editable: true,
              tags: [],
              assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
            }))
          ]
        };

        const testUri = new URL('simplifier://datatypes/namespace/withDetails');
        mockClient.getDataTypes.mockResolvedValue(veryHeavyDataTypesResponse);

        mockWrapResourceResult.mockImplementation(async (_uri: URL, fn: () => any) => {
          await fn(); // This should throw
        });

        await expect(async () => {
          await rootNamespaceHandler(testUri, {}, createMockExtra());
        }).rejects.toThrow('The result is expected to be too big. Please use: simplifier://datatypes/namespace/noDetails');
      });
    });

    describe('specific namespace withDetails handler', () => {
      let namespaceHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        namespaceHandler = mockServer.resource.mock.calls[4][3]; // Fifth resource (by namespace withDetails)
      });


      it('should return specific namespace data with details', async () => {
        const testUri = new URL('simplifier://datatypes/namespace/withDetails/con/TestConnector');
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
      });

      it('should throw error when specific namespace weight exceeds limit', async () => {
        // Create a very heavy namespace (310 types × 10 = 3100 > 3000)
        const veryHeavyDataTypesResponse = {
          ...mockDataTypesResponse,
          nameSpaces: ['con/HeavyConnector'],
          domainTypes: [
            ...mockDataTypesResponse.domainTypes,
            ...Array(310).fill(null).map((_, i) => ({
              id: `HEAVY_DOMAIN_${i}`,
              name: `HeavyDomain${i}`,
              nameSpace: 'con/HeavyConnector',
              category: 'domain' as const,
              description: `Heavy domain type ${i}`,
              baseType: 'String',
              isStruct: false,
              fields: [],
              properties: [],
              editable: true,
              tags: [],
              assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
            }))
          ]
        };

        const testUri = new URL('simplifier://datatypes/namespace/withDetails/con/HeavyConnector');
        const variables = { namespace: 'con/HeavyConnector' };
        mockClient.getDataTypes.mockResolvedValue(veryHeavyDataTypesResponse);

        mockWrapResourceResult.mockImplementation(async (_uri: URL, fn: () => any) => {
          await fn(); // This should throw
        });

        await expect(async () => {
          await namespaceHandler(testUri, variables, createMockExtra());
        }).rejects.toThrow('The result is expected to be too big. Please use: simplifier://datatypes/namespace/noDetails/con/HeavyConnector');
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://datatypes/namespace/withDetails/invalid');
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

    describe('single datatype with namespace handler', () => {
      let singleDatatypeWithNamespaceHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        singleDatatypeWithNamespaceHandler = mockServer.resource.mock.calls[5][3]; // Sixth resource (datatype with namespace)
      });

      it('should return single datatype with namespace', async () => {
        const testUri = new URL('simplifier://datatype/bo/SF_User/getUser_groups_Struct');
        const mockDatatype = {
          id: "B5CEB602A6EEFBAFA6585B64E7D6AAAB03D0D5CD6701BCFE4F0F5EAA712CB884",
          name: "getUser_groups_Struct",
          nameSpace: "bo/SF_User",
          category: "struct" as const,
          description: "auto generated data type",
          baseType: "Any",
          isStruct: true,
          fields: [
            {
              name: "description",
              dataTypeId: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
              dtName: "String",
              optional: true,
              description: "auto generated field"
            }
          ],
          properties: [],
          editable: false,
          tags: [],
          assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
        };

        mockClient.getDataTypeByName.mockResolvedValue(mockDatatype);

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

        const result = await singleDatatypeWithNamespaceHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypeByName).toHaveBeenCalledWith('bo/SF_User/getUser_groups_Struct', 'MCP Resource: datatype-with-namespace');
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.name).toBe('getUser_groups_Struct');
        expect(resultData.nameSpace).toBe('bo/SF_User');
        expect(resultData.category).toBe('struct');
        expect(resultData.fields).toHaveLength(1);
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://datatype/nonexistent/MyType');
        const testError = new Error('Datatype not found');

        mockClient.getDataTypeByName.mockRejectedValue(testError);

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

        const result = await singleDatatypeWithNamespaceHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypeByName).toHaveBeenCalledWith('nonexistent/MyType', 'MCP Resource: datatype-with-namespace');
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('Datatype not found');
      });
    });

    describe('single datatype root namespace handler', () => {
      let singleDatatypeRootHandler: any;

      beforeEach(() => {
        registerDataTypesResources(mockServer, mockClient);
        singleDatatypeRootHandler = mockServer.resource.mock.calls[6][3]; // Seventh resource (datatype root)
      });

      it('should return single datatype from root namespace', async () => {
        const testUri = new URL('simplifier://datatype/_ITIZ_B_BUS2038_DATA');
        const mockDatatype = {
          id: "ABC123",
          name: "_ITIZ_B_BUS2038_DATA",
          category: "domain" as const,
          description: "Custom data type in root namespace",
          baseType: "String",
          isStruct: false,
          fields: [],
          properties: [],
          editable: true,
          tags: [],
          assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
        };

        mockClient.getDataTypeByName.mockResolvedValue(mockDatatype);

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

        const result = await singleDatatypeRootHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypeByName).toHaveBeenCalledWith('_ITIZ_B_BUS2038_DATA', 'MCP Resource: datatype-root');
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.name).toBe('_ITIZ_B_BUS2038_DATA');
        expect(resultData.nameSpace).toBeUndefined();
        expect(resultData.category).toBe('domain');
      });

      it('should return base type (String)', async () => {
        const testUri = new URL('simplifier://datatype/String');
        const mockDatatype = {
          id: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
          name: "String",
          category: "base" as const,
          description: "BaseType for strings",
          baseType: "String",
          isStruct: false,
          fields: [],
          properties: [{ name: "Operators", value: "==, !=" }],
          editable: true,
          tags: [],
          assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
        };

        mockClient.getDataTypeByName.mockResolvedValue(mockDatatype);

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

        const result = await singleDatatypeRootHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypeByName).toHaveBeenCalledWith('String', 'MCP Resource: datatype-root');
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.name).toBe('String');
        expect(resultData.category).toBe('base');
      });

      it('should handle errors through wrapResourceResult', async () => {
        const testUri = new URL('simplifier://datatype/nonexistent_datatype');
        const testError = new Error('Datatype not found');

        mockClient.getDataTypeByName.mockRejectedValue(testError);

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

        const result = await singleDatatypeRootHandler(testUri, {}, createMockExtra());

        expect(mockClient.getDataTypeByName).toHaveBeenCalledWith('nonexistent_datatype', 'MCP Resource: datatype-root');
        expect(result.contents[0].text).toContain('Could not get data!');
        expect(result.contents[0].text).toContain('Datatype not found');
      });
    });

    describe('template resource configuration', () => {
      it('should register all datatype resources successfully', () => {
        registerDataTypesResources(mockServer, mockClient);

        // Verify that all seven resources are registered
        expect(mockServer.resource).toHaveBeenCalledTimes(7);

        // Verify resource names
        expect(mockServer.resource).toHaveBeenCalledWith('datatypes-namespaces-list', expect.any(String), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith('datatypes-root-namespace-nodetails', expect.any(Object), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith('datatypes-root-namespace-withdetails', expect.any(Object), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith('datatypes-by-namespace-nodetails', expect.any(Object), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith('datatypes-by-namespace-withdetails', expect.any(Object), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith('datatype-with-namespace', expect.any(Object), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith('datatype-root', expect.any(Object), expect.any(Object), expect.any(Function));
      });
    });
  });

  describe('calculateDatatypeCount', () => {
    it('should count datatypes in root namespace including base types', () => {
      const count = calculateDatatypeCount('', mockDataTypesResponse);

      // Base types (6 hardcoded) + Email (1 domain without namespace) = 7
      expect(count).toBe(7); // 6 base + 1 domain
    });

    it('should count datatypes in specific namespace', () => {
      const count = calculateDatatypeCount('con/TestConnector', mockDataTypesResponse);

      // NamespacedDomainType (1) + EmailAddress_Struct (1) + StringArray (1) = 3
      expect(count).toBe(3);
    });

    it('should return 0 for non-existent namespace', () => {
      const count = calculateDatatypeCount('con/NonExistent', mockDataTypesResponse);

      expect(count).toBe(0);
    });
  });

  describe('calculateWeight', () => {
    it('should calculate weight for root namespace', () => {
      const weight = calculateWeight('', mockDataTypesResponse);

      // datatypeCount = 7 (6 base + 1 domain)
      // struct fields = 0 (no structs in root namespace)
      // weight = (10 × 7) + (2 × 0) = 70
      expect(weight).toBe(70);
    });

    it('should calculate weight for namespace with struct fields', () => {
      const weight = calculateWeight('con/TestConnector', mockDataTypesResponse);

      // datatypeCount = 3 (1 domain + 1 struct + 1 collection)
      // struct fields = 1 (EmailAddress_Struct has 1 field: name)
      // weight = (10 × 3) + (2 × 1) = 30 + 2 = 32
      expect(weight).toBe(32);
    });

    it('should return 0 for non-existent namespace', () => {
      const weight = calculateWeight('con/NonExistent', mockDataTypesResponse);

      // datatypeCount = 0, struct fields = 0
      // weight = (10 × 0) + (2 × 0) = 0
      expect(weight).toBe(0);
    });
  });
});