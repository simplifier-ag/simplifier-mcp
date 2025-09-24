
import {SimplifierClient} from "../client/simplifier-client";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult";


export function registerServerBusinessObjectResources(server: McpServer, simplifier: SimplifierClient): void {

  server.resource( "businessobject-list", "simplifier://serverbusinessobjects", {
      title: "Business Objects",
      mimeType: "application/json",
      description:
`#Get all server side Business Objects
Provides the list of all Business Objects from the Simplifier appserver.
`   },
    async (uri: URL) => {
      return wrapResourceResult(uri, () => {
        return simplifier.getServerBusinessObjects()
      })
    }
  );
}


