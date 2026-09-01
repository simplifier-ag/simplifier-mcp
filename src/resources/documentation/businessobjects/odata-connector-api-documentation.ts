import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export const ODATA_CONNECTOR_API_DOCUMENTATION_MARKDOWN = `# Simplifier OData Connector API Reference

OData connectors (connectorType \`oDataProxy\`, see simplifier://documentation/connector-type/odata) do not define
Connector Calls. They are accessed from server-side Business Objects through a dedicated **fluent query API** instead
of \`Simplifier.Connector.<connector-name>.<call-name>(payload)\`.

## Querying entities

### Basic syntax

\`\`\`javascript
Simplifier.Connector.<ConnectorName>.<EntitySetName>.query().execute()
\`\`\`

\`<EntitySetName>\` is the name of an entity set exposed by the remote OData service (e.g. \`Authors\`).
\`.query()\` starts a query and is **required** before chaining any of the fluent query methods below.
\`.execute()\` sends the request and returns the result; it is the only method that actually triggers the call.

### Fluent query methods

\`.filterBy()\`, \`.top()\` and \`.skip()\` are all optional, can be used independently of each other, and may be
entirely omitted - \`Simplifier.Connector.<ConnectorName>.<EntitySetName>.query().execute()\` alone is a valid call
that returns all entities.

#### \`.filterBy(filterExpression)\`
Restricts the returned entities.
- **Input**: filterExpression - an \`ODataCondition\`, built by calling a comparison operator on the entity set's
  typed \`props\`: \`entity.props.<PropertyName>.<operator>(<value>)\`.

**Available operators:**

| Method | OData operator | Meaning |
|---|---|---|
| \`equals(value)\` | \`eq\` | Property = value |
| \`notEquals(value)\` | \`ne\` | Property ≠ value |
| \`startsWith(value)\` | \`startswith\` | Property starts with value |
| \`contains(value)\` | \`contains\` (v4) / \`substringof\` (v2) | Property contains value |
| \`greaterThan(value)\` | \`gt\` | Property > value |
| \`greaterEquals(value)\` | \`ge\` | Property ≥ value |
| \`lessThan(value)\` | \`lt\` | Property < value |
| \`lessEquals(value)\` | \`le\` | Property ≤ value |

**Special cases:**
- **Comparing against \`null\`**: only allowed with \`equals\`/\`notEquals\`, e.g. \`entity.props.deletedAt.equals(null)\`.
  Every other operator throws when given \`null\`.
- **Property-to-property comparison**: instead of a literal, the right-hand side can be another property of the
  same entity, e.g. \`entity.props.startDate.lessThan(entity.props.endDate)\`.
- **Allowed value types**: the right-hand side must be a \`string\`, a \`number\`, a \`boolean\`, or another property
  (as above) - any other type throws.

**No AND/OR support**: \`.filterBy()\` takes exactly one condition, and can only be called **once per query**.
Chaining or combining multiple conditions (e.g. \`name eq 'abc' and amount gt 100\`) is not currently possible.

**Examples:**
\`\`\`javascript
var entity = Simplifier.Connector.myConnector.MyEntity;

entity.query().filterBy(entity.props.name.equals('abc')).execute();
entity.query().filterBy(entity.props.status.notEquals('inactive')).execute();
entity.query().filterBy(entity.props.name.startsWith('Sim')).execute();
entity.query().filterBy(entity.props.description.contains('urgent')).execute();
entity.query().filterBy(entity.props.amount.greaterThan(100)).execute();
entity.query().filterBy(entity.props.amount.greaterEquals(100)).execute();
entity.query().filterBy(entity.props.amount.lessThan(50)).execute();
entity.query().filterBy(entity.props.amount.lessEquals(50)).execute();
entity.query().filterBy(entity.props.deletedAt.equals(null)).execute();
entity.query().filterBy(entity.props.startDate.lessThan(entity.props.endDate)).execute();
\`\`\`

#### \`.top(count)\`
Limits the number of returned entities.
- **Input**: count (number)

#### \`.skip(count)\`
Skips the given number of entities, for use in paging together with \`.top(count)\`.
- **Input**: count (number)

#### \`.execute()\`
Terminal call. Sends the request to the remote OData service and returns the result synchronously.

### Query result shape

\`\`\`json
{
  "count": 6,
  "records": [
    { "...": "..." },
    { "...": "..." }
  ],
  "response": {
    "statusCode": 200
  }
}
\`\`\`

- **count**: total number of entities matching the query, independent of \`.top()\`/\`.skip()\` paging.
- **records**: array of returned entity objects for the current page (i.e. after \`.top()\`/\`.skip()\` have been applied).
- **response.statusCode**: HTTP status code returned by the remote OData service.

### Query error handling

If the call fails (e.g. the remote service is unreachable or returns an HTTP error), an exception is thrown.
The error message includes the entity set name, the connector name and the underlying failure:

\`\`\`json
{
  "message": "Unexpected Runtime exception: Error: OData BO query for entity 'Authors' on connector 'Cap_OData_V4' failed: Exception when sending request: GET http://localhost:4004/odata/v4/admin/Authors?$skip=0&$top=2&$count=true:\\nConnection to endpoint failed:\\nClosedChannelException",
  "success": false
}
\`\`\`

### Query example

\`\`\`javascript
var entity = Simplifier.Connector.Cap_OData_V4.Authors;

var result = entity.query()
  .filterBy(entity.props.name.equals('Emily Brontë'))
  .top(2)
  .skip(0)
  .execute();

var authors = result.records;
var totalCount = result.count;
\`\`\`

## Creating entities

### \`.create(entity)\`

\`\`\`javascript
Simplifier.Connector.<ConnectorName>.<EntitySetName>.create(<entity>)
\`\`\`

Creates a new record in the given entity set. Unlike the query methods above, \`.create()\` is itself a terminal
call - it sends the request immediately and does not need \`.execute()\` afterwards.

- **Input**: entity - an object with the properties of the new record. Every property is optional; the remote
  OData service is authoritative about which fields are actually required and which keys are server-assigned.
- **Result**: see "Create result shape" below.
- **Errors**: throws a \`SimplifierApiError\` on failure.

#### Related entities (deep-insert / binding)

Related entities can be created or linked to in the same \`.create()\` call:

- **Deep-insert**: supply a nested object under a navigation property to create a related entity in the same
  transaction. For a collection-cardinality navigation, supply an array of such objects instead of a single object.
- **Binding (OData v4)**: instead of nesting an object, link to an existing entity via a synthetic
  \`"<NavProp>@odata.bind"\` key holding a URI string, e.g.:
  \`\`\`json
  { "Customer@odata.bind": "/Customers('1')" }
  \`\`\`
- **Binding (OData v2)**: link to an existing entity via:
  \`\`\`json
  { "<NavProp>": { "__metadata": { "uri": "<EntitySet>(<key>)" } } }
  \`\`\`

#### Create result shape

\`\`\`json
{
  "response": {
    "body": {
      "ID": 101,
      "name": "Emily Brontë",
      "...": "further entity fields, as returned by the remote OData service"
    },
    "statusCode": 201
  }
}
\`\`\`

- **response.body**: the created entity, exactly as returned by the remote OData service. This may include
  service-generated fields (e.g. timestamps, audit fields such as \`createdAt\`/\`createdBy\`) or OData metadata
  such as \`@odata.context\` - the exact fields depend on the entity type and the remote service.
- **response.statusCode**: HTTP status code returned by the remote OData service (typically 201 on success).

Note this differs from the \`count\`/\`records\`/\`response.statusCode\` shape returned by \`.execute()\` for queries.

#### Create example

\`\`\`javascript
var result = Simplifier.Connector.Cap_OData_V4.Authors.create({
  name: "Emily Brontë",
  dateOfBirth: "1818-07-30",
  dateOfDeath: "1848-12-19",
  placeOfBirth: "Thornton, Yorkshire",
  placeOfDeath: "Haworth, Yorkshire"
});

var createdAuthor = result.response.body;
\`\`\`

## Updating entities

### \`.update(record)\` / \`.update(record, patch)\`

\`\`\`javascript
Simplifier.Connector.<ConnectorName>.<EntitySetName>.update(<record>)
Simplifier.Connector.<ConnectorName>.<EntitySetName>.update(<record>, <patch>)
\`\`\`

Updates an existing record via the OData service (sent as a PATCH request). Like \`.create()\`, \`.update()\` is
itself a terminal call - it sends the request immediately.

- **First parameter (\`record\`)**: an entity object previously obtained from this connector - either a record
  from a query's \`result.records\` array, or the entity returned by \`.create()\`. Such records carry an ETag
  (if the remote service provides one), which is automatically sent with the update for optimistic concurrency.
- **Change tracking**: properties can be changed directly on the loaded \`record\` object (e.g. \`record.name = 'new-name'\`);
  this is tracked automatically. Calling \`.update(record)\` without a second argument sends only the changed
  fields as the PATCH body.
- **Second parameter (\`patch\`, optional)**: instead of relying on change tracking, an explicit object with the
  fields to change can be passed as a second argument, e.g. \`.update(record, { name: 'new-name' })\`.
- **Result**: same shape as \`.create()\` - \`{ response: { body, statusCode } }\`.
- **Errors**: throws a \`SimplifierApiError\` on failure, as with \`.create()\`.

### Update examples

Change tracking on the loaded record:
\`\`\`javascript
var entity = Simplifier.Connector.Cap_OData_V4.Authors;

// Record holen (z.B. via query + filterBy)
var result = entity.query()
  .filterBy(entity.props.name.equals('abc'))
  .execute();

var record = result.records[0];

// Feld(er) ändern - wird automatisch getrackt
record.name = 'new-name';

// update(record) sendet nur die geänderten Felder ("name") per PATCH
var updateResult = entity.update(record);
\`\`\`

Explicit patch object instead of change tracking:
\`\`\`javascript
var entity = Simplifier.Connector.Cap_OData_V4.Authors;

var result = entity.query()
  .filterBy(entity.props.name.equals('abc'))
  .execute();

var record = result.records[0];

var updateResult = entity.update(record, { name: 'new-name' });
\`\`\`

## Deleting entities

### \`.delete(record)\`

\`\`\`javascript
Simplifier.Connector.<ConnectorName>.<EntitySetName>.delete(<record>)
\`\`\`

Deletes an existing record via the OData service. Unlike \`.update()\`, \`.delete()\` takes only **one** argument
(no separate "changes" argument) and sends the request immediately.

- **Input**: record - only the key property/properties (and optionally the ETag) are used; any other fields on
  the object are ignored. Unlike \`.update()\`, this does **not** need to be the tracked record object returned
  by \`.query()\`/\`.create()\` - any plain object containing the key fields is sufficient, e.g. a hand-built
  object for a known key without a prior query.
- **ETag**: if present on the given object (\`@odata.etag\` for OData v4, \`__metadata.etag\` for OData v2), it is
  automatically sent as an \`If-Match\` header.
- **Result**: same shape as \`.create()\`/\`.update()\` - \`{ response: { body, statusCode } }\`.
- **Errors**: throws a \`SimplifierApiError\` on failure - including \`missing key value(s): ...\` if a required
  key property is missing from the given object.

### Delete examples

Deleting a record obtained from a query:
\`\`\`javascript
var entity = Simplifier.Connector.Cap_OData_V4.Authors;

// Record holen (z.B. via query + filterBy)
var result = entity.query()
  .filterBy(entity.props.name.equals('abc'))
  .execute();

var record = result.records[0];

// löscht den Datensatz anhand der Key-Property/-Properties (+ ETag, falls vorhanden)
var deleteResult = entity.delete(record);

// deleteResult.response.statusCode, deleteResult.response.body
\`\`\`

Deleting by a known key, without a prior query:
\`\`\`javascript
var deleteResult = entity.delete({ id: 42 });
\`\`\`

## Current limitations

This API currently covers **reading entity sets** (filterBy/top/skip/execute), **creating records** (create,
including deep-insert and binding of related entities), **updating records** (update) and **deleting records**
(delete), as described above.

Known current limitations (not just missing documentation):
- \`.filterBy()\` accepts exactly one condition and can only be called once per query - there is currently no
  way to combine multiple conditions (AND/OR) in a single query.

It is actively being extended (e.g. single-entity access by key); such extensions are not yet documented here.
`;

export function registerODataConnectorApiDocumentation(server: McpServer): void {
  server.resource(
    "odata-connector-api-docs",
    "simplifier://documentation/server-businessobjects/api/ODataConnector",
    {
      title: "Simplifier OData Connector API Documentation",
      mimeType: "text/markdown",
      description: "Reference for the fluent query API used to access OData connectors from server-side Business Objects"
    },
    async (uri): Promise<ReadResourceResult> => {
      return {
        contents: [{
          uri: uri.href,
          text: ODATA_CONNECTOR_API_DOCUMENTATION_MARKDOWN,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}
