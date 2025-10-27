import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";


export function registerServerBusinessObjectResources(server: McpServer, simplifier: SimplifierClient): void {

  const noListCallback = { list: undefined }

  server.resource( "businessobject-list", "simplifier://businessobjects", {
      title: "List Business Objects",
      mimeType: "application/json",
      description: `#Get the list of server side Business Objects`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        return (await simplifier.getServerBusinessObjects()).map(bo => ({
          name: bo.name, uri: `simplifier://businessobject/${bo.name}`
        }))
      })
    }
  );

  server.resource( "businessobject-details",
    new ResourceTemplate("simplifier://businessobject/{objectName}", noListCallback), {
      title: "Business Object Details",
      mimeType: "application/json",
      description: `#Get details of a server side Business Object`
    },
    async (uri: URL, {objectName}) => {
      return wrapResourceResult(uri, async () => {
        const oDetails = await await simplifier.getServerBusinessObjectDetails(objectName as string)
        return {
          ...oDetails,
          functions: (oDetails.functionNames as string[]).map(fName => {
            return `simplifier://businessobject/${objectName}/function/${fName}`
          })
        }
      })
    }
  );

  server.resource( "businessobject-function",  new ResourceTemplate("simplifier://businessobject/{objectName}/function/{functionName}", noListCallback), {
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
        return simplifier.getServerBusinessObjectFunction(objectName as string, functionName as string);
      })
    }
  );

}


