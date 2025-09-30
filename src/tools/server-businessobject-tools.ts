
import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapToolResult} from "./toolresult.js";
import {z} from "zod";
import {SimplifierBusinessObjectDetails, SimplifierBusinessObjectFunction} from "../client/types.js";


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

  const functionUpdateDescription = `#Create or update a Business Object Function

Creates or updates a JavaScript function within a server-side Business Object.
Functions contain business logic code and can call connectors or other business objects.

**Common Data Type IDs**:
- String: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52"
- Number: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D"
- Any: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB"

**Parameter Structure**: Each parameter needs name, description, alias, dataTypeId, and isOptional.
`;

  server.tool("businessobject-function-update",
    functionUpdateDescription,
    {
      businessObjectName: z.string(),
      functionName: z.string(),
      description: z.string().optional().default(""),
      code: z.string().optional().default("return {};"),
      validateIn: z.boolean().optional().default(false),
      validateOut: z.boolean().optional().default(false),
      inputParameters: z.array(z.object({
        name: z.string(),
        description: z.string().optional().default(""),
        alias: z.string().optional().default(""),
        dataTypeId: z.string().default("D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB"),
        isOptional: z.boolean().optional().default(false)
      })).optional().default([]),
      outputParameters: z.array(z.object({
        name: z.string(),
        description: z.string().optional().default(""),
        alias: z.string().optional().default(""),
        dataTypeId: z.string().default("D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB"),
        isOptional: z.boolean().optional().default(false)
      })).optional().default([])
    },
    {
      title: "Create or update a Business Object Function",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }, async ({ businessObjectName, functionName, description, code, validateIn, validateOut, inputParameters, outputParameters }) => {
      return wrapToolResult(`create or update Business Object function ${businessObjectName}.${functionName}`, async () => {
        let oExisting: any;
        try {
          oExisting = await simplifier.getServerBusinessObjectFunction(businessObjectName, functionName);
        } catch {}

        const functionData: SimplifierBusinessObjectFunction = {
          businessObjectName,
          name: functionName,
          description,
          validateIn,
          validateOut,
          inputParameters: (inputParameters || []).map(p => ({
            name: p.name,
            description: p.description || "",
            alias: p.alias || p.name,
            dataTypeId: p.dataTypeId,
            dataType: null,
            isOptional: p.isOptional || false
          })),
          outputParameters: (outputParameters || []).map(p => ({
            name: p.name,
            description: p.description || "",
            alias: p.alias || p.name,
            dataTypeId: p.dataTypeId,
            dataType: null,
            isOptional: p.isOptional || false
          })),
          functionType: "JavaScript",
          code
        };

        if (oExisting) {
          return simplifier.updateServerBusinessObjectFunction(businessObjectName, functionName, functionData);
        } else {
          return simplifier.createServerBusinessObjectFunction(businessObjectName, functionData);
        }
      });
    });

}

