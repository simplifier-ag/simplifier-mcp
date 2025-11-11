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

### Connector type 'SQL'

The object under **endpointConfiguration / configuration** defines properties, specific to SQL Connector:
* **dataSource** - the database type (e.g., "oracle", "mysql", "postgresql", "mssql", "db2")
* **host** - the hostname or IP address of the database server
* **port** - the port number the database server is listening on (as string)
* **database** - the database name to connect to
* **connectionString** - the JDBC connection string (constructed from host, port, database, and specific to the database type)
* **resultType** - the format for query results, typically "resultSet"
* **schema** - the database schema name (required for DB2, optional for other databases)

**Important Notes:**
* For **Oracle** databases, the database schema name is defined by the username specified in the login method (not in the connector configuration itself)
* For **DB2** databases, the **schema** field is required and must be included in the configuration. The schema is also included in the connectionString as `currentSchema=[schema]`; all other types don't accept the schema
* The **loginMethodName** field in the endpointConfiguration should reference an existing login method that provides the database credentials
* Connection strings are database-specific. Examples:
  * Oracle: `jdbc:oracle:thin:@//[host]:[port]/[database]` typical port: 1521, dataSource: oracle
  * MySQL: `jdbc:mysql://[host]:[port]/[database]` typical port: 3306, dataSource: mysql
  * Sybase: `jdbc:sybase:Tds://[host]:[port]/[database]` typical port: 5000, dataSource: sybase
  * PostgreSQL: `jdbc:postgresql://[host]:[port]/[database]` typical port: 5432, dataSource: postgresql
  * SQLite: `jdbc:sqlite:[connector-name]`, dataSource: sqlite
  * HANA: `jdbc:sap://[host]:[port]/[database]` typical port: 30015, dataSource: hana
  * MS SQL: `jdbc:sqlserver://[host]:[port];databaseName=[database]` typical port: 1433, dataSource: mssql
  * DB2: `jdbc:db2://[host]:[port]/[database]:currentSchema=[schema];` typical port: 50000, dataSource: db2
  * DB2AS400: `jdbc:as400://[host]:[port]/[database]` typical port: 446, dataSource: db2_as400

**Complete Example (Oracle):**
```json
{
  "name": "OraExample",
  "description": "connector to oracle database",
  "connectorType": "SQL",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "loginMethodName": "OracleDBCredentials",
    "certificates": [],
    "configuration": {
      "dataSource": "oracle",
      "host": "172.17.0.3",
      "port": "1521",
      "database": "ORCLCDB",
      "connectionString": "jdbc:oracle:thin:@//172.17.0.3:1521/ORCLCDB",
      "resultType": "resultSet"
    }
  },
  "tags": [],
  "assignedProjects": {
    "projectsAfterChange": []
  }
}
```

**Complete Example (MySQL):**
```json
{
  "name": "MySQLExample",
  "description": "connector to mysql database",
  "connectorType": "SQL",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "loginMethodName": "MySQLCredentials",
    "certificates": [],
    "configuration": {
      "dataSource": "mysql",
      "host": "localhost",
      "port": "3306",
      "database": "mydb",
      "connectionString": "jdbc:mysql://localhost:3306/mydb",
      "resultType": "resultSet"
    }
  },
  "tags": [],
  "assignedProjects": {
    "projectsAfterChange": []
  }
}
```

**Complete Example (DB2):**
```json
{
  "name": "McpDb2Test",
  "description": "DB2 connector for testdb database",
  "connectorType": "SQL",
  "active": true,
  "timeoutTime": 60,
  "endpointConfiguration": {
    "endpoint": "Default",
    "loginMethodName": "DB2Credentials",
    "certificates": [],
    "configuration": {
      "dataSource": "db2",
      "host": "localhost",
      "port": "50000",
      "database": "testdb",
      "schema": "MYSCHEMA",
      "connectionString": "jdbc:db2://localhost:50000/testdb:currentSchema=MYSCHEMA;",
      "resultType": "resultSet"
    }
  },
  "tags": [],
  "assignedProjects": {
    "projectsAfterChange": []
  }
}
```

