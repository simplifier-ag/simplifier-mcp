
import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapToolResult} from "./toolresult.js";
import {z} from "zod";
import {SimplifierBusinessObjectDetails} from "../client/types.js";


export function registerServerBusinessObjectTools(server: McpServer, simplifier: SimplifierClient): void {

  const businessObjectUpdateDescription = `#Create or update a Business Object

When setting dependencies or tags, allways try fetch the Business Object resource first 
to ensure operating on the latest version.
`;

  server.tool("businessobject-update",
    businessObjectUpdateDescription,
    {
      name: z.string(),
      description: z.string().optional().default(""),
      dependencies: z.array(z.object({
        refType: z.string(),
        name: z.string()
      })).optional().default([]),
      tags: z.array(z.string()).optional().default([])
    },
    {
      title: "Create or update a Business Object",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }, async ( {name, description, dependencies, tags}) => {
      return wrapToolResult( `create or update Business Object ${name}`, async () => {
        let oExisting: any;
        try { oExisting = await simplifier.getServerBusinessObjectDetails(name) } catch {}
        const data: SimplifierBusinessObjectDetails = {
          name: name,
          description: description,
          dependencies: dependencies,
          tags: tags || []
        } as SimplifierBusinessObjectDetails
        if (oExisting) {
          return simplifier.updateServerBusinessObject(data);
        } else {
          return simplifier.createServerBusinessObject(data)
        }
      })
    });

}

