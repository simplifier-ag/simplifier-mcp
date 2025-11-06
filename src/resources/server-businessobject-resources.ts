import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {trackingResourcePrefix} from "../client/matomo-tracking.js";


export function registerServerBusinessObjectResources(server: McpServer, simplifier: SimplifierClient): void {

  const noListCallback = { list: undefined }

  const resourceNameBusinessObjectList = "businessobject-list"
  server.resource( resourceNameBusinessObjectList, "simplifier://businessobjects", {
      title: "List Business Objects",
      mimeType: "application/json",
      description: `#Get the list of server side Business Objects`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const trackingKey = trackingResourcePrefix + resourceNameBusinessObjectList
        return (await simplifier.getServerBusinessObjects(trackingKey)).map(bo => ({
          name: bo.name, uri: `simplifier://businessobject/${bo.name}`
        }))
      })
    }
  );

  const resourceNameBusinessObjectDetails = "businessobject-details"
  server.resource( resourceNameBusinessObjectDetails,
    new ResourceTemplate("simplifier://businessobject/{objectName}", noListCallback), {
      title: "Business Object Details",
      mimeType: "application/json",
      description: `#Get details of a server side Business Object`
    },
    async (uri: URL, {objectName}) => {
      return wrapResourceResult(uri, async () => {
        const trackingKey = trackingResourcePrefix + resourceNameBusinessObjectDetails
        const oDetails = await await simplifier.getServerBusinessObjectDetails(objectName as string, trackingKey)
        return {
          ...oDetails,
          functions: (oDetails.functionNames as string[]).map(fName => {
            return `simplifier://businessobject/${objectName}/function/${fName}`
          })
        }
      })
    }
  );

  const resourceNameBusinessObjectFunction = "businessobject-function"
  server.resource( resourceNameBusinessObjectFunction,  new ResourceTemplate("simplifier://businessobject/{objectName}/function/{functionName}", noListCallback), {
      title: "Server Business Object Function",
      mimeType: "application/json",
      description: `
# Get details on a Function of a Server Side Business Object

Use this template resource in order to access
* Metadata
* Input and Output Parameters
* Source Code
`
    },
    async (uri: URL, {objectName, functionName}) => {
      return wrapResourceResult(uri, () => {
        const trackingKey = trackingResourcePrefix + resourceNameBusinessObjectFunction
        return simplifier.getServerBusinessObjectFunction(objectName as string, functionName as string, trackingKey);
      })
    }
  );

}


