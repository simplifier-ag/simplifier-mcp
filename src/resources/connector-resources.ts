import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {trackingResourcePrefix} from "../client/matomo-tracking.js";

export function registerConnectorResources(server: McpServer, simplifier: SimplifierClient): void {

  const noListCallback = { list: undefined }

  // Main discoverable connectors resource - shows up in resources/list
  const resourceNameConnectorsList = "connectors-list"
  server.resource(resourceNameConnectorsList, "simplifier://connectors", {
      title: "List All Connectors",
      mimeType: "application/json",
      description: `# Get the list of all Connectors

This resource provides the entry point for discovering all available connectors in the Simplifier instance.
Each connector can be accessed via simplifier://connector/{connectorName} for detailed information.`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const trackingKey = trackingResourcePrefix + resourceNameConnectorsList
        const response = await simplifier.listConnectors(trackingKey);
        const connectorResources = response.connectors.map(connector => ({
          uri: `simplifier://connector/${connector.name}`,
          name: connector.name,
          description: connector.description,
          type: connector.connectorType.technicalName,
          active: connector.active,
          amountOfCalls: connector.amountOfCalls
        }));

        return {
          connectors: connectorResources,
          totalCount: response.connectors.length,
          resourcePatterns: [
            "simplifier://connectors - List all connectors",
            "simplifier://connector/{connectorName} - Specific connector details",
            "simplifier://connector/{connectorName}/calls - List connector calls",
            "simplifier://connector/{connectorName}/call/{callName} - Specific call details"
          ]
        };
      });
    }
  );


  // Resource template for specific connector details
  const resourceNameConnectorDetails = "connector-details"
  const connectorDetailsTemplate = new ResourceTemplate("simplifier://connector/{connectorName}", noListCallback);

  server.resource(resourceNameConnectorDetails, connectorDetailsTemplate, {
      title: "Connector Details",
      mimeType: "application/json",
      description: `# Get detailed information about a specific connector

Returns connector configuration, endpoints, and metadata.
Use simplifier://connector/{connectorName}/calls to see available calls for this connector.`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const pathParts = uri.pathname.split('/').filter(p => p);
        const connectorName = pathParts[0];

        if (!connectorName) {
          throw new Error('Connector name is required');
        }

        const trackingKey = trackingResourcePrefix + resourceNameConnectorDetails
        const connector = await simplifier.getConnector(connectorName, trackingKey, true);

        return {
          connector,
          relatedResources: [
            {
              uri: `simplifier://connector/${connectorName}/calls`,
              description: "List all calls for this connector"
            }
          ]
        };
      });
    }
  );


  // Resource template for connector calls list
  const resourceNameConnectorCallsList = "connector-calls-list"
  const connectorCallsListTemplate = new ResourceTemplate("simplifier://connector/{connectorName}/calls", noListCallback);

  server.resource(resourceNameConnectorCallsList, connectorCallsListTemplate, {
      title: "Connector Calls List",
      mimeType: "application/json",
      description: `# Get all calls available for a specific connector

Returns a list of all callable operations for the connector.
Each call can be accessed via simplifier://connector/{connectorName}/call/{callName} for detailed parameter information.`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const pathParts = uri.pathname.split('/').filter(p => p);
        const connectorName = pathParts[0];

        if (!connectorName) {
          throw new Error('Connector name is required');
        }

        const trackingKey = trackingResourcePrefix + resourceNameConnectorCallsList
        const response = await simplifier.listConnectorCalls(connectorName, trackingKey);
        const callResources = response.connectorCalls.map(call => ({
          uri: `simplifier://connector/${connectorName}/call/${call.name}`,
          name: call.name,
          description: call.description,
          inputParameters: call.amountOfInputParameters,
          outputParameters: call.amountOfOutputParameters,
          executable: call.executable
        }));

        return {
          connectorName,
          calls: callResources,
          totalCount: response.connectorCalls.length
        };
      });
    }
  );


  // Resource template for specific connector call details
  const resourceNameConnectorCallDetails = "connector-call-details"
  const connectorCallDetailsTemplate = new ResourceTemplate("simplifier://connector/{connectorName}/call/{callName}", noListCallback);

  server.resource(resourceNameConnectorCallDetails, connectorCallDetailsTemplate, {
      title: "Connector Call Details",
      mimeType: "application/json",
      description: `# Get detailed information about a specific connector call

Returns complete parameter information including:
- Input parameters with data types and whether they are optional
- Output parameters with data types
- Parameter aliases for use in Business Object functions
- Constant values for certain parameters`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const pathParts = uri.pathname.split('/').filter(p => p);
        const connectorName = pathParts[0];
        const callName = pathParts[2];

        if (!connectorName || !callName) {
          throw new Error('Connector name and call name are required');
        }

        const trackingKey = trackingResourcePrefix + resourceNameConnectorCallDetails
        const callDetails = await simplifier.getConnectorCall(connectorName, callName, trackingKey);

        return {
          call: callDetails,
          usage: {
            note: "Use this information when creating Business Object functions that call connectors",
            example: `Simplifier.Connector.${connectorName}.${callName}({ /* parameters */ })`
          }
        };
      });
    }
  );
}
