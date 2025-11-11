import {SimplifierClient} from "../client/simplifier-client.js"; import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {trackingResourcePrefix} from "../client/matomo-tracking.js";
import { RFCWizardSearchOptions } from "../client/types.js";

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
            "simplifier://connector/{connectorName}/call/{callName} - Specific call details",
            "simplifier://connector-wizard/{connectorName}/search/{term}/{page} - Search for available SAP RFC function calls",
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

  // Resource template for specific connector call details
  const resourceNameConnectorWSDL = "connector-wsdl"
  const connectorWSDLTemplate = new ResourceTemplate("simplifier://connector/{connectorName}/wsdl", noListCallback);

  server.resource(resourceNameConnectorWSDL, connectorWSDLTemplate, {
      title: "SOAP Connector WSDL",
      mimeType: "application/xml",
      description: `# Get the currently used WSDL for a SOAP connector

Returns the full XML source of the WSDL. Will fail on non-SOAP connectors`
    },
    async (uri: URL, { connectorName }) => {
      return wrapResourceResult(uri, async () => {
        if (typeof connectorName === 'object') {
          throw new Error("only one connector name allowed")
        }

        const trackingKey = trackingResourcePrefix + resourceNameConnectorWSDL
        const instances = await simplifier.getInstanceSettings(trackingKey);
        const activeInstance = instances.find(inst => inst.active);
        if (!activeInstance) {
          throw new Error("The server currently does not define an active instance");
        }
        return simplifier.getSoapConnectorWSDL(connectorName, activeInstance.name)
      }, "application/xml");
    },
  );

  const resourceNameRFCConnectorWizardSearch = "connector-wizard-search-functions"
  const connectorRFCConnectorWizardSearch = new ResourceTemplate("simplifier://connector-wizard/{connectorName}/search/{term}/{page}", noListCallback);
  const connectorWizardSearchPageSize = 50;
  server.resource(resourceNameRFCConnectorWizardSearch, connectorRFCConnectorWizardSearch, {
      title: "Search available function calls (for RFC connectors)",
      mimeType: "application/json",
      description: `# Searches for function calls available to a connector

Currently, this is only supported for RFC connectors.
Returns a list of functions avaliable to the connector {connectorName}, that contain the given {term}.
Any non-alphanumeric characters in the search term should be uri-encoded, e.g. %2F for /, %20 for space.
At most ${connectorWizardSearchPageSize} items are returned at once, the third variable in the URI specifies the {page},
starting at 0.`
    },
    async (uri: URL, { connectorName, term, page }) => {
      return wrapResourceResult(uri, async () => {
        if(typeof connectorName !== 'string' || typeof term !== 'string' || typeof page !== 'string') {
          throw new Error('URL variables may not be lists');
        }
        const termDecoded = decodeURIComponent(term)
        const pageNo = parseInt(page)
        const trackingKey = trackingResourcePrefix + resourceNameRFCConnectorWizardSearch;
        const filter: RFCWizardSearchOptions = {
          searchOptions: {
              searchValue: termDecoded,
          },
          retrievalOptions: {
              filter: `%${termDecoded}%`,
              filterMode: "Simple",
          },
        }
        const matches = await simplifier.searchPossibleRFCConnectorCalls(connectorName, filter, trackingKey);
        return {
          matches: matches.slice(pageNo * connectorWizardSearchPageSize, (pageNo + 1) * connectorWizardSearchPageSize),
          searchTerm: term,
          page: pageNo,
          totalPages: Math.ceil(matches.length / connectorWizardSearchPageSize),
        };
      });
    });

}
