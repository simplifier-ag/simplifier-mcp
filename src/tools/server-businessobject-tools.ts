
import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapToolResult} from "./toolresult.js";
import {z} from "zod";
import {SimplifierBusinessObjectDetails, SimplifierBusinessObjectFunction, BusinessObjectTestRequest, BusinessObjectTestParameter} from "../client/types.js";


export function registerServerBusinessObjectTools(server: McpServer, simplifier: SimplifierClient): void {

  const businessObjectUpdateDescription = `#Create or update a Business Object

  **Attention:** When updating dependencies or tags, allways fetch the Business Object resource first
    to ensure operating on the latest version. Existing dependencies and tags have to be resent when doing an update - otherwise they would be cleared.

Dependencies are REQUIRED to be added when the BO functions access connectors or other BOs using Simplifier.Connector.* or Simplifier.BusinessObject.* APIs.

## Project Assignment

Business Objects must be assigned to projects using the project assignment parameters:

**For Creating New BOs:**
- Set \`projectsBefore\` to empty array \`[]\`
- Set \`projectsAfterChange\` to array of project names to assign the BO to

**For Updating Existing BOs:**
- Set \`projectsBefore\` to current project assignments (from existing BO)
- Set \`projectsAfterChange\` to new project assignments

**Example:**
\`\`\`json
{
  "name": "MyBusinessObject",
  "projectsBefore": [],
  "projectsAfterChange": ["ProjectA", "ProjectB"]
}
\`\`\`
`;

  server.tool("businessobject-update",
    businessObjectUpdateDescription,
    {
      name: z.string(),
      description: z.string(),
      // defaults have been removed for description, dependencies and tags, so that we can add the existing values, if the properties are
      // not given at all
      dependencies: z.array(z.object({
        refType: z.enum(['connector', 'serverbusinessobject', 'plugin']).describe('Type of dependency: "connector" for data connectors, "serverbusinessobject" for other Business Objects, "plugin" for Plugins'),
        name: z.string().describe('name of the connector or server business object (bo) to depend on')
      })).describe('Array of dependencies that this BO requires. CRITICAL: Add connectors and other BOs that will be accessed from BO functions using Simplifier.Connector.<Name> or Simplifier.BusinessObject.<Name> syntax. If not provided when updating, existing dependencies will be preserved.'),
      tags: z.array(z.string()).describe('Array of tags for categorizing and organizing this Business Object. If not provided when updating, existing tags will be preserved.'),
      projectsBefore: z.array(z.string()).default([]).describe('Project names before the change. Use empty array [] when creating new BOs, or provide current projects when updating.'),
      projectsAfterChange: z.array(z.string()).default([]).describe('Project names to assign the BO to. Required for tracking project assignments.')
    },
    {
      title: "Create or update a Business Object",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }, async ( {name, description, dependencies, tags, projectsBefore, projectsAfterChange}) => {
      return wrapToolResult( `create or update Business Object ${name}`, async () => {
        let oExisting: any;
        try { oExisting = await simplifier.getServerBusinessObjectDetails(name) } catch {}
        const data: SimplifierBusinessObjectDetails = {
          name: name,
          description: description,
          dependencies: dependencies,
          tags: tags,
          assignedProjects: {
            projectsBefore: projectsBefore || [],
            projectsAfterChange: projectsAfterChange || []
          }
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
 
 # Business Objects Development Guide

## Overview
This guide provides comprehensive information for implementing Business Object functions in Simplifier, including Object API usage, connector access patterns, and Business Object to Business Object communication.

## Server-Side Business Object API

The \`Simplifier\` object provides access to various server-side methods and components:

### Available Components
- **Logging**: Server-side logging capabilities e.g. Simplifier.Log.info("my log") - see details: simplifier://documentation/server-businessobjects/api/Logging
- **Utilities/Tools**: Helper functions and tools - see details: simplifier://documentation/server-businessobjects/api/Utils
- **Connectors**: Access to data connectors - TODO add information later
- **Business Objects**: Access to other Business Objects - see this description
- **Users**: User management - see details: simplifier://documentation/server-businessobjects/api/User

<code>Simplifier.Log.info(...)</code> is logging to a Simplifier Log inside the database. The logged entries can be seen by the user but cannot be accessed by this MCP so far.
<code>console.log(...)</code> is logging to the Simplifier logfile. The logged entries can be accessed by Simplifier Administrators only. The MCP cannot access these logs.

## Accessing Other Business Objects

### Basic Syntax
\`\`\`javascript
// Access other Business Objects
Simplifier.BusinessObject.<BOName>.<MethodName>(payload?)

// Access current Business Object methods
Simplifier.CurrentBusinessObject.<MethodName>(payload?)

// Access connector calls (find the available connector calls via resources)
Simplifier.Connector.<ConnectorName>.<ConnectorCallName>(payload?)
\`\`\`

### Examples
\`\`\`javascript
// Call another Business Object function
var userInfo = Simplifier.BusinessObject.UserManager.getUserById({
  userId: "12345"
});

// Call a function in the current Business Object
var result = Simplifier.CurrentBusinessObject.validateInput({
  data: input.userData
});
\`\`\`

## Configuration Requirements

### Adding Dependencies
When accessing other Business Objects or connectors from a Business Object function, these components **MUST** be added as dependencies.
(see schema for tool about getting, updating and creating Business Objects) 

### Dependency Types
- **Business Objects**: Other BOs that will be called
- **Connectors**: Data connectors that will be accessed

## Dynamic Access Methods

### Variables Approach
\`\`\`javascript
// Using variables for dynamic calls
var boName = "UserManager";
var methodName = "getUser";
var result = Simplifier.BusinessObject[boName][methodName](payload);
\`\`\`

### Dynamic Call Function
\`\`\`javascript
// Using dynamic call patterns
var result = Simplifier.BusinessObject.call(boName, methodName, payload);
\`\`\`


### Parameter Validation
\`\`\`javascript
// Always validate input parameters
if (!input.userId || input.userId.length === 0) {
  output.error = "UserId is required";
  return output;
}

var userResult = Simplifier.BusinessObject.UserService.getUser({
  userId: input.userId
});
\`\`\`


## Security Considerations

- Always validate input parameters
- Validate data types and ranges for all inputs

## Performance Tips

- Cache frequently accessed data when appropriate
- Avoid unnecessary nested Business Object calls

## Debugging Tips
- To track down an issue (e.g. the connector issue) put the failing part into a very small bo function and return the result with
  JSON.stringify as a string, then you can check, whether the expected result is delivered. Indicate in the name of the function, that it
  can be deleted after debugging. 
    
---

This documentation provides the essential patterns and best practices for implementing robust Business Object functions in Simplifier. 
Remember to always add dependencies and follow security best practices when accessing external components. Dependencies for
yourself do not need to be added, but you can access own functions like Simplifier.CurrentBusinessObject.<MethodName>(payload?).
`;

  server.tool("businessobject-function-update",
    functionUpdateDescription,
    {
      businessObjectName: z.string(),
      functionName: z.string(),
      description: z.string().optional().default(""),
      code: z.string().optional().default("return {};").describe("JavaScript function code"),
      validateIn: z.boolean().optional().default(false)
        .describe(`If true, validates that all mandatory input parameters are present before execution. Catches missing parameters early with clear validation errors (HTTP 422). If false, allows incomplete requests through, resulting in backend errors (HTTP 500).`),
      validateOut: z.boolean().optional().default(false)
        .describe(`If true, validates and filters the output response against the defined datatype structure, returning only defined fields. If false, returns the complete raw API response without filtering or validation.`),
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

  const functionTestDescription = `#Test a Business Object Function

Execute a business object function with provided input parameters for testing purposes.
This allows you to test your functions with real data and see the results.

**Common Base Data Type IDs**:
- String: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52"
- Integer: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D"
- Boolean: "2788FB5AA776C62635F156C820190D0FD3D558765201881A77382093F7248B39"
- Date: "06A9841478D7BE17C423F11C38CD6829E372093DBEC144F2A85FC7165BE8CD80"
- Float: "C09139C72F5A8A7E0036BA66CE301748BD617F463683EE03F92EDAAAA4AF8BC7"
- Any: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB"

**Parameter Usage**:
- Use parameter "name" if no alias is defined
- Use parameter "alias" instead of name if alias is defined in the function
- Values must match the expected data type

**Error Handling**:
- Wrong BO/function name → 404 error
- Missing required parameters → 400 error
- Wrong parameter names → 400/500 error
- Invalid parameter values → 400/500 error
`;

  server.tool("businessobject-function-test",
    functionTestDescription,
    {
      businessObjectName: z.string(),
      functionName: z.string(),
      inputParameters: z.array(z.object({
        name: z.string().describe("Parameter name (or alias if defined)"),
        value: z.unknown().describe("Parameter value - can be any JSON value"),
        dataTypeId: z.string().default("D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB").describe("Data type ID for the parameter"),
        optional: z.boolean().optional().default(false).describe("Whether this parameter is optional")
      })).optional().default([]).describe("Input parameters for the function")
    },
    {
      title: "Test a Business Object Function",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }, async ({ businessObjectName, functionName, inputParameters }) => {
      return wrapToolResult(`test Business Object function ${businessObjectName}.${functionName}`, async () => {
        // Convert user input to API format
        const testParameters: BusinessObjectTestParameter[] = (inputParameters || []).map(p => ({
          name: p.name,
          value: p.value,
          dataTypeId: p.dataTypeId,
          optional: p.optional || false,
          transfer: true // Always true for testing
        }));

        const testRequest: BusinessObjectTestRequest = {
          parameters: testParameters
        };

        const result = await simplifier.testServerBusinessObjectFunction(businessObjectName, functionName, testRequest);

        // Format the response nicely
        if (result.success) {
          return {
            success: true,
            message: `Function '${functionName}' executed successfully`,
            result: result.result,
            executedWith: {
              businessObject: businessObjectName,
              function: functionName,
              parameters: testParameters.map(p => ({ name: p.name, value: p.value, dataType: p.dataTypeId }))
            }
          };
        } else {
          return {
            success: false,
            message: `Function '${functionName}' execution failed`,
            error: result.error || result.message || "Unknown error",
            executedWith: {
              businessObject: businessObjectName,
              function: functionName,
              parameters: testParameters.map(p => ({ name: p.name, value: p.value, dataType: p.dataTypeId }))
            }
          };
        }
      });
    });



  server.tool("businessobject-delete", `# Delete an existing Business Object`,
    {
      name: z.string()
    },
    {
      title: "Delete a Business Object",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({name}) => {
      return wrapToolResult(`Delete Business Object ${name}`, async () => {
        return await simplifier.deleteServerBusinessObject(name);
      })
    });


  server.tool("businessobject-function-delete", `# Delete an existing Business Object Function`,
    {
      businessObjectName: z.string(),
      functionName: z.string()
    },
    {
      title: "Delete a Business Object Function",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({businessObjectName, functionName}) => {
      return wrapToolResult(`Delete Business Object Function ${businessObjectName}.${functionName}`, async () => {
        return await simplifier.deleteServerBusinessObjectFunction(businessObjectName, functionName);
      })
    });


}

