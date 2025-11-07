import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../../src/client/simplifier-client.js";
import { registerSapSystemTools, sncProtectionQualities, sncProtectionQualityById } from "../../src/tools/sap-system-tools.js";
import { wrapToolResult } from "../../src/tools/toolresult.js";
import { SAPSystem } from "../../src/client/types.js";

// Mock the wrapToolResult function
jest.mock("../../src/tools/toolresult.js", () => ({
  wrapToolResult: jest.fn()
}));

describe('registerSapSystemTools', () => {
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
      getSapSystem: jest.fn(),
      createSapSystem: jest.fn(),
      updateSapSystem: jest.fn(),
      deleteSapSystem: jest.fn()
    } as any;

    // Get the mocked functions
    mockWrapToolResult = wrapToolResult as jest.MockedFunction<typeof wrapToolResult>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('function registration', () => {
    it('should register two SAP system tools', () => {
      registerSapSystemTools(mockServer, mockSimplifierClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(2);

      // Check the sap-system-update tool registration
      expect(mockServer.tool).toHaveBeenCalledWith(
        "sap-system-update",
        expect.stringContaining("#Create or update a SAP system"),
        expect.objectContaining({
          name: expect.any(Object),
          description: expect.any(Object),
          active: expect.any(Object),
          instanceRestrictions: expect.any(Object),
          systemType: expect.any(Object),
          configuration: expect.any(Object),
          tags: expect.any(Object),
          projectsBefore: expect.any(Object),
          projectsAfterChange: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Create or update a SAP system",
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: true
        }),
        expect.any(Function)
      );

      // Check the sap-system-delete tool registration
      expect(mockServer.tool).toHaveBeenCalledWith(
        "sap-system-delete",
        expect.stringContaining("# Delete an existing SAP system"),
        expect.objectContaining({
          name: expect.any(Object)
        }),
        expect.objectContaining({
          title: "Delete a SAP system",
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false
        }),
        expect.any(Function)
      );
    });
  });

  describe('sap-system-update tool', () => {
    let updateHandler: Function;

    beforeEach(() => {
      registerSapSystemTools(mockServer, mockSimplifierClient);
      const updateToolCall = mockServer.tool.mock.calls.find(
        call => call[0] === "sap-system-update"
      );
      updateHandler = updateToolCall![4] as Function;

      // Setup wrapToolResult to execute the callback
      mockWrapToolResult.mockImplementation(async (_description, callback) => {
        return callback();
      });
    });

    it('should create a new SAP system when it does not exist', async () => {
      mockSimplifierClient.getSapSystem.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createSapSystem.mockResolvedValue("Successfully created SAP system 'TestSAPSystem'");

      await updateHandler({
        name: "TestSAPSystem",
        description: "Test SAP System Description",
        active: true,
        instanceRestrictions: [],
        systemType: "Development",
        configuration: {
          systemId: "DEV",
          systemNumber: "00",
          clientNumber: "100",
          language: "EN",
          applicationServerHostname: "sap.example.com",
          sncActive: false,
          sncPartner: "",
          sncSsoMode: false,
          sncQualityOfProtection: "privacy+integrity+authentication"
        },
        tags: ["test"],
        projectsBefore: [],
        projectsAfterChange: ["Project1"]
      });

      expect(mockSimplifierClient.getSapSystem).toHaveBeenCalledWith(
        "TestSAPSystem",
        expect.stringContaining("sap-system-update")
      );
      expect(mockSimplifierClient.createSapSystem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "TestSAPSystem",
          description: "Test SAP System Description",
          active: true,
          configuration: expect.objectContaining({
            systemId: "DEV",
            systemNumber: "00",
            clientNumber: "100",
            sncQualityOfProtection: 3
          })
        })
      );
      expect(mockSimplifierClient.updateSapSystem).not.toHaveBeenCalled();
    });

    it('should update an existing SAP system', async () => {
      const mockExistingSystem: SAPSystem = {
        name: "ExistingSAPSystem",
        description: "Old Description",
        active: true,
        instanceRestrictions: [],
        systemType: "Development",
        configuration: {
          systemId: "DEV",
          systemNumber: "00",
          clientNumber: "100",
          language: "EN",
          applicationServerHostname: "old.example.com",
          sapRouterString: "",
          sncActive: false,
          sncPartner: "",
          sncSsoMode: false,
          sncQualityOfProtection: 3
        },
        tags: ["old"],
        assignedProjects: {
          projectsBefore: [],
          projectsAfterChange: []
        },
        permission: {
          deletable: true,
          editable: true
        }
      };

      mockSimplifierClient.getSapSystem.mockResolvedValue(mockExistingSystem);
      mockSimplifierClient.updateSapSystem.mockResolvedValue("Successfully updated SAP system 'ExistingSAPSystem'");

      await updateHandler({
        name: "ExistingSAPSystem",
        description: "New Description",
        active: true,
        instanceRestrictions: [],
        systemType: "Development",
        configuration: {
          systemId: "DEV",
          systemNumber: "00",
          clientNumber: "100",
          language: "EN",
          applicationServerHostname: "new.example.com",
          sncActive: false,
          sncPartner: "",
          sncSsoMode: false,
          sncQualityOfProtection: "privacy+integrity+authentication"
        },
        tags: ["new"],
        projectsBefore: [],
        projectsAfterChange: []
      });

      expect(mockSimplifierClient.getSapSystem).toHaveBeenCalledWith(
        "ExistingSAPSystem",
        expect.stringContaining("sap-system-update")
      );
      expect(mockSimplifierClient.updateSapSystem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ExistingSAPSystem",
          description: "New Description",
          configuration: expect.objectContaining({
            applicationServerHostname: "new.example.com"
          })
        })
      );
      expect(mockSimplifierClient.createSapSystem).not.toHaveBeenCalled();
    });

    it('should handle SNC configuration correctly', async () => {
      mockSimplifierClient.getSapSystem.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createSapSystem.mockResolvedValue("Successfully created SAP system 'SNCSystem'");

      await updateHandler({
        name: "SNCSystem",
        description: "SAP System with SNC",
        active: true,
        instanceRestrictions: [],
        configuration: {
          systemId: "PRD",
          systemNumber: "01",
          clientNumber: "200",
          language: "EN",
          applicationServerHostname: "sap-prod.example.com",
          sapRouterString: "/H/router.example.com/S/3299/H/",
          sncActive: true,
          sncPartner: "p:CN=PRD, O=MyCompany, C=US",
          sncSsoMode: true,
          sncQualityOfProtection: "maximum"
        },
        tags: [],
        projectsBefore: [],
        projectsAfterChange: []
      });

      expect(mockSimplifierClient.createSapSystem).toHaveBeenCalledWith(
        expect.objectContaining({
          configuration: expect.objectContaining({
            sncActive: true,
            sncPartner: "p:CN=PRD, O=MyCompany, C=US",
            sncSsoMode: true,
            sncQualityOfProtection: 9, // "maximum" = 9
            sapRouterString: "/H/router.example.com/S/3299/H/"
          })
        })
      );
    });

    it('should handle optional fields with default values', async () => {
      mockSimplifierClient.getSapSystem.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createSapSystem.mockResolvedValue("Successfully created SAP system 'MinimalSystem'");

      await updateHandler({
        name: "MinimalSystem",
        description: "Minimal SAP System",
        active: undefined, // Will be handled in the tool implementation
        instanceRestrictions: [],
        systemType: undefined, // Optional field
        configuration: {
          systemId: "MIN",
          systemNumber: "99",
          clientNumber: "001",
          language: "DE",
          applicationServerHostname: "minimal.example.com",
          sapRouterString: undefined, // Optional field
          sncActive: false,
          sncPartner: "",
          sncSsoMode: false,
          sncQualityOfProtection: undefined // Will use default
        },
        tags: [],
        projectsBefore: [],
        projectsAfterChange: []
      });

      const callArgs = mockSimplifierClient.createSapSystem.mock.calls[0][0];
      expect(callArgs.systemType).toBe(""); // default value when undefined/optional
      expect(callArgs.configuration.sapRouterString).toBe(""); // default value when undefined/optional
      expect(callArgs.configuration.sncQualityOfProtection).toBe(3); // default value for "privacy+integrity+authentication"
    });

    it('should handle all SNC quality of protection levels', async () => {
      mockSimplifierClient.getSapSystem.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createSapSystem.mockResolvedValue("Successfully created SAP system 'TestSystem'");

      const testCases = [
        { input: "authentication", expected: 1 },
        { input: "integrity+authentication", expected: 2 },
        { input: "privacy+integrity+authentication", expected: 3 },
        { input: "default", expected: 8 },
        { input: "maximum", expected: 9 }
      ];

      for (const testCase of testCases) {
        await updateHandler({
          name: "TestSystem",
          description: "Test",
          instanceRestrictions: [],
          configuration: {
            systemId: "TST",
            systemNumber: "00",
            clientNumber: "100",
            language: "EN",
            applicationServerHostname: "test.example.com",
            sncActive: true,
            sncPartner: "test",
            sncSsoMode: false,
            sncQualityOfProtection: testCase.input
          },
          tags: [],
          projectsBefore: [],
          projectsAfterChange: []
        });

        expect(mockSimplifierClient.createSapSystem).toHaveBeenCalledWith(
          expect.objectContaining({
            configuration: expect.objectContaining({
              sncQualityOfProtection: testCase.expected
            })
          })
        );

        mockSimplifierClient.createSapSystem.mockClear();
      }
    });

    it('should handle project assignments correctly', async () => {
      mockSimplifierClient.getSapSystem.mockRejectedValue(new Error("Not found"));
      mockSimplifierClient.createSapSystem.mockResolvedValue("Successfully created SAP system 'ProjectSystem'");

      await updateHandler({
        name: "ProjectSystem",
        description: "System with projects",
        instanceRestrictions: [],
        configuration: {
          systemId: "PRJ",
          systemNumber: "00",
          clientNumber: "100",
          language: "EN",
          applicationServerHostname: "project.example.com",
          sncActive: false,
          sncPartner: "",
          sncSsoMode: false
        },
        tags: [],
        projectsBefore: ["OldProject1", "OldProject2"],
        projectsAfterChange: ["NewProject1", "NewProject2", "NewProject3"]
      });

      expect(mockSimplifierClient.createSapSystem).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedProjects: {
            projectsBefore: ["OldProject1", "OldProject2"],
            projectsAfterChange: ["NewProject1", "NewProject2", "NewProject3"]
          }
        })
      );
    });
  });

  describe('sap-system-delete tool', () => {
    let deleteHandler: Function;

    beforeEach(() => {
      registerSapSystemTools(mockServer, mockSimplifierClient);
      const deleteToolCall = mockServer.tool.mock.calls.find(
        call => call[0] === "sap-system-delete"
      );
      deleteHandler = deleteToolCall![4] as Function;

      // Setup wrapToolResult to execute the callback
      mockWrapToolResult.mockImplementation(async (_description, callback) => {
        return callback();
      });
    });

    it('should delete a SAP system by name', async () => {
      mockSimplifierClient.deleteSapSystem.mockResolvedValue("Successfully deleted SAP system 'SystemToDelete'");

      await deleteHandler({ name: "SystemToDelete" });

      expect(mockSimplifierClient.deleteSapSystem).toHaveBeenCalledWith(
        "SystemToDelete",
        expect.stringContaining("sap-system-delete")
      );
    });

    it('should call wrapToolResult with correct description', async () => {
      mockSimplifierClient.deleteSapSystem.mockResolvedValue("Successfully deleted SAP system 'TestSystem'");

      await deleteHandler({ name: "TestSystem" });

      expect(mockWrapToolResult).toHaveBeenCalledWith(
        "Delete SAP system TestSystem",
        expect.any(Function)
      );
    });
  });

  describe('sncProtectionQualities mapping', () => {
    it('should have correct quality to ID mappings', () => {
      expect(sncProtectionQualities).toEqual({
        "authentication": 1,
        "integrity+authentication": 2,
        "privacy+integrity+authentication": 3,
        "default": 8,
        "maximum": 9
      });
    });

    it('should map all quality levels correctly', () => {
      expect(sncProtectionQualities["authentication"]).toBe(1);
      expect(sncProtectionQualities["integrity+authentication"]).toBe(2);
      expect(sncProtectionQualities["privacy+integrity+authentication"]).toBe(3);
      expect(sncProtectionQualities["default"]).toBe(8);
      expect(sncProtectionQualities["maximum"]).toBe(9);
    });
  });

  describe('sncProtectionQualityById function', () => {
    it('should return correct quality name for valid IDs', () => {
      expect(sncProtectionQualityById(1)).toBe("authentication");
      expect(sncProtectionQualityById(2)).toBe("integrity+authentication");
      expect(sncProtectionQualityById(3)).toBe("privacy+integrity+authentication");
      expect(sncProtectionQualityById(8)).toBe("default");
      expect(sncProtectionQualityById(9)).toBe("maximum");
    });

    it('should return undefined for invalid IDs', () => {
      expect(sncProtectionQualityById(0)).toBeUndefined();
      expect(sncProtectionQualityById(4)).toBeUndefined();
      expect(sncProtectionQualityById(10)).toBeUndefined();
      expect(sncProtectionQualityById(-1)).toBeUndefined();
    });
  });
});
