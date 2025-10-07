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

  const noListCallback = { list: undefined }

  // Main discoverable datatypes resource - shows up in resources/list
  server.resource("datatypes-namespaces-list", "simplifier://datatypes/namespaces", {
      title: "List NameSpaces of DataTypes",
      mimeType: "application/json",
      description: `# Get the list of all DataType namespaces and access patterns

This resource provides the entry point for discovering all available datatypes organized by namespaces.
HINT: consider not using this resource, due to performance considerations - if you already have a datatype namespace then call directly the corresponding simplifier://datatypes/namespace/{namespace}`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();
        const allNamespaceResources = [
          {
            uri: "simplifier://datatypes/namespace/",
            name: "root",
            description: "Root namespace - contains base types and datatypes without namespace"
          },
          ...dataTypes.nameSpaces.map(ns => ({
            uri: `simplifier://datatypes/namespace/${ns}`,
            name: ns
          }))
        ];

        return {
          availableResources: allNamespaceResources,
          resourcePatterns: [
            "simplifier://datatypes/namespace/ - Root namespace datatypes",
            "simplifier://datatypes/namespace/{namespace} - Datatypes by specific namespace",
            "simplifier://datatype/{dataTypeName} - Single datatype in root namespace",
            "simplifier://datatype/{namespace}/{dataTypeName} - Single datatype in specific namespace"
          ],
          recommendation: "For best performance and to avoid consuming too much context, prefer using the single datatype patterns (simplifier://datatype/...) over namespace patterns when you know the specific datatype name."
        };
      });
    }
  );

  // Resource for root namespace (empty namespace)
  const rootNamespaceResourceTemplate = new ResourceTemplate("simplifier://datatypes/namespace/", noListCallback);

  server.resource("datatypes-root-namespace", rootNamespaceResourceTemplate, {
      title: "Root Namespace DataTypes",
      mimeType: "application/json",
      description: `# Get DataTypes in Root Namespace (no namespace)

Returns all datatypes that don't belong to any specific namespace, plus all base types:
- **Base Types**: String, Integer, Boolean, Date, Float, Any (hardcoded)
- **Domain Types**: Custom types without namespace
- **Struct Types**: Structured types without namespace
- **Collection Types**: Collection types without namespace

**IMPORTANT**: This resource may return large responses. If you know the specific datatype name, use \`simplifier://datatype/{dataTypeName}\` instead to get only that datatype and save context.`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();

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
      });
    }
  );

  // Resource for getting datatypes by specific namespace
  const namespaceResourceTemplate = new ResourceTemplate("simplifier://datatypes/namespace/{+namespace}", noListCallback);

  server.resource("datatypes-by-namespace", namespaceResourceTemplate, {
      title: "DataTypes by Specific Namespace",
      mimeType: "application/json",
      description: `# Get DataTypes filtered by specific namespace

Returns datatypes belonging to a specific namespace:
- **Domain Types**: Custom types in this namespace
- **Struct Types**: Structured types in this namespace
- **Collection Types**: Collection types in this namespace

**IMPORTANT**: This resource may return large responses with many datatypes. If you know the specific datatype name, use \`simplifier://datatype/{namespace}/{dataTypeName}\` instead to get only that datatype and save context.
`
    },
    async (uri: URL, _variables) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();
        // Extract namespace from URI path, handling forward slashes
        const pathParts = uri.pathname.split('/');
        const namespaceIndex = pathParts.findIndex(part => part === 'namespace');
        const requestedNamespace = pathParts.slice(namespaceIndex + 1).join('/');

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
      });
    }
  );

  // Resource for getting a single datatype with namespace
  const singleDatatypeWithNamespaceTemplate = new ResourceTemplate("simplifier://datatype/{+namespace}/{dataTypeName}", noListCallback);

  server.resource("datatype-with-namespace", singleDatatypeWithNamespaceTemplate, {
      title: "Single DataType Details (with namespace)",
      mimeType: "application/json",
      description: `# Get detailed information about a specific datatype in a namespace

Returns complete datatype information including:
- **Fields**: Field definitions with types and descriptions (for struct types)
- **Category**: Type category (base, domain, collection, struct, any)
  - **base**: Base types (scalar) - String, Integer, Boolean, Date, Float, Any
  - **domain**: Extended types (scalar) - Custom scalar types
  - **collection**: Collection types (non-scalar) - Lists and arrays
  - **struct**: Struct types (non-scalar) - Complex structured types
  - **any**: Any types (non-scalar) - Generic any type
- **Metadata**: Description, editability, tags, and project assignments

**URI Format**: \`simplifier://datatype/{namespace}/{dataTypeName}\`

**Examples**:
- \`simplifier://datatype/bo/SF_User/getUser_groups_Struct\` - Business object struct type
- \`simplifier://datatype/con/TestConnector/EmailAddress_Struct\` - Connector struct type
`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        // Extract namespace and datatype name from URI path
        const pathParts = uri.pathname.split('/').filter(p => p);
        // Find 'datatype' in path and take everything after it
        const datatypeIndex = pathParts.findIndex(part => part === 'datatype');
        const fullyQualifiedDatatype = pathParts.slice(datatypeIndex + 1).join('/');

        const datatype = await simplifier.getDataTypeById(fullyQualifiedDatatype);
        return datatype;
      });
    }
  );

  // Resource for getting a single datatype from root namespace
  const singleDatatypeRootTemplate = new ResourceTemplate("simplifier://datatype/{dataTypeName}", noListCallback);

  server.resource("datatype-root", singleDatatypeRootTemplate, {
      title: "Single DataType Details (root namespace)",
      mimeType: "application/json",
      description: `# Get detailed information about a specific datatype in root namespace

Returns complete datatype information for datatypes without a namespace, including base types and custom root-level types.

**URI Format**: \`simplifier://datatype/{dataTypeName}\`

**Examples**:
- \`simplifier://datatype/Email\` - Domain type String
- \`simplifier://datatype/_ITIZ_B_BUS2038_DATA\` - Custom root namespace type
`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        // Extract datatype name from URI path (everything after 'datatype/')
        const pathParts = uri.pathname.split('/').filter(p => p);
        const datatypeIndex = pathParts.findIndex(part => part === 'datatype');
        const datatypeName = pathParts.slice(datatypeIndex + 1).join('/');

        const datatype = await simplifier.getDataTypeById(datatypeName);
        return datatype;
      });
    }
  );

}