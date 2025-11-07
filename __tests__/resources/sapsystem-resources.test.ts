import { registerSapSystemResources } from '../../src/resources/sapsystem-resources';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SAPSystem, SAPSystemListResponse } from '../../src/client/types';

// Mock the resourcesresult wrapper
jest.mock('../../src/resources/resourcesresult', () => ({
  wrapResourceResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('SAP System Resources', () => {
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
      listSapSystems: jest.fn(),
      getSapSystem: jest.fn(),
    } as any;

    // Get the mocked wrapResourceResult
    mockWrapResourceResult = require('../../src/resources/resourcesresult').wrapResourceResult;
    mockWrapResourceResult.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockSapSystemListResponse: SAPSystemListResponse = {
    sapSystems: [
      {
        name: 'DEV_SYSTEM',
        description: 'Development SAP System',
        active: true,
        instanceRestrictions: [],
        systemType: 'Development',
        tags: ['development', 'test'],
        assignedProjects: {
          projectsBefore: ['Project1'],
          projectsAfterChange: ['Project1']
        },
        permission: {
          deletable: true,
          editable: true
        },
        updateInfo: {
          created: '2024-01-01T00:00:00Z',
          creator: {
            loginName: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            platformDomain: 'example.com',
            differentPlatformDomain: false
          }
        },
        referencedBy: {
          loginMethods: [],
          connectors: ['RFCConnector1']
        }
      },
      {
        name: 'PRD_SYSTEM',
        description: 'Production SAP System',
        active: true,
        instanceRestrictions: ['prod-instance'],
        systemType: 'Production',
        tags: ['production'],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        },
        permission: {
          deletable: true,
          editable: true
        },
        updateInfo: {
          created: '2024-01-15T00:00:00Z',
          creator: {
            loginName: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            platformDomain: 'example.com',
            differentPlatformDomain: false
          }
        },
        referencedBy: {
          loginMethods: [],
          connectors: ['RFCConnector2']
        }
      }
    ]
  };

  const mockSapSystemDetails: SAPSystem = {
    name: 'DEV_SYSTEM',
    description: 'Development SAP System',
    active: true,
    instanceRestrictions: [],
    systemType: 'Development',
    configuration: {
      systemId: 'DEV',
      systemNumber: '00',
      clientNumber: '100',
      language: 'EN',
      applicationServerHostname: 'sap-dev.example.com',
      sapRouterString: '',
      sncActive: false,
      sncPartner: '',
      sncSsoMode: false,
      sncQualityOfProtection: 3
    },
    tags: ['development', 'test'],
    assignedProjects: {
      projectsBefore: ['Project1'],
      projectsAfterChange: ['Project1']
    },
    permission: {
      deletable: true,
      editable: true
    }
  };

  describe('Resource Registration', () => {
    it('should register two SAP system resources', () => {
      registerSapSystemResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(2);
    });

    it('should register sap-systems-list resource with correct configuration', () => {
      registerSapSystemResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledWith(
        'sap-systems-list',
        'simplifier://sap-systems',
        expect.objectContaining({
          title: 'List All SAP systems',
          mimeType: 'application/json',
          description: expect.stringContaining('# Get the list of all SAP systems')
        }),
        expect.any(Function)
      );
    });

    it('should register sap-system-details resource with correct configuration', () => {
      registerSapSystemResources(mockServer, mockClient);

      const detailsResourceCall = mockServer.resource.mock.calls.find(
        call => call[0] === 'sap-system-details'
      );

      expect(detailsResourceCall).toBeDefined();
      expect(detailsResourceCall![0]).toBe('sap-system-details');
      expect(detailsResourceCall![2]).toMatchObject({
        title: 'Get SAP System Details',
        mimeType: 'application/json',
        description: expect.stringContaining('# Get detailed configuration for a specific SAP system')
      });
    });
  });

  describe('sap-systems-list resource', () => {
    let listHandler: Function;

    beforeEach(() => {
      registerSapSystemResources(mockServer, mockClient);

      const listResourceCall = mockServer.resource.mock.calls.find(
        call => call[0] === 'sap-systems-list'
      );
      listHandler = listResourceCall![3] as Function;

      mockWrapResourceResult.mockImplementation(async (_uri: any, callback: any) => {
        return callback();
      });
    });

    it('should return list of SAP systems with URIs', async () => {
      mockClient.listSapSystems.mockResolvedValue(mockSapSystemListResponse);

      const result = await listHandler(new URL('simplifier://sap-systems'));

      expect(mockClient.listSapSystems).toHaveBeenCalledWith(
        expect.stringContaining('sap-systems-list')
      );

      expect(result).toEqual({
        sapSystems: [
          expect.objectContaining({
            uri: 'simplifier://sap-system/DEV_SYSTEM',
            name: 'DEV_SYSTEM',
            description: 'Development SAP System'
          }),
          expect.objectContaining({
            uri: 'simplifier://sap-system/PRD_SYSTEM',
            name: 'PRD_SYSTEM',
            description: 'Production SAP System'
          })
        ],
        totalCount: 2,
        resourcePatterns: [
          'simplifier://sap-systems - List all SAP systems',
          'simplifier://sap-system/{name} - Specific SAP system details'
        ]
      });
    });

    it('should handle empty SAP system list', async () => {
      mockClient.listSapSystems.mockResolvedValue({ sapSystems: [] });

      const result = await listHandler(new URL('simplifier://sap-systems'));

      expect(result).toEqual({
        sapSystems: [],
        totalCount: 0,
        resourcePatterns: [
          'simplifier://sap-systems - List all SAP systems',
          'simplifier://sap-system/{name} - Specific SAP system details'
        ]
      });
    });

    it('should call wrapResourceResult with correct URI', async () => {
      mockClient.listSapSystems.mockResolvedValue(mockSapSystemListResponse);
      const testUri = new URL('simplifier://sap-systems');

      await listHandler(testUri);

      expect(mockWrapResourceResult).toHaveBeenCalledWith(
        testUri,
        expect.any(Function)
      );
    });

    it('should include all SAP system properties in response', async () => {
      mockClient.listSapSystems.mockResolvedValue(mockSapSystemListResponse);

      const result = await listHandler(new URL('simplifier://sap-systems'));

      const firstSystem = result.sapSystems[0];
      expect(firstSystem).toMatchObject({
        name: 'DEV_SYSTEM',
        description: 'Development SAP System',
        active: true,
        systemType: 'Development',
        tags: ['development', 'test'],
        updateInfo: expect.any(Object),
        referencedBy: expect.any(Object)
      });
    });
  });

  describe('sap-system-details resource', () => {
    let detailsHandler: Function;

    beforeEach(() => {
      registerSapSystemResources(mockServer, mockClient);

      const detailsResourceCall = mockServer.resource.mock.calls.find(
        call => call[0] === 'sap-system-details'
      );
      detailsHandler = detailsResourceCall![3] as Function;

      mockWrapResourceResult.mockImplementation(async (_uri: any, callback: any) => {
        return callback();
      });
    });

    it('should return details for a specific SAP system', async () => {
      mockClient.getSapSystem.mockResolvedValue(mockSapSystemDetails);

      const result = await detailsHandler(
        new URL('simplifier://sap-system/DEV_SYSTEM'),
        { sapSystemName: 'DEV_SYSTEM' }
      );

      expect(mockClient.getSapSystem).toHaveBeenCalledWith(
        'DEV_SYSTEM',
        expect.stringContaining('sap-system-details')
      );

      expect(result).toMatchObject({
        name: 'DEV_SYSTEM',
        description: 'Development SAP System',
        active: true,
        configuration: expect.objectContaining({
          systemId: 'DEV',
          systemNumber: '00',
          clientNumber: '100',
          sncQualityOfProtection: 'privacy+integrity+authentication'
        })
      });
    });

    it('should convert SNC quality of protection ID to string', async () => {
      const systemWithMaxQuality: SAPSystem = {
        ...mockSapSystemDetails,
        configuration: {
          ...mockSapSystemDetails.configuration,
          sncQualityOfProtection: 9 // maximum
        }
      };

      mockClient.getSapSystem.mockResolvedValue(systemWithMaxQuality);

      const result = await detailsHandler(
        new URL('simplifier://sap-system/PRD_SYSTEM'),
        { sapSystemName: 'PRD_SYSTEM' }
      );

      expect(result.configuration.sncQualityOfProtection).toBe('maximum');
    });

    it('should handle all SNC quality of protection levels', async () => {
      const testCases = [
        { id: 1, expected: 'authentication' },
        { id: 2, expected: 'integrity+authentication' },
        { id: 3, expected: 'privacy+integrity+authentication' },
        { id: 8, expected: 'default' },
        { id: 9, expected: 'maximum' }
      ];

      for (const testCase of testCases) {
        const systemWithQuality: SAPSystem = {
          ...mockSapSystemDetails,
          configuration: {
            ...mockSapSystemDetails.configuration,
            sncQualityOfProtection: testCase.id
          }
        };

        mockClient.getSapSystem.mockResolvedValue(systemWithQuality);

        const result = await detailsHandler(
          new URL(`simplifier://sap-system/TEST_${testCase.id}`),
          { sapSystemName: `TEST_${testCase.id}` }
        );

        expect(result.configuration.sncQualityOfProtection).toBe(testCase.expected);
      }
    });

    it('should handle SAP system with SNC enabled', async () => {
      const sncSystem: SAPSystem = {
        ...mockSapSystemDetails,
        name: 'SNC_SYSTEM',
        configuration: {
          ...mockSapSystemDetails.configuration,
          sncActive: true,
          sncPartner: 'p:CN=PRD, O=MyCompany, C=US',
          sncSsoMode: true,
          sncQualityOfProtection: 9,
          sapRouterString: '/H/router.example.com/S/3299/H/'
        }
      };

      mockClient.getSapSystem.mockResolvedValue(sncSystem);

      const result = await detailsHandler(
        new URL('simplifier://sap-system/SNC_SYSTEM'),
        { sapSystemName: 'SNC_SYSTEM' }
      );

      expect(result.configuration).toMatchObject({
        sncActive: true,
        sncPartner: 'p:CN=PRD, O=MyCompany, C=US',
        sncSsoMode: true,
        sncQualityOfProtection: 'maximum',
        sapRouterString: '/H/router.example.com/S/3299/H/'
      });
    });

    it('should throw error when sapSystemName is an object', async () => {
      await expect(
        detailsHandler(
          new URL('simplifier://sap-system/multiple'),
          { sapSystemName: ['System1', 'System2'] }
        )
      ).rejects.toThrow('Only details for a single SAP system can be requested at once');
    });

    it('should call wrapResourceResult with correct URI', async () => {
      mockClient.getSapSystem.mockResolvedValue(mockSapSystemDetails);
      const testUri = new URL('simplifier://sap-system/DEV_SYSTEM');

      await detailsHandler(testUri, { sapSystemName: 'DEV_SYSTEM' });

      expect(mockWrapResourceResult).toHaveBeenCalledWith(
        testUri,
        expect.any(Function)
      );
    });

    it('should preserve all SAP system properties', async () => {
      const fullSystem: SAPSystem = {
        name: 'FULL_SYSTEM',
        description: 'Full SAP System with all properties',
        active: true,
        instanceRestrictions: ['instance1', 'instance2'],
        systemType: 'QA',
        configuration: {
          systemId: 'QAS',
          systemNumber: '02',
          clientNumber: '300',
          language: 'DE',
          applicationServerHostname: 'sap-qa.example.com',
          sapRouterString: '/H/router.qa/S/3299/H/',
          sncActive: true,
          sncPartner: 'p:CN=QAS, O=Company',
          sncSsoMode: false,
          sncQualityOfProtection: 2
        },
        tags: ['qa', 'testing', 'integration'],
        assignedProjects: {
          projectsBefore: ['OldProject'],
          projectsAfterChange: ['NewProject1', 'NewProject2']
        },
        permission: {
          deletable: true,
          editable: true
        }
      };

      mockClient.getSapSystem.mockResolvedValue(fullSystem);

      const result = await detailsHandler(
        new URL('simplifier://sap-system/FULL_SYSTEM'),
        { sapSystemName: 'FULL_SYSTEM' }
      );

      expect(result).toMatchObject({
        name: 'FULL_SYSTEM',
        description: 'Full SAP System with all properties',
        active: true,
        instanceRestrictions: ['instance1', 'instance2'],
        systemType: 'QA',
        configuration: {
          systemId: 'QAS',
          systemNumber: '02',
          clientNumber: '300',
          language: 'DE',
          applicationServerHostname: 'sap-qa.example.com',
          sapRouterString: '/H/router.qa/S/3299/H/',
          sncActive: true,
          sncPartner: 'p:CN=QAS, O=Company',
          sncSsoMode: false,
          sncQualityOfProtection: 'integrity+authentication'
        },
        tags: ['qa', 'testing', 'integration'],
        assignedProjects: {
          projectsBefore: ['OldProject'],
          projectsAfterChange: ['NewProject1', 'NewProject2']
        },
        permission: {
          deletable: true,
          editable: true
        }
      });
    });

    it('should handle SAP system with minimal configuration', async () => {
      const minimalSystem: SAPSystem = {
        name: 'MINIMAL',
        description: 'Minimal system',
        active: false,
        instanceRestrictions: [],
        systemType: '',
        configuration: {
          systemId: 'MIN',
          systemNumber: '99',
          clientNumber: '001',
          language: 'EN',
          applicationServerHostname: 'minimal.example.com',
          sapRouterString: '',
          sncActive: false,
          sncPartner: '',
          sncSsoMode: false,
          sncQualityOfProtection: 3
        },
        tags: [],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        },
        permission: {
          deletable: true,
          editable: true
        }
      };

      mockClient.getSapSystem.mockResolvedValue(minimalSystem);

      const result = await detailsHandler(
        new URL('simplifier://sap-system/MINIMAL'),
        { sapSystemName: 'MINIMAL' }
      );

      expect(result).toMatchObject({
        name: 'MINIMAL',
        active: false,
        instanceRestrictions: [],
        systemType: '',
        configuration: expect.objectContaining({
          systemId: 'MIN',
          sapRouterString: '',
          sncActive: false
        }),
        tags: []
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from listSapSystems', async () => {
      registerSapSystemResources(mockServer, mockClient);

      const listResourceCall = mockServer.resource.mock.calls.find(
        call => call[0] === 'sap-systems-list'
      );
      const listHandler = listResourceCall![3] as Function;

      const testError = new Error('API Error');
      mockClient.listSapSystems.mockRejectedValue(testError);

      mockWrapResourceResult.mockImplementation(async (_uri: any, callback: any) => {
        return callback();
      });

      await expect(
        listHandler(new URL('simplifier://sap-systems'))
      ).rejects.toThrow('API Error');
    });

    it('should propagate errors from getSapSystem', async () => {
      registerSapSystemResources(mockServer, mockClient);

      const detailsResourceCall = mockServer.resource.mock.calls.find(
        call => call[0] === 'sap-system-details'
      );
      const detailsHandler = detailsResourceCall![3] as Function;

      const testError = new Error('System not found');
      mockClient.getSapSystem.mockRejectedValue(testError);

      mockWrapResourceResult.mockImplementation(async (_uri: any, callback: any) => {
        return callback();
      });

      await expect(
        detailsHandler(
          new URL('simplifier://sap-system/NONEXISTENT'),
          { sapSystemName: 'NONEXISTENT' }
        )
      ).rejects.toThrow('System not found');
    });
  });
});
