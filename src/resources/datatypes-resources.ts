import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {SimplifierDataType} from "../client/types.js";

// Base types that never change - hardcoded for performance
const BASE_TYPES: SimplifierDataType[] = [
  {
    id: "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
    name: "String",
    category: "base",
    description: "BaseType for strings",
    baseType: "String",
    isStruct: false,
    fields: [],
    properties: [{ name: "Operators", value: "==, !=" }],
    editable: true,
    tags: [],
    assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
  },
  {
    id: "B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D",
    name: "Integer",
    category: "base",
    description: "BaseType for integer",
    baseType: "Integer",
    isStruct: false,
    fields: [],
    properties: [{ name: "Operators", value: "==, !=, <, >, <=, >=" }],
    editable: true,
    tags: [],
    assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
  },
  {
    id: "2788FB5AA776C62635F156C820190D0FD3D558765201881A77382093F7248B39",
    name: "Boolean",
    category: "base",
    description: "BaseType for boolean",
    baseType: "Boolean",
    isStruct: false,
    fields: [],
    properties: [{ name: "Operators", value: "==, !=" }],
    editable: true,
    tags: [],
    assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
  },
  {
    id: "06A9841478D7BE17C423F11C38CD6829E372093DBEC144F2A85FC7165BE8CD80",
    name: "Date",
    category: "base",
    description: "BaseType for dates",
    baseType: "Date",
    isStruct: false,
    fields: [],
    properties: [{ name: "Operators", value: "==, !=" }],
    editable: true,
    tags: [],
    assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
  },
  {
    id: "C09139C72F5A8A7E0036BA66CE301748BD617F463683EE03F92EDAAAA4AF8BC7",
    name: "Float",
    category: "base",
    description: "BaseType for floats",
    baseType: "Float",
    isStruct: false,
    fields: [],
    properties: [{ name: "Operators", value: "==, !=, <, >, <=, >=" }],
    editable: true,
    tags: [],
    assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
  },
  {
    id: "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB",
    name: "Any",
    category: "base",
    description: "BaseType for Any",
    baseType: "Any",
    isStruct: false,
    fields: [],
    properties: [{ name: "Operators", value: "" }],
    editable: true,
    tags: [],
    assignedProjects: { projectsBefore: [], projectsAfterChange: [] }
  }
];

export function registerDataTypesResources(server: McpServer, simplifier: SimplifierClient): void {

  // Resource for listing all available namespaces
  const namespacesResourceTemplate = new ResourceTemplate("simplifier://datatypes/namespaces", {
    list: async () => {
      try {
        const dataTypes = await simplifier.getDataTypes();
        const resources = [];

        // Add root namespace (empty namespace)
        resources.push({
          uri: `simplifier://datatypes/namespace/`,
          name: "root",
          title: `Root Namespace (no namespace)`,
          description: "All datatypes without a specific namespace, including base types",
          mimeType: "application/json"
        });

        // Add all other namespaces
        for (const namespace of dataTypes.nameSpaces) {
          resources.push({
            uri: `simplifier://datatypes/namespace/${namespace}`,
            name: namespace,
            title: `Namespace: ${namespace}`,
            description: `All datatypes in namespace ${namespace}`,
            mimeType: "application/json"
          });
        }

        return { resources };
      } catch (error) {
        return { resources: [] };
      }
    }
  });

  server.resource("datatypes-namespaces", namespacesResourceTemplate, {
      title: "Simplifier DataType Namespaces",
      mimeType: "application/json",
      description: `# Get all available DataType namespaces

Lists all namespaces containing datatypes in Simplifier. Each namespace groups related datatypes together.
Base types are available in the root namespace (empty namespace).`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();
        return {
          rootNamespace: "(empty namespace - includes base types)",
          namespaces: dataTypes.nameSpaces
        };
      });
    }
  );

  // Resource for getting datatypes by namespace
  const namespaceResourceTemplate = new ResourceTemplate("simplifier://datatypes/namespace/{namespace?}", {
    list: async () => {
      try {
        const dataTypes = await simplifier.getDataTypes();
        const resources = [];

        // Add root namespace entry
        resources.push({
          uri: `simplifier://datatypes/namespace/`,
          name: "root",
          title: `Root Namespace`,
          description: "All datatypes without namespace + base types",
          mimeType: "application/json"
        });

        // Add all namespaces
        for (const namespace of dataTypes.nameSpaces) {
          resources.push({
            uri: `simplifier://datatypes/namespace/${namespace}`,
            name: namespace,
            title: `Namespace: ${namespace}`,
            description: `Datatypes in ${namespace}`,
            mimeType: "application/json"
          });
        }

        return { resources };
      } catch (error) {
        return { resources: [] };
      }
    }
  });

  server.resource("datatypes-by-namespace", namespaceResourceTemplate, {
      title: "DataTypes by Namespace",
      mimeType: "application/json",
      description: `# Get DataTypes filtered by namespace

Returns all datatypes for a specific namespace:
- **Empty namespace** (root): Returns all datatypes without namespace + base types
- **Specific namespace**: Returns datatypes belonging to that namespace only

Base types are always included when requesting the root namespace.`
    },
    async (uri: URL, {namespace}) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();
        const requestedNamespace = namespace as string || "";

        if (requestedNamespace === "") {
          // Root namespace: return types without namespace + base types
          const rootTypes = [
            ...BASE_TYPES,
            ...dataTypes.domainTypes.filter(dt => !dt.nameSpace),
            ...dataTypes.structTypes.filter(st => !st.nameSpace),
            ...dataTypes.collectionTypes.filter(ct => !ct.nameSpace)
          ];

          return {
            namespace: "(root - no namespace)",
            baseTypes: BASE_TYPES,
            domainTypes: dataTypes.domainTypes.filter(dt => !dt.nameSpace),
            structTypes: dataTypes.structTypes.filter(st => !st.nameSpace),
            collectionTypes: dataTypes.collectionTypes.filter(ct => !ct.nameSpace),
            totalTypes: rootTypes.length
          };
        } else {
          // Specific namespace: return only types in that namespace
          const namespaceDomain = dataTypes.domainTypes.filter(dt => dt.nameSpace === requestedNamespace);
          const namespaceStruct = dataTypes.structTypes.filter(st => st.nameSpace === requestedNamespace);
          const namespaceCollection = dataTypes.collectionTypes.filter(ct => ct.nameSpace === requestedNamespace);

          return {
            namespace: requestedNamespace,
            domainTypes: namespaceDomain,
            structTypes: namespaceStruct,
            collectionTypes: namespaceCollection,
            totalTypes: namespaceDomain.length + namespaceStruct.length + namespaceCollection.length
          };
        }
      });
    }
  );

}