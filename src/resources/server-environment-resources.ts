import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";

export function registerServerEnvironmentResources(server: McpServer, simplifier: SimplifierClient): void {

  server.resource("active-instance", "simplifier://server-active-instance", {
      title: "Get the active server instance",
      mimeType: "application/json",
      description: `# Get the active server instance
      `
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const aInstances = await simplifier.getInstanceSettings();
        const oFound = aInstances.find(oInst => oInst.active);
        if (!oFound) {
          throw new Error("The server currently does not define an active instance");
        }
        return oFound;
      });
    }
  );
}
