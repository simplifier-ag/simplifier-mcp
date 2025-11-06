# Create or update a Connector

This tool allows to
* create new connectors
* modify existing connectors

**Attention:** When updating a Connector, allways fetch the existing resource first to ensure operating on the latest version.
Existing tags and endpoints have to be resent when doing an update - otherwise they would be cleared.


## Connector Types

### Common settings

For all connectors using SSL / TLS, the `sslSettings` option has two fields:
* **trustType**: An integer, with the following meaning:
  * `0`: Always trust any certificate, regardless of CA signing
  * `1`: Only trust the certificate specified explicitly
  * `2`: Use system certificates for trust
  * `3`: Combination of 1+2, trust explicitly specified certificate and any
         system trusted certificate.
* **ignoreSSLCertificates**: boolean, if set to true, any TLS validation will be
  skipped and the target will always be trusted, even when the certificate does
  not match the hostname.

When no SSL is required, or no specific settings apply, use the following sslSettings:
```json
{
"trustType": 2,
"ignoreSSLCertificates": false
}
```

### Connector type 'REST'

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

### Connector type 'SOAP'

The object under **endpointConfiguration / configuration** defines properties, specific to SOAP Connector:
* **wsdlUrl** - the address of a WSDL specification, which is used for the connector
* **sslSettings** - SSL related options.

**Complete Example:**
```json
{
  "name": "TestCreate",
  "description": "",
  "connectorType": "SOAP",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "certificates": [],
    "configuration": {
      "wsdlUrl": "http://example-soap.com/myService?wsdl",
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

