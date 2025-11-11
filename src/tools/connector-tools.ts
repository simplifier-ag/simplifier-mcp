import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {z} from "zod";
import type { ConnectorTestParameter, ConnectorTestRequest, RFCWizardCreateCallsPayload } from "../client/types.js";
import {SimplifierClient} from "../client/simplifier-client.js";
import {SimplifierConnectorCallUpdate, SimplifierConnectorUpdate} from "../client/types.js";
import {readFile} from "../resourceprovider.js";
import {wrapToolResult} from "./toolresult.js";
import {trackingToolPrefix} from "../client/matomo-tracking.js";

export function registerConnectorTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameConnectorUpdate = "connector-update"
  server.tool(toolNameConnectorUpdate,
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
          .describe(`The name of an existing instance, defined at the Simplifier server landscape.
          **Use the name of the active instance, provided by simplifier://server-active-instance when creating 
          a connector endpoint for the server, you are currently working on.**
          HINT: In error messages, endpoint names are often eclosed in brackets [] or quotes for readability. 
          **When using endpoint name from error message, strip off brackets and quotes**
          `),
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
        const trackingKey = trackingToolPrefix + toolNameConnectorUpdate
        let oExisting: any;
        try { oExisting = await simplifier.getConnector(name, trackingKey) } catch {}
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


  const toolNameConnectorCallUpdate = "connector-call-update"
  server.tool(toolNameConnectorCallUpdate,
    readFile("tools/docs/create-or-update-connectorcall.md"),
    {
      connectorName: z.string()
        .describe(`Name of the Connector to modify calls`),
      connectorCallName: z.string()
        .describe(`Name of the Connector call to be added or modified`),
      description: z.string().default(""),
      validateIn: z.boolean().default(true)
        .describe(`If true, validates that all mandatory input parameters are present before execution. Catches missing parameters early with clear validation errors (HTTP 422). If false, allows incomplete requests through, resulting in backend errors (HTTP 500).`),
      validateOut: z.boolean().default(true)
        .describe(`If true, validates and filters the output response against the defined datatype structure, returning only defined fields (type "any" allows all fields). If false, returns the complete raw API response without filtering or validation.`),
      async: z.boolean().default(false),
      autoGenerated: z.boolean().default(false),
      connectorCallParameters: z.array(z.object({
        name: z.string()
          .describe(`Parameter name may contain '/' or '[]', indicating it's position inside a JSON object or array` ),
        alias: z.string().optional()
          .describe(`optional alias name`),
        isInput: z.boolean()
          .describe(`If true, the parameter represents an input of the connector call. Set this to false in order to define an output parameter.`),
        constValue: z.string().optional()
          .describe(`If constValue is given, the value is fixed and cannot be changed by the caller`),
        dataType: z.object({
          name: z.string()
            .describe(`Datatype name'`),
          nameSpace: z.string().optional()
            .describe(`Datatype namespace`),
          category: z.enum(['base', 'domain', 'collection', 'structure'])
            .describe(`Datatype category`),
        }),
        optional: z.boolean().default(false)
          .describe(`If true, the parameter is optional`),
        position: z.number().default(0)
          .describe(`Row position for display the parameter in the UI.`),
      })).optional().default([])
        .describe(`Call Parameters define the input and output arguments, specific to the connector type.`)
    },
    {
      title: "Create or update a Connector Call",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    },
    async (oArgs) => {
      return wrapToolResult(`create or update Connector call ${oArgs.connectorName}.${oArgs.connectorCallName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameConnectorCallUpdate
        let oExisting: any;
        try {
          oExisting = await simplifier.getConnectorCall(oArgs.connectorName, oArgs.connectorCallName, trackingKey);
        } catch {
        }
        const oConnectorCallData = {
          name: oArgs.connectorCallName,
          description: oArgs.description,
          validateIn: oArgs.validateIn,
          validateOut: oArgs.validateOut,
          async: oArgs.async,
          autoGenerated: oArgs.autoGenerated,
          connectorCallParameters: oArgs.connectorCallParameters,
        } as SimplifierConnectorCallUpdate

        if (oExisting?.name) {
          return simplifier.updateConnectorCall(oArgs.connectorName, oConnectorCallData);
        } else {
          return simplifier.createConnectorCall(oArgs.connectorName, oConnectorCallData);
        }
      });
    }
  );
  const toolNameConnectorWizardRfcCreate = "connector-wizard-rfc-create"
  server.tool(toolNameConnectorWizardRfcCreate,
    `# Create one or more calls for an RFC connector using the wizard

The RFC connector requires calls to refer to existing functions on the remote SAP system. To find available functions,
use the resource template \`simplifier://connector-wizard/{connectorName}/search/{term}/{page}\`. Select the desired
function names and pass them to this tool.
    `,
    {
      connectorName: z.string().describe(`Name of the RFC Connector to add calls to`),
      rfcFunctionNames: z.array(z.string()).describe(`Names of the SAP system's functions for which to create connector calls`),
    },
    {
      title: "Create RFC connector calls using the call wizard",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    },
    async ({connectorName, rfcFunctionNames}) => {
      return wrapToolResult(`create ${rfcFunctionNames.length} connector calls using the RFC connector wizard`, async () => {
        const trackingKey = trackingToolPrefix + toolNameConnectorWizardRfcCreate;

        // required, so that the functions are "persisted" in Simplifier
        await simplifier.viewRFCFunctions(connectorName, rfcFunctionNames, trackingKey);

        const details = await simplifier.rfcWizardGetCallDetails(connectorName, rfcFunctionNames)
        const descriptions: {[k: string]: string} = {}
        const newNames: {[k: string]: string} = {}
        for(const func of rfcFunctionNames) {
          const match = details.calls.find(callDetails => callDetails.call.nameNonTechnicalized === func);
          if(!match) {
            throw new Error(`Details for function ${func} could not be retrieved`);
          }
          descriptions[func] = match.call.description;
          newNames[func] = match.call.name;

        }
        const payload: RFCWizardCreateCallsPayload = {
          callsRfc: rfcFunctionNames,
          descriptions: descriptions,
          newNames: newNames,
        }

        await simplifier.rfcWizardCreateCalls(connectorName, payload);
        return payload;
      });
    }
  );


  const connectorTestDescription = `#Test a Connector Call

Execute a connector call with provided input parameters for testing purposes.
This allows you to test connector calls with real data and see the results.

**Parameter Usage**:
- Each parameter requires a "name" (the field name) and a "value" (the actual data)
- Parameter names must match the connector call's defined parameters
- Values can be any JSON value (string, number, boolean, object, array). The connector call specifies the expected input data type.
**Important**: In case you miss properties in the result, check whether a datatype other than Any is assigned as output data type and
whether validateOut is set to true - in this case values will be filtered to fit the datatype.
`;

  const toolNameConnectorCallTest = "connector-call-test"
  server.tool(toolNameConnectorCallTest,
    connectorTestDescription,
    {
      connectorName: z.string(),
      callName: z.string(),
      parameters: z.array(z.object({
        name: z.string().describe("Parameter name"),
        value: z.unknown().describe("Parameter value - can be any JSON value")
      })).optional().default([]).describe("Input parameters for the connector call")
    },
    {
      title: "Test a Connector Call",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    }, async ({ connectorName, callName, parameters }) => {
      return wrapToolResult(`test connector call ${connectorName}.${callName}`, async () => {
        const connectorParameters = (await simplifier.getConnectorCall(connectorName, callName)).connectorCallParameters
        const testParameters: ConnectorTestParameter[]  = await Promise.all(connectorParameters.map(async cparam => {
          const dataType = await simplifier.getDataTypeByName(cparam.dataType.name)
          return {
            name: cparam.name,
            constValue: cparam.constValue,
            value: parameters.find(p => p.name === cparam.name)?.value || parameters.find(p => p.name === cparam.alias)?.value || cparam.constValue,
            alias: cparam?.alias,
            dataType: dataType,
            transfer: true,
          } satisfies ConnectorTestParameter;
        }))

        const testRequest: ConnectorTestRequest = {
          parameters: testParameters
        };

        const trackingKey = trackingToolPrefix + toolNameConnectorCallTest
        const result = await simplifier.testConnectorCall(connectorName, callName, testRequest, trackingKey);

        // Format the response nicely
        if (result.success) {
          return {
            success: true,
            message: `Connector call '${callName}' executed successfully`,
            result: result.result,
          };
        } else {
          return {
            success: false,
            message: `Connector call '${callName}' execution failed`,
            error: result.error || result.message || "Unknown error",
          };
        }
      });
    });


  const toolNameConnectorCallDelete = "connector-call-delete"
  server.tool(toolNameConnectorCallDelete,
    `# Delete a Connector call`,
    {
      connectorName: z.string()
        .describe("Name of the Connector to modify"),
      callName: z.string()
        .describe("Name of the connector call to delete")
    },
    {
      title: "Delete a Connector Call",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    ({ connectorName, callName }) => {
      return wrapToolResult(`delete connector call ${connectorName}.${callName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameConnectorCallDelete
        return await simplifier.deleteConnectorCall(connectorName, callName, trackingKey);
      });
    });

  const toolNameConnectorDelete = "connector-delete"
  server.tool(toolNameConnectorDelete, `# Delete a Connector`,
    {
      connectorName: z.string()
        .describe("Name of the Connector to delete"),
    },
    {
      title: "Delete a Connector",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    ({ connectorName }) => {
      return wrapToolResult(`delete connector ${connectorName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameConnectorDelete
        return await simplifier.deleteConnector(connectorName, trackingKey);
      });
    });

}