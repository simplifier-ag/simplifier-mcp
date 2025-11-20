# Connector type 'REST'

## Endpoint settings

The object under **endpointConfiguration / configuration** defines properties, specific to REST Connector:
* **endpointURL** - the actual address of the remote REST endpoint
* **sslSettings** - SSL related options.

**Complete Example:**
```json
{
  "name": "TestCreate",
  "description": "",
  "connectorType": "REST",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "certificates": [],
    "configuration": {
      "endpointURL": "http://example-api.com/bla",
      "sslSettings": {
        "trustType": 2,
        "ignoreSSLCertificates": false
      }
    }
  },
  "tags": [],
  "assignedProjects": {
    "projectsAfterChange": []
  }
}
```

## Call configuration

A REST Connector call defines a HTTP request to the configured endpoint address of the Connector.

Call parameters may define the following:

### HTTP Method
Parameter name: **`verb`**

Type: String

Possible Values: GET, POST, PUT, PATCH, DELETE, HEAD, OPTION

The parameter is mandatory. If not specified differently, use constValue "GET".


### Request body format
Parameter name: **`postFormat`**

Type: String

Possible Values: JSON, PLAIN, FORM, XML


### Request Body
Parameter name: **`body`**

It can have an arbitrary data type. The data is converted and *Content-Type* header is set according to the parameter **`format`**.


### Request Headers
Parameter name: **`headParams/<http-header-name>`**

Type: String

Example:
To add a header "X-TEST", define a parameter with the name "headParams/X-TEST".


### Path parameters
Parameter name: **`pathParams[<n>]`**

Type: Array[String]  - that means it must always be given with array index, i.e. pathParams[0].

To form the URL of the call with complete path, all components of the array are joined by "/" and appended to the endpoint URL or the connector.

Defining a path is optional. If omitted, just the endpoint URL is called.

Examples: (assume endpoint URL is http://test-api.com)
* If pathParams[0] is "data", the address of the call is "http://test-api.com/data".
* If pathParams[0]="data" and pathParams[1]="customer", the address of the call is "http://test-api.com/data/customer".


### URL parameters

Parameter name: **`queryParams/<query-param-name>`** (Type: String)

Example:
To set the url parameter like in "http://test-api.com?level=4", define a parameter with the name "queryParams/level" and give it a value 4.


### Output parameters

A REST Connector must have at least one output parameter

An empty parameter name, or "/" refers to the whole output object.

Use alias "data" for the whole output object.

