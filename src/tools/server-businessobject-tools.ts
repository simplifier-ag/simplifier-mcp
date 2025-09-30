
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

**Common Base Data Type IDs**:
- String: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52"
- Integer: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D"
- Boolean: "2788FB5AA776C62635F156C820190D0FD3D558765201881A77382093F7248B39"
- Date: "06A9841478D7BE17C423F11C38CD6829E372093DBEC144F2A85FC7165BE8CD80"
- Float: "C09139C72F5A8A7E0036BA66CE301748BD617F463683EE03F92EDAAAA4AF8BC7"
- Any: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB"

**Parameter Structure**: Each parameter needs name, dataTypeId, and isOptional. Description and alias are optional.

**Code**: Standard JavaScript code. 

**Parameter access in the code**: Input parameters can be accessed with 
<code>let myVar = input.parameter_name;</code>
Output parameters can be assigned with 
<code>output.parameter_name = someOfMyResults;</code>
**Attention:** In case an alias is defined for a parameter, you have use "alias" instead of "parameter_name". Example:
<code>output.alias = someOfMyResults;</code>
 You can do an early return of output, but you don't need to end with a return. 
 The function code will be postfixed with a "return output" anyway.
 If you do a <code>return</code> instead of <code>return output</code>, then in the first case you
 will return <code>undefined</code> output parameters - this is most probably not what you want to do.  
`;

  server.tool("businessobject-function-update",
    functionUpdateDescription,
    {
      businessObjectName: z.string(),
      functionName: z.string(),
      description: z.string().optional().default(""),
      code: z.string().optional().default("return {};").describe("JavaScript function code"),
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
        dataTypeId: z.string().default("D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB")
            .describe("Initially it could make sense, to give the Any type as output data type, and only later create a fitting datatype, when the output schema is fix."),
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

