
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export function registerServerBusinessObjectGuide(server: McpServer): void {
  server.registerResource(
    "server-businessobjects-guide",
    "simplifier://documentation/server-businessobjects/guide",
    {
      title: "Simplifier Server-Side Business Objects",
      mimeType: "text/markdown",
      description: "Comprehensive information for implementing Business Object functions in Simplifier, including Object API usage, connector access patterns, and Business Object to Business Object communication."
    },
    async (uri): Promise<ReadResourceResult> => {
      const markdownContent = `# Business Objects Development Guide

## Overview
This guide provides comprehensive information for implementing Business Object functions in Simplifier, including Object API usage, connector access patterns, and Business Object to Business Object communication.

## Server-Side Business Object API

The \`Simplifier\` object provides access to various server-side methods and components:

### Available Components
- **Logging**: Server-side logging capabilities e.g. Simplifier.Log.info("my log") - see details: simplifier://documentation/server-businessobjects/api/Logging
- **Utilities/Tools**: Helper functions and tools - see details: simplifier://documentation/server-businessobjects/api/Util
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
`;

      return {
        contents: [{
          uri: uri.href,
          text: markdownContent,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}
