
import {SimplifierClient} from "../client/simplifier-client";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult";


export function registerServerBusinessObjectResources(server: McpServer, simplifier: SimplifierClient): void {

  server.resource( "businessobject-list", "simplifier://serverbusinessobjects", {
      title: "Business Objects",
      mimeType: "application/json",
      description: `Get all server side Business Object Details at once`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, () => {
        return simplifier.getServerBusinessObjects()
      })
    }
  );


  server.resource( "businessobject-details",  new ResourceTemplate("simplifier://businessobjects/{objectName}", {list: undefined}), {
      title: "Business Object Details",
      mimeType: "application/json",
      description: `Get details on a particular server side Business Object`
    },
    async (uri: URL, {objectName}) => {
      return wrapResourceResult(uri, () => {
        return simplifier.getServerBusinessObjectDetails(objectName as string);
      })
    }
  );

}


