import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";

/**
 * Read-only tool mirrors for data type resources.
 *
 * These tools exist so that MCP clients which do not implement the
 * `resources/*` capability can still discover and inspect data types.
 * Clients that support resources should prefer the corresponding
 * `simplifier://datatype/...` and `simplifier://datatypes/...` resources.
 */
export function registerServerDatatypeReadTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameList = "datatype-list";
  server.tool(toolNameList,
    `# List data types

Returns the names, ids and categories of all data types, optionally filtered by namespace.
When a \`namespace\` is given, only data types in that namespace are returned; otherwise
root-namespace data types (including base types) are returned.

Equivalent to reading the \`simplifier://datatypes/namespace/noDetails\` and
\`simplifier://datatypes/namespace/noDetails/{namespace}\` resources; prefer the resources
in clients that support MCP Resources.`,
    {
      namespace: z.string().optional().describe("Optional namespace to filter by (e.g. 'bo/MyBO' or 'con/MyConnector'). Leave empty for root namespace.")
    },
    {
      title: "List data types",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ namespace }) => {
      return wrapToolResult(`list data types${namespace ? ` in namespace ${namespace}` : ""}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameList;
        const dataTypes = await simplifier.getDataTypes(trackingKey);

        const toMinimal = <T extends { name: string; id: string; category: string }>(dt: T) => ({
          name: dt.name,
          id: dt.id,
          category: dt.category
        });

        if (!namespace) {
          return {
            namespace: "(root - no namespace)",
            domainTypes: dataTypes.domainTypes.filter(dt => !dt.nameSpace).map(toMinimal),
            structTypes: dataTypes.structTypes.filter(st => !st.nameSpace).map(toMinimal),
            collectionTypes: dataTypes.collectionTypes.filter(ct => !ct.nameSpace).map(toMinimal),
            availableNamespaces: dataTypes.nameSpaces
          };
        }

        return {
          namespace,
          domainTypes: dataTypes.domainTypes.filter(dt => dt.nameSpace === namespace).map(toMinimal),
          structTypes: dataTypes.structTypes.filter(st => st.nameSpace === namespace).map(toMinimal),
          collectionTypes: dataTypes.collectionTypes.filter(ct => ct.nameSpace === namespace).map(toMinimal)
        };
      });
    });

  const toolNameGet = "datatype-get";
  server.tool(toolNameGet,
    `# Get details of a single data type

Returns complete information (fields, category, description, tags, project assignments) for a
data type identified by its fully qualified name. For types in the root namespace, pass just the
name; for types in a namespace, pass \`namespace/name\` (e.g. \`bo/MyBO/MyStruct\`).

Equivalent to reading the \`simplifier://datatype/{qualifiedName}\` resource; prefer the resource
in clients that support MCP Resources.`,
    {
      qualifiedName: z.string().describe("Fully qualified data type name (e.g. 'String' for root, 'bo/MyBO/MyStruct' with namespace)")
    },
    {
      title: "Get data type details",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ qualifiedName }) => {
      return wrapToolResult(`get data type ${qualifiedName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameGet;
        return simplifier.getDataTypeByName(qualifiedName, trackingKey);
      });
    });
}
