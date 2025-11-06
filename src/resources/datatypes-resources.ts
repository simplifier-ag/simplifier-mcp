import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {SimplifierDataType, SimplifierDataTypesResponse} from "../client/types.js";

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

/**
 * Calculate datatype count for a namespace
 * @param namespace - namespace string (empty string for root)
 * @param dataTypes - all datatypes response
 * @returns count of all datatypes in namespace
 */
export function calculateDatatypeCount(
  namespace: string,
  dataTypes: SimplifierDataTypesResponse
): number {
  if (namespace === '') {
    // Root namespace: base types + types without namespace
    return BASE_TYPES.length +
           dataTypes.domainTypes.filter(dt => !dt.nameSpace).length +
           dataTypes.structTypes.filter(st => !st.nameSpace).length +
           dataTypes.collectionTypes.filter(ct => !ct.nameSpace).length;
  } else {
    // Specific namespace: types matching namespace
    return dataTypes.domainTypes.filter(dt => dt.nameSpace === namespace).length +
           dataTypes.structTypes.filter(st => st.nameSpace === namespace).length +
           dataTypes.collectionTypes.filter(ct => ct.nameSpace === namespace).length;
  }
}

/**
 * Calculate weight for a namespace
 * Weight = (10 × datatypeCount) + (2 × total_struct_fields)
 * @param namespace - namespace string (empty string for root)
 * @param dataTypes - all datatypes response
 * @returns calculated weight
 */
export function calculateWeight(
  namespace: string,
  dataTypes: SimplifierDataTypesResponse
): number {
  const datatypeCount = calculateDatatypeCount(namespace, dataTypes);

  // Get struct types for this namespace
  const structTypes = namespace === ''
    ? dataTypes.structTypes.filter(st => !st.nameSpace)
    : dataTypes.structTypes.filter(st => st.nameSpace === namespace);

  // Sum all fields from struct types
  const totalFields = structTypes.reduce((sum, st) => sum + st.fields.length, 0);

  return (10 * datatypeCount) + (2 * totalFields);
}

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
        const MAX_WEIGHT_WITH_DETAILS_SUGGESTED = 2000;  // soft limit

        // Helper function to build URI based on weight
        const getNamespaceUri = (namespace: string, weight: number): string => {
          const variant = weight > MAX_WEIGHT_WITH_DETAILS_SUGGESTED ? 'noDetails' : 'withDetails';

          if (namespace === '') {
            // Root namespace
            return `simplifier://datatypes/namespace/${variant}`;
          } else {
            // Specific namespace
            return `simplifier://datatypes/namespace/${variant}/${namespace}`;
          }
        };

        const dataTypes = await simplifier.getDataTypes();
        const rootWeight = calculateWeight('', dataTypes);

        const allNamespaceResources = [
          {
            uri: getNamespaceUri('', rootWeight),
            name: "root",
            description: "Root namespace - contains base types and datatypes without namespace",
            weight: rootWeight
          },
          ...dataTypes.nameSpaces.map(ns => {
            const weight = calculateWeight(ns, dataTypes);
            return {
              uri: getNamespaceUri(ns, weight),
              name: ns,
              weight: weight
            };
          })
        ];

        return {
          availableResources: allNamespaceResources,
          resourcePatterns: [
            "simplifier://datatypes/namespace/noDetails - Root namespace datatypes (minimal: name, id, category, detailUri only)",
            "simplifier://datatypes/namespace/withDetails - Root namespace datatypes (with all fields + detailUri) **Important:** cannot be used with large results",
            "simplifier://datatypes/namespace/noDetails/{namespace} - Namespace datatypes (minimal: name, id, category, detailUri only)",
            "simplifier://datatypes/namespace/withDetails/{namespace} - Namespace datatypes (with all fields + detailUri) **Important:** cannot be used with large results",
            "simplifier://datatype/{dataTypeName} - Single datatype in root namespace",
            "simplifier://datatype/{namespace}/{dataTypeName} - Single datatype in specific namespace"
          ],
          recommendation: "For best performance and to avoid consuming too much context, prefer using the single datatype patterns (simplifier://datatype/...) when you know the specific datatype name, or use noDetails variants for lightweight responses."
        };
      });
    }
  );

  const MAX_WEIGHT_WITH_DETAILS = 3000;  // hard limit
  // IMPORTANT: Register specific paths BEFORE wildcard patterns to ensure correct routing

  // Resource for root namespace with minimal details (only name, id, category, detailUri)
  const rootNamespaceNoDetailsTemplate = new ResourceTemplate("simplifier://datatypes/namespace/noDetails", noListCallback);

  server.resource("datatypes-root-namespace-nodetails", rootNamespaceNoDetailsTemplate, {
      title: "Root Namespace DataTypes (Minimal Details)",
      mimeType: "application/json",
      description: `# Get DataTypes in Root Namespace with minimal fields

Returns all datatypes that don't belong to any specific namespace, plus all base types.
Each datatype includes only: **name**, **id**, **category**, and **detailUri**.

- **Base Types**: String, Integer, Boolean, Date, Float, Any (hardcoded)
- **Domain Types**: Custom types without namespace
- **Struct Types**: Structured types without namespace
- **Collection Types**: Collection types without namespace

**Use this variant for lightweight responses when you only need basic identification fields.**`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();

        // Function to extract minimal fields and add detailUri
        const toMinimal = <T extends { name: string; id: string; category: string }>(dt: T) => ({
          name: dt.name,
          id: dt.id,
          category: dt.category,
          detailUri: `simplifier://datatype/${dt.name}`
        });

        return {
          namespace: "(root - no namespace)",
          baseTypes: BASE_TYPES.map(toMinimal),
          domainTypes: dataTypes.domainTypes.filter(dt => !dt.nameSpace).map(toMinimal),
          structTypes: dataTypes.structTypes.filter(st => !st.nameSpace).map(toMinimal),
          collectionTypes: dataTypes.collectionTypes.filter(ct => !ct.nameSpace).map(toMinimal)
        };
      });
    }
  );

  // Resource for root namespace WITH details (includes detailUri field)
  const rootNamespaceWithDetailsTemplate = new ResourceTemplate("simplifier://datatypes/namespace/withDetails", noListCallback);

  server.resource("datatypes-root-namespace-withdetails", rootNamespaceWithDetailsTemplate, {
      title: "Root Namespace DataTypes (With Details)",
      mimeType: "application/json",
      description: `# Get DataTypes in Root Namespace with detailUri field

Returns all datatypes that don't belong to any specific namespace, plus all base types.

- **Base Types**: String, Integer, Boolean, Date, Float, Any (hardcoded)
- **Domain Types**: Custom types without namespace
- **Struct Types**: Structured types without namespace
- **Collection Types**: Collection types without namespace

Each datatype includes a detailUri field: \`simplifier://datatype/{dataTypeName}\``
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();

        // Check weight limit for withDetails variant
        const weight = calculateWeight('', dataTypes);
        if (weight > MAX_WEIGHT_WITH_DETAILS) {
          throw new Error('The result is expected to be too big. Please use: simplifier://datatypes/namespace/noDetails');
        }

        // Add detailUri to each datatype
        const addDetailUri = <T extends { name: string }>(dt: T) => ({
          ...dt,
          detailUri: `simplifier://datatype/${dt.name}`
        });

        return {
          namespace: "(root - no namespace)",
          baseTypes: BASE_TYPES.map(addDetailUri),
          domainTypes: dataTypes.domainTypes.filter(dt => !dt.nameSpace).map(addDetailUri),
          structTypes: dataTypes.structTypes.filter(st => !st.nameSpace).map(addDetailUri),
          collectionTypes: dataTypes.collectionTypes.filter(ct => !ct.nameSpace).map(addDetailUri)
        };
      });
    }
  );

  // Resource for specific namespace with minimal details (only name, id, category, detailUri)
  const namespaceNoDetailsTemplate = new ResourceTemplate("simplifier://datatypes/namespace/noDetails/{+namespace}", noListCallback);

  server.resource("datatypes-by-namespace-nodetails", namespaceNoDetailsTemplate, {
      title: "DataTypes by Specific Namespace (Minimal Details)",
      mimeType: "application/json",
      description: `# Get DataTypes filtered by specific namespace with minimal fields

Returns datatypes belonging to a specific namespace.
Each datatype includes only: **name**, **id**, **category**, and **detailUri**.

- **Domain Types**: Custom types in this namespace
- **Struct Types**: Structured types in this namespace
- **Collection Types**: Collection types in this namespace

**Use this variant for lightweight responses when you only need basic identification fields or when the complete result would be too big.**`
    },
    async (uri: URL, _variables) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();
        // Extract namespace from URI path, handling forward slashes
        const pathParts = uri.pathname.split('/');
        const namespaceIndex = pathParts.findIndex(part => part === 'namespace');
        // Skip 'noDetails' part to get actual namespace
        const namespaceParts = pathParts.slice(namespaceIndex + 1);
        const requestedNamespace = namespaceParts.slice(1).join('/'); // Skip 'noDetails'

        // Specific namespace: return only types in that namespace
        const namespaceDomain = dataTypes.domainTypes.filter(dt => dt.nameSpace === requestedNamespace);
        const namespaceStruct = dataTypes.structTypes.filter(st => st.nameSpace === requestedNamespace);
        const namespaceCollection = dataTypes.collectionTypes.filter(ct => ct.nameSpace === requestedNamespace);

        // Function to extract minimal fields and add detailUri with namespace
        const toMinimal = <T extends { name: string; id: string; category: string }>(dt: T) => ({
          name: dt.name,
          id: dt.id,
          category: dt.category,
          detailUri: `simplifier://datatype/${requestedNamespace}/${dt.name}`
        });

        return {
          namespace: requestedNamespace,
          domainTypes: namespaceDomain.map(toMinimal),
          structTypes: namespaceStruct.map(toMinimal),
          collectionTypes: namespaceCollection.map(toMinimal),
        };
      });
    }
  );

  // Resource for specific namespace WITH details (includes detailUri field)
  const namespaceWithDetailsTemplate = new ResourceTemplate("simplifier://datatypes/namespace/withDetails/{+namespace}", noListCallback);

  server.resource("datatypes-by-namespace-withdetails", namespaceWithDetailsTemplate, {
      title: "DataTypes by Specific Namespace (With Details)",
      mimeType: "application/json",
      description: `# Get DataTypes filtered by specific namespace with detailUri field

Returns datatypes belonging to a specific namespace.
This variant includes the detailUri field for each datatype.

- **Domain Types**: Custom types in this namespace
- **Struct Types**: Structured types in this namespace
- **Collection Types**: Collection types in this namespace

Each datatype includes a detailUri field: \`simplifier://datatype/{namespace}/{dataTypeName}\``
    },
    async (uri: URL, _variables) => {
      return wrapResourceResult(uri, async () => {
        const dataTypes = await simplifier.getDataTypes();
        // Extract namespace from URI path, handling forward slashes
        const pathParts = uri.pathname.split('/');
        const namespaceIndex = pathParts.findIndex(part => part === 'namespace');
        // Skip 'withDetails' part to get actual namespace
        const namespaceParts = pathParts.slice(namespaceIndex + 1);
        const requestedNamespace = namespaceParts.slice(1).join('/'); // Skip 'withDetails'

        // Check weight limit for withDetails variant
        const weight = calculateWeight(requestedNamespace, dataTypes);
        if (weight > MAX_WEIGHT_WITH_DETAILS) {
          throw new Error(`The result is expected to be too big. Please use: simplifier://datatypes/namespace/noDetails/${requestedNamespace}`);
        }

        // Specific namespace: return only types in that namespace
        const namespaceDomain = dataTypes.domainTypes.filter(dt => dt.nameSpace === requestedNamespace);
        const namespaceStruct = dataTypes.structTypes.filter(st => st.nameSpace === requestedNamespace);
        const namespaceCollection = dataTypes.collectionTypes.filter(ct => ct.nameSpace === requestedNamespace);

        // Add detailUri to each datatype with namespace
        const addDetailUri = <T extends { name: string }>(dt: T) => ({
          ...dt,
          detailUri: `simplifier://datatype/${requestedNamespace}/${dt.name}`
        });

        return {
          namespace: requestedNamespace,
          domainTypes: namespaceDomain.map(addDetailUri),
          structTypes: namespaceStruct.map(addDetailUri),
          collectionTypes: namespaceCollection.map(addDetailUri)
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

        const datatype = await simplifier.getDataTypeByName(fullyQualifiedDatatype);
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

        const datatype = await simplifier.getDataTypeByName(datatypeName);
        return datatype;
      });
    }
  );

}