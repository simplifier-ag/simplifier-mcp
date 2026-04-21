import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { SAPSystem } from "../client/types.js";
import { trackingToolPrefix } from "../client/matomo-tracking.js";


export function registerSapSystemTools(server: McpServer, simplifier: SimplifierClient): void {

  const sapSystemUpdateDescription = `#Create or update a SAP system

  SAP Systems are used as the target of RFC connectors.

  **Attention:** When updating tags, allways fetch the SAP system resource first to ensure operating on the latest
  version. Existing tags have to be resent when doing an update - otherwise they would be cleared.

  You can find existing SAP systems with the simplifier://sap-systems resource, and details about a single system with 
  simplifier://sap-system/{systemName}

## Project Assignment

SAP systems must be assigned to projects using the project assignment parameters:

**For Creating New SAP Systems:**
- Set \`projectsBefore\` to empty array \`[]\`
- Set \`projectsAfterChange\` to array of project names to assign the SAP system to

**For Updating Existing SAP Systems:**
- Set \`projectsBefore\` to current project assignments (from existing SAP system)
- Set \`projectsAfterChange\` to new project assignments

**Example:**
\`\`\`json
{
  "name": "MySapSystem",
  "projectsBefore": [],
  "projectsAfterChange": ["ProjectA", "ProjectB"]
}
\`\`\`
`;


  const toolNameSapSystemUpdate = "sap-system-update";

  server.tool(toolNameSapSystemUpdate,
    sapSystemUpdateDescription,
    {
      name: z.string(),
      description: z.string(),
      active: z.boolean().describe('enables or disables the SAP system. Should be true, if you want to use the system').default(true),
      instanceRestrictions: z.array(z.string()).describe("restrict this system to specific Simplifier instances, it isn't transported to unlisted instances. If this is empty, no restriction is applied"),
      systemType: z.string().describe("The type of your SAP System (e.g. Development, Testing, Production…)").optional(),
      configuration: z.object({
        systemId: z.string().describe("SAP system id"),
        systemNumber: z.string().describe("SAP system number (00-99)"),
        clientNumber: z.string().describe("SAP client number (000-999) "),
        language: z.string().describe("The language in which the SAP system should return translatable values"),
        applicationServerHostname: z.string().describe("hostname or ip of the application server"),
        sapRouterString: z.string().describe("The string used to connect via SAP-Router to your SAP System").optional(),
        sncActive: z.boolean().describe("Enable SNC for the connection"),
        sncPartner: z.string().describe("the SNC communication partner (e.g. your SAP system)"),
        sncSsoMode: z.boolean().describe("With this switch you can select to use SNC-SSO (SNC Single Sign On) Mode"),
        sncQualityOfProtection: z.enum([
          "authentication", "integrity+authentication", "privacy+integrity+authentication", "default", "maximum",
        ]).describe("sets the SNC quality of protection level").optional().default("privacy+integrity+authentication"),
      }),
      tags: z.array(z.string()).describe('Array of tags for categorizing and organizing this SAP system. If not provided when updating, existing tags will be preserved.'),
      projectsBefore: z.array(z.string()).default([]).describe('Project names before the change. Use empty array [] when creating new SAP systems, or provide current projects when updating.'),
      projectsAfterChange: z.array(z.string()).default([]).describe('Project names to assign the SAP system to. Required for tracking project assignments.')
    },
    {
      title: "Create or update a SAP system",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }, async ({ name, description, active, instanceRestrictions, systemType, configuration, tags, projectsBefore, projectsAfterChange }) => {
      return wrapToolResult(`create or update SAP system ${name}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameSapSystemUpdate;
        let oExisting: any;
        try { oExisting = await simplifier.getSapSystem(name, trackingKey) } catch { }

        const data: SAPSystem = {
          name: name,
          description: description,
          active: active,
          instanceRestrictions: instanceRestrictions,
          systemType: systemType || "",
          configuration: {
            ...configuration,
            sapRouterString: configuration.sapRouterString || "",
            sncQualityOfProtection: sncProtectionQualities[configuration.sncQualityOfProtection] || 3,
          },
          tags: tags,
          assignedProjects: {
            projectsBefore: projectsBefore || [],
            projectsAfterChange: projectsAfterChange || []
          },
          permission: {
            deletable: true,
            editable: true,
          },
        }
        if (oExisting) {
          return simplifier.updateSapSystem(data);
        } else {
          return simplifier.createSapSystem(data)
        }
      })
    });

  const toolNameSapSystemDelete = "sap-system-delete";
  server.tool(toolNameSapSystemDelete, `# Delete an existing SAP system`,
    {
      name: z.string()
    },
    {
      title: "Delete a SAP system",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ name }) => {
      return wrapToolResult(`Delete SAP system ${name}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameSapSystemDelete;
        return await simplifier.deleteSapSystem(name, trackingKey);
      })
    });

  // Read-only tool mirrors for the SAP system resources. These allow MCP clients
  // without the `resources/*` capability (e.g. OpenCode, Cursor, Cline, Continue,
  // Windsurf) to discover SAP systems. Clients that DO support resources should
  // prefer the `simplifier://sap-system/...` resources.

  const toolNameSapSystemList = "sap-system-list";
  server.tool(toolNameSapSystemList,
    `# List all SAP systems

Returns all SAP systems configured on the connected Simplifier instance, including their
instance restrictions and system type.

Equivalent to reading the \`simplifier://sap-systems\` resource; prefer the resource in clients that support MCP Resources.`,
    {},
    {
      title: "List SAP systems",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async () => {
      return wrapToolResult("list SAP systems", async () => {
        const trackingKey = trackingToolPrefix + toolNameSapSystemList;
        const response = await simplifier.listSapSystems(trackingKey);
        return {
          sapSystems: response.sapSystems,
          totalCount: response.sapSystems.length
        };
      });
    });

  const toolNameSapSystemGet = "sap-system-get";
  server.tool(toolNameSapSystemGet,
    `# Get details of a single SAP system

Returns full configuration (system id, client, application server, SNC settings, etc.) for a SAP system.
SNC Quality of Protection is returned as its string form for convenience.

Equivalent to reading the \`simplifier://sap-system/{name}\` resource; prefer the resource in clients that support MCP Resources.`,
    {
      name: z.string().describe("SAP system name")
    },
    {
      title: "Get SAP system details",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ name }) => {
      return wrapToolResult(`get SAP system ${name}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameSapSystemGet;
        const sapSystem = await simplifier.getSapSystem(name, trackingKey);
        return {
          ...sapSystem,
          configuration: {
            ...sapSystem.configuration,
            sncQualityOfProtection: sncProtectionQualityById(sapSystem.configuration.sncQualityOfProtection)
          }
        };
      });
    });
}

export const sncProtectionQualities: { [key: string]: number } = {
  "authentication": 1,
  "integrity+authentication": 2,
  "privacy+integrity+authentication": 3,
  "default": 8,
  "maximum": 9,
}

export const sncProtectionQualityById = (id: number): keyof typeof sncProtectionQualities | undefined => Object.keys(sncProtectionQualities).find(k => sncProtectionQualities[k] == id)
