# Connector type 'OData Proxy'

**Important:** OData connectors (`connectorType`: `"oDataProxy"`) do **not** support Connector Calls.
Do not use `connector-call-update` for an OData connector - it will be rejected.
An OData connector acts as a proxy: it exposes the remote OData service's endpoints
through the Simplifier server, rather than defining individual calls with fixed
input/output parameters.

## Endpoint settings

The object under **endpointConfiguration / configuration** defines the following
properties specific to OData connectors:

* **endpoint** - string, base URL of the remote OData service (e.g. the service root,
  ending in a trailing slash).
* **odataVersion** - string, OData protocol version of the remote service, `"2.0"` or `"4.0"`.
* **requestHeadersFilter** - array of header names to filter from incoming requests
  before forwarding them to the remote service.
* **requestHeadersFilterType** - `"blacklist"` or `"whitelist"`, controls whether
  `requestHeadersFilter` removes or keeps only the listed request headers.
* **responseHeadersFilter** - array of header names to filter from the remote
  service's response before returning it to the caller.
* **responseHeadersFilterType** - `"blacklist"` or `"whitelist"`, analogous to
  `requestHeadersFilterType` but for response headers.
* **requestCookiesFilter** - array of cookie names to filter from incoming requests
  before forwarding them to the remote service.
* **requestCookiesFilterType** - `"blacklist"` or `"whitelist"`, analogous to
  `requestHeadersFilterType` but for request cookies.
* **enforcedHeaders** - object of header name/value pairs that are always set on
  the forwarded request, overriding any incoming value.
* **sslSettings** - see the common `sslSettings` settings described in the
  `connector-update` tool description.

Complete example:
```json
{
  "name": "Cap_OData_Copy",
  "description": "",
  "connectorType": "oDataProxy",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "loginMethodName": "Alice",
    "certificates": [],
    "configuration": {
      "endpoint": "http://example-api.com/odata/v2/admin/",
      "odataVersion": "2.0",
      "requestHeadersFilter": ["UnknownToken"],
      "requestHeadersFilterType": "blacklist",
      "responseHeadersFilter": ["ResponseFiltered"],
      "responseHeadersFilterType": "blacklist",
      "requestCookiesFilter": ["TestCookie"],
      "requestCookiesFilterType": "blacklist",
      "enforcedHeaders": {
        "exampleheader1": "examplevalue1"
      },
      "sslSettings": {
        "trustType": 2
      }
    }
  },
  "tags": [],
  "assignedProjects": {
    "projectsBefore": [],
    "projectsAfterChange": []
  }
}
```

## Usage

Unlike REST, SOAP, SAP RFC and SQL connectors, an OData connector cannot be invoked
via `Simplifier.Connector.<connector-name>.<call-name>(...)` from a Business Object
function, since it defines no connector calls. It is accessed through a dedicated
Business Object API instead - see simplifier://documentation/server-businessobjects/api/ODataConnector
for the fluent query API, and use the `businessobject-completions` MCP tool to discover the exact
entity sets and fields exposed by a given OData connector.
