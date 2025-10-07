import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SimplifierClient } from "../client/simplifier-client.js";
import type { ConnectorTestParameter, ConnectorTestRequest } from "../client/types.js";
import { wrapToolResult } from "./toolresult.js";

export function registerConnectorTools(server: McpServer, simplifier: SimplifierClient): void {

  const connectorTestDescription = `#Test a Connector Call

Execute a connector call with provided input parameters for testing purposes.
This allows you to test connector calls with real data and see the results.

**Parameter Usage**:
- Each parameter requires a "name" (the field name) and a "value" (the actual data)
- Parameter names must match the connector call's defined parameters
- Values can be any JSON value (string, number, boolean, object, array). The connector call specifies the expected input data type.
`;

  server.tool("connector-call-test",
    connectorTestDescription,
    {
      connectorName: z.string(),
      callName: z.string(),
      parameters: z.array(z.object({
        name: z.string().describe("Parameter name"),
        value: z.unknown().describe("Parameter value - can be any JSON value")
      })).optional().default([]).describe("Input parameters for the connector call")
    },
    {
      title: "Test a Connector Call",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }, async ({ connectorName, callName, parameters }) => {
      return wrapToolResult(`test connector call ${connectorName}.${callName}`, async () => {
        // Convert user input to API format
        const testParameters: ConnectorTestParameter[] = (parameters || []).map(p => ({
          name: p.name,
          value: p.value
        }));

        const testRequest: ConnectorTestRequest = {
          parameters: testParameters
        };

        const result = await simplifier.testConnectorCall(connectorName, callName, testRequest);

        // Format the response nicely
        if (result.success) {
          return {
            success: true,
            message: `Connector call '${callName}' executed successfully`,
            result: result.result?.result,
            executedWith: {
              connector: connectorName,
              call: callName,
              parameters: testParameters
            }
          };
        } else {
          return {
            success: false,
            message: `Connector call '${callName}' execution failed`,
            error: result.error || result.message || "Unknown error",
            executedWith: {
              connector: connectorName,
              call: callName,
              parameters: testParameters
            }
          };
        }
      });
    });

}