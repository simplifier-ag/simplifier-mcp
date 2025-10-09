import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapToolResult} from "./toolresult.js";
import {SimplifierConnectorUpdate} from "../client/types.js";
import {readFile} from "../resourceprovider.js";
import {z} from "zod";

export function registerConnectorTools(server: McpServer, simplifier: SimplifierClient): void {

  server.tool("connector-update",
    readFile("tools/docs/create-or-update-connector.md"),
    {
      name: z.string(),
      description: z.string().optional().default(""),
      connectorType: z.string(),
      active: z.boolean().optional().default(true),
      timeoutTime: z.number().optional().default(60)
        .describe(`maximum duration of a call in seconds`),
      endpointConfiguration: z.object({
        endpoint: z.string()
          .describe(`The name of an existing endpoint, defined at the Simplifier server landscape`),
        certificates: z.array(z.string()),
        configuration: z.any().optional()
          .describe(`The properties, defined by this object are specific to the chosen connectorType`),
        loginMethodName: z.string().optional()
          .describe(`The name of an existing login method, available on the Simplifier server`),
      }).optional()
        .describe(
          `On creating a new connector, an endpoint configuration is mandatory. 
          On updating a Connector:
          * endpoint configuration may be omitted if it is not intended to change. 
          * a new endpoint configuration can be added by using a new endpoint name. 
          * one endpoint configuration can be changed by using the name property of an existing configuration. 
        `),
      tags: z.array(z.string()).optional().default([]),
      projectsBefore: z.array(z.string()).optional().default([])
        .describe('Project names before the change. Use empty array [] when creating new Connectors, or provide current projects when updating.'),
      projectsAfterChange: z.array(z.string()).optional().default([])
        .describe('Project names to assign the Connector to. Required for tracking project assignments.')
    },
    {
      title: "Create or update a Connector",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    },
    async ( {name, description, connectorType, active, timeoutTime, endpointConfiguration, tags, projectsBefore, projectsAfterChange}) => {
      return wrapToolResult( `create or update Connector ${name}`, async () => {
        let oExisting: any;
        try { oExisting = await simplifier.getConnector(name) } catch {}
        const oConnectorData = {
          name: name,
          description: description,
          connectorType: connectorType,
          active: active,
          timeoutTime: timeoutTime,
          endpointConfiguration: endpointConfiguration,
          tags: tags,
          assignedProjects: {
            projectsBefore: projectsBefore,
            projectsAfterChange: projectsAfterChange
          }
        } as SimplifierConnectorUpdate

        if (oExisting?.name) {
          return simplifier.updateConnector(oConnectorData);
        } else {
          if (!oConnectorData.endpointConfiguration) {
            throw new Error('endpointConfiguration is required on creating a new connector!');
          }
          return simplifier.createConnector(oConnectorData)
        }
      })
    });


}