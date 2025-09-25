
import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";


export function registerServerBusinessObjectResources(server: McpServer, simplifier: SimplifierClient): void {

  const businessObjectResourceTemplate = new ResourceTemplate("simplifier://businessobjects/{objectName}", {
    list: async () => {
      try {
        const businessObjects = await simplifier.getServerBusinessObjects();
        return {
          resources: businessObjects.map(bo => ({
            uri: `simplifier://businessobjects/${bo.name}`,
            name: bo.name,
            title: `Business Object: ${bo.name}`,
            description: bo.description,
            mimeType: "application/json"
          }))
        };
      } catch (error) {
        return {
          resources: []
        };
      }
    }
  });


  server.resource( "businessobject-details", businessObjectResourceTemplate, {
      title: "Business Object Details",
      mimeType: "application/json",
      description: `#Get details on a particular server side Business Object`
    },
    async (uri: URL, {objectName}) => {
      return wrapResourceResult(uri, () => {
        return simplifier.getServerBusinessObjectDetails(objectName as string);
      })
    }
  );


  const businessObjectFunctionResourceTemplate = new ResourceTemplate("simplifier://businessobjects/{objectName}/functions/{functionName}", {
    list: async () => {
      try {
        const businessObjects = await simplifier.getServerBusinessObjects();
        const resources = [];

        for (const bo of businessObjects) {
          for (const functionName of bo.functionNames) {
            resources.push({
              uri: `simplifier://businessobjects/${bo.name}/functions/${functionName}`,
              name: `${bo.name}.${functionName}`,
              title: `Function: ${functionName} (${bo.name})`,
              description: `Function ${functionName} of business object ${bo.name}`,
              mimeType: "application/json"
            });
          }
        }

        return { resources };
      } catch (error) {
        return { resources: [] };
      }
    }
  });


  server.resource( "businessobject-function",  businessObjectFunctionResourceTemplate, {
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


