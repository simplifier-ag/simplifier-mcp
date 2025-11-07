import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapResourceResult } from "./resourcesresult.js";
import { sncProtectionQualityById } from "../tools/sap-system-tools.js";
import { trackingResourcePrefix } from "../client/matomo-tracking.js";

export function registerSapSystemResources(server: McpServer, simplifier: SimplifierClient): void {

  const resourceNameSapSystemsList = "sap-systems-list";
  // Main discoverable sap system resource - shows up in resources/list
  server.resource(resourceNameSapSystemsList, "simplifier://sap-systems", {
    title: "List All SAP systems",
    mimeType: "application/json",
    description: `# Get the list of all SAP systems

This resource provides the entry point for discovering all available SAP systems in the Simplifier instance.
Each SAP system can be accessed via simplifier://sap-system/{sapSystemName} for detailed information.

**What are SAP systems in Simplifier?**
SAP systems in Simplifier are the connection information for instances of the SAP ERP software platform. They are mainly
used as endpoints for the RFC connector. They can be restricted to specific Simplifier instances, e.g to ensure usage of
different SAP systems on dev, QA and prod instances.

**Use Cases:**
- Discover which SAP systems are configured as possible endpoints for RFC connectors
- See which connectors and business objects use the existing SAP systems
- See which SAP systems should be used for which Simplifier instance
- Track who created/modified SAP systems and when`
  },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const trackingKey = trackingResourcePrefix + resourceNameSapSystemsList;
        const response = await simplifier.listSapSystems(trackingKey);

        const sapSystemResources = response.sapSystems.map(sap => {
          return {
            uri: `simplifier://sap-system/${sap.name}`,
            ...sap,
          };
        });

        return {
          sapSystems: sapSystemResources,
          totalCount: sapSystemResources.length,
          resourcePatterns: [
            "simplifier://sap-systems - List all SAP systems",
            "simplifier://sap-system/{name} - Specific SAP system details"
          ]
        };
      });
    }
  );

  // Individual SAP systems resource template - dynamic URI with {sapSystemName}
  const noListCallback = { list: undefined };
  const resourceNameSapSystemDetails = "sap-system-details";
  server.resource("sap-system-details", new ResourceTemplate("simplifier://sap-system/{sapSystemName}", noListCallback), {
    title: "Get SAP System Details",
    mimeType: "application/json",
    description: `# Get detailed configuration for a specific SAP system

This resource provides complete configuration details for a SAP system, including:
- **General information**: Name, description, Simplifier-specific settings like tags and projects
- **Connection Configuration**: system and router information required for connecting to the system

**Note**: Unlike the list endpoint, individual details do NOT include updateInfo and referencedBy fields.

**Example URIs**:
- simplifier://sap-system/ID4
- simplifier://sap-system/erp_prod `
  },
    async (uri: URL, { sapSystemName }) => {
      return wrapResourceResult(uri, async () => {
        if (typeof (sapSystemName) === 'object') {
          throw new Error("Only details for a single SAP system can be requested at once")
        }

        const trackingKey = trackingResourcePrefix + resourceNameSapSystemDetails;
        const sapSystem = await simplifier.getSapSystem(sapSystemName, trackingKey);

        return {
          ...sapSystem,
          configuration: {
            ...sapSystem.configuration,
            sncQualityOfProtection: sncProtectionQualityById(sapSystem.configuration.sncQualityOfProtection),
          }
        };
      });
    }
  );
}
