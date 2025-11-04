import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SimplifierClient } from "../client/simplifier-client.js";
import { SimplifierDataTypeCategory, SimplifierDataTypeUpdate, SimplifierDataTypeFieldUpdate } from "../client/types.js";
import { wrapToolResult } from "./toolresult.js";
import {trackingToolPrefix} from "../client/matomo-tracking.js";


export function registerServerDatatypeTools(server: McpServer, simplifier: SimplifierClient): void {

  const datatypeUpdateDescription = `#Create or update custom data types

Custom datatypes can be either
- a struct type, which requires the definition of fields and their types (parameter "fields")
- a collection type, which requires a datatype for its elements (parameter "collectionDatatype")
- a domain type, which requires a parent type it is derived from (parameter "derivedFrom")
These are mutually exclusive, so only specify exactly one of the three parameters.

In these parameters, referenced datatypes are specified by name. If it isn't a global datatype, the name must be prefixed
with the namespace, separated with a slash.

Datatypes for connectors should be in the namespace "con/$name_of_connector", those for business objects in "bo/$name_of_bo".
`;

  const datatypeDeleteDescription = `#Delete a datatype
Deletes the datatype with the given name. The name may be prefixed by the namespace, separated with a slash.
`;

  const toolNameDatatypeUpdate = "datatype-update"
  server.tool(toolNameDatatypeUpdate,
    datatypeUpdateDescription,
    {
      qualifiedName: z.string(),
      description: z.string().optional().default(""),
      derivedFrom: z.string().optional(),
      collectionDatatype: z.string().optional(),
      fields: z.array(z.object({
        name: z.string(),
        optional: z.boolean(),
        description: z.string().optional(),
        dataType: z.string(),
      })).optional(),
      tags: z.array(z.string()),
      projectAssignments: z.object({
        projectsBefore: z.array(z.string()),
        projectsAfterChange: z.array(z.string()),
      }).optional()
    },
    {
      title: "Create or update a Data Type",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }, async ({ qualifiedName: qualifiedName, description, derivedFrom, collectionDatatype, fields, tags, projectAssignments }) => {
      return wrapToolResult(`create or update data type ${qualifiedName}`, async () => {

        const { name: newTypeName, namespace: newTypeNamespace } = splitNamespace(qualifiedName);
        const category = determineCategory(fields, derivedFrom, collectionDatatype)
        if (category === 'base') {
          throw new Error("creating base types is not allowed")
        }

        const { name: derivedFromName, namespace: derivedFromNamespace } = derivedFrom ? splitNamespace(derivedFrom) : { name: undefined, namespace: undefined };
        const { name: collectionDtName, namespace: collectionDtNamespace } = collectionDatatype ? splitNamespace(collectionDatatype) : { name: undefined, namespace: undefined };

        const resolvedFields: SimplifierDataTypeFieldUpdate[] | undefined = fields?.map(f => {
          const { name: dtName, namespace: dtNamespace } = splitNamespace(f.dataType);
          return {
            name: f.name,
            dtName: dtName,
            dtNameSpace: dtNamespace,
            optional: f.optional,
            description: f.description,
          }
        })

        const data: SimplifierDataTypeUpdate = {
          name: newTypeName,
          nameSpace: newTypeNamespace,
          category: category,
          derivedFrom: derivedFromName,
          derivedFromNS: derivedFromNamespace,
          collDtName: collectionDtName,
          collDtNS: collectionDtNamespace,
          isStruct: category === 'struct',
          fields: resolvedFields || [],
          description: description,
          properties: [],
          editable: true,
          tags: tags || [],
          assignedProjects: projectAssignments || { projectsBefore: [], projectsAfterChange: [] },
        }

        const trackingKey = trackingToolPrefix + toolNameDatatypeUpdate
        let oExisting: any;
        try { oExisting = await simplifier.getSingleDataType(newTypeName, newTypeNamespace, trackingKey) } catch {}
        if (oExisting?.id) {
          return simplifier.updateDataType(data);
        } else {
          return simplifier.createDataType(data);
        }
      })
    });

  const toolNameDatatypeDelete = "datatype-delete"
  server.tool(toolNameDatatypeDelete,
    datatypeDeleteDescription,
    {
      qualifiedName: z.string(),
    },
    {
      title: "Delete a Data Type",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }, async ({ qualifiedName: qualifiedName }) => {
      return wrapToolResult(`delete data type ${qualifiedName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameDatatypeDelete
        const { name: name, namespace: namespace } = splitNamespace(qualifiedName);
        return simplifier.deleteDataType(name, namespace, trackingKey);
      })
    });

}

const splitNamespace = (qualifiedName: string): { namespace: string | undefined, name: string } => {
  const nameStart = qualifiedName.lastIndexOf('/')
  const namespace = nameStart > 0 ? qualifiedName.substring(0, nameStart) : undefined
  const name = qualifiedName.substring(nameStart + 1)
  return { namespace, name }
}

const determineCategory = (
  fields: any[] | undefined,
  derivedFrom: string | undefined,
  collectionDatatype: string | undefined
): SimplifierDataTypeCategory => {
  const nonEmpty = (x: { length: number } | undefined) => (x?.length || 0) > 0

  const isStruct = nonEmpty(fields) && !derivedFrom && !collectionDatatype
  const isBase = !isStruct && !derivedFrom && !collectionDatatype
  const isDomain = !isStruct && nonEmpty(derivedFrom) && !collectionDatatype
  const isCollection = !isStruct && !derivedFrom && nonEmpty(collectionDatatype)
  if (isStruct) return 'struct';
  else if (isBase) return 'base'
  else if (isDomain) return 'domain'
  else if (isCollection) return 'collection';
  else throw new Error("Data type must either be a struct (have fields), a domain type (be derived from another type), a collection (with a collectionDatatype), or a base type (none of the above). Combinations are not allowed.")

}
