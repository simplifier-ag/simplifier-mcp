# Connector type 'SAP RFC'

## Endpoint settings

The object under **endpointConfiguration / configuration** defines the following
properties specific to SAP RFC connectors, all of them are mandatory:

* **sapSystem** - ID of the target SAP system as a string.
* **parallelExecutions** - Boolean. If true, batch calls (i.e. multiple function modules are executed in one call) are executed in parallel.
* **connectionPool** - object with settings related to connection pooling:
  * **peakLimit** - number, maximum number of active connections at a time.
  * **poolCapacity** - number of pooled connections.
  * **expirationTime** - time in milliseconds for which connections are kept in the pool before being closed.
  * **expirationCheckPeriod** - time in milliseconds between checks for expired pooled connections.
  * **maxGetClientTime** - maximum time in milliseconds to wait for getting a connection (i.e. connection timeout).

Complete example:
```json
{
  "name": "MyRfc",
  "description": "",
  "connectorType": "SAPRFC",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "certificates": [],
    "configuration": {
      "sapSystem": "ID4_0_800",
      "parallelExecutions": false,
      "connectionPool": {
        "peakLimit": 0,
        "poolCapacity": 1,
        "expirationTime": 60000,
        "expirationCheckPeriod": 60000,
        "maxGetClientTime": 30000
      }
    }
  },
  "tags": [],
  "assignedProjects": {
    "projectsAfterChange": []
  }
}
```

## Call settings

An SAP RFC connector call executes a function on the SAP system defined in the
endpoint.

As RFC calls only work with existing functions in the SAP system, use the
connector wizard to create them by first searching for available calls using the
resource `simplifier://connector-wizard/{connectorName}/search/{term}/{page}`.
After selecting the appropriate calls, use the tool `connector-wizard-rfc-create`
to generate the calls.

RFC connector calls should define the following parameters with constant values:

### SOAP compatibility mode
Parameter name: **`configuration/output/soapCompatibility`**

Type: Boolean

This parameter should be set to false, unless the user specified otherwise.

### Use default values in output
Parameter name: **`configuration/output/useDefaultValues`**

Type: boolean

This parameter should be set to true, unless the user specified otherwise.


### Autocommit
Parameter name: **`configuration/autocommit`**

This parameter should be set to true, unless the user specified otherwise.


### Additional return information
Parameter name: **`configuration/operation/additionalReturnInformation`**

Type: Array of strings

Possible values: IMPORT, CHANGING, TABLE,  EXPORT, EXCEPTION

Unless specified otherwise by the user, this should be set to `["IMPORT", "EXPORT", "CHANGING", "TABLE", "EXCEPTION"]`.


### Output parameters

An RFC connector's output parameters depend on the called SAP system function.
You should usually let the wizard create them, as it has all the metadata
available.
