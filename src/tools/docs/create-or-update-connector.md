# Create or update a Connector

This tool allows to 
* create new connectors
* modify existing connectors

**Attention:** When updating a Connector, allways fetch the existing resource first to ensure operating on the latest version.
Existing tags and endpoints have to be resent when doing an update - otherwise they would be cleared.


## Connector Types

### Connector type 'REST'

The object under **endpointConfiguration / configuration** defines properties, specific to REST Connector:  
* **endpointURL** - the actual address of the remote REST endpoint
* **sslSettings** - SSL related options. 

When no SSL is required, or no specific settings apply, use the following sslSettings:
```json
{
"trustType": 2,
"ignoreSSLCertificates": false
}
```

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

