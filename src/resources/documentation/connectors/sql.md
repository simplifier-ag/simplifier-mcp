# Connector type 'SQL'

# Endpoint settings

The object under **endpointConfiguration / configuration** defines properties, specific to SQL Connector:
* **dataSource** - the database type (e.g., "oracle", "mysql", "postgresql", "mssql", "db2")
* **host** - the hostname or IP address of the database server
* **port** - the port number the database server is listening on (as string)
* **database** - the database name to connect to
* **connectionString** - the JDBC connection string (constructed from host, port, database, and specific to the database type)
* **resultType** - the format for query results, typically "resultSet"
* **schema** - the database schema name (required for DB2, not accepted for other databases)

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

## Call settings

A SQL Connector call defines a database operation to be executed on the configured SQL database endpoint. The Simplifier platform supports different modes for SQL operations, each optimized for specific use cases.

### Supporting the user to create connector calls

In case the user asks, to create a connector call, it is a good practice to collect metadata of the
existing tables first. You can achieve this by creating temporary connector calls for that and execute them as needed.

Here are hints how to create the temporary calls:
- create temporary connector call with mode 'query' to explore the existing tables 
- name the call 'McpTempSchemaTables'
  - example for oracle: SELECT table_name, num_rows, blocks, last_analyzed, owner FROM ALL_TABLES WHERE OWNER = :uppercase_user:

- create temporary connector call with mode 'query' to explore the columns of a table
- name the call 'McpTempTablesColumns'
  - example for oracle: SELECT * FROM USER_TAB_COLUMNS WHERE table_name = :uppercase_tab_name:

Delete the temporarily created connector calls after supporting the user.

### Notes for different databases
#### MySQL
Supports returning a field called 'generatedKeys'. E.g. when creating a call with mode 'transaction' and 
this insert statement: "INSERT INTO GEOCODE_SEARCHES (SEARCH_QUERY) VALUES (:query:)", then this values 
could be returned:

```json
{
  "result": {
    "results": [
      {
        "affectedRows": 1,
        "generatedKeys": [
          11
        ]
      }
    ]
  }
}
```
and the returned generatedKeys of 11 is the value of the primary key column SEARCH_ID, which has the extra AUTO_INCREMENT.
#### SQLite
Natively supports returning 'generatedKeys'. For an example see the MySQL section directly above.
#### Oracle 
Oracle DB does not directly support returning generated keys out of the box. Here you can apply this pattern:
- Do e.g. the INSERT in a call with the mode 'transaction'
- as a second statement (separeted by ;) add a select to get the current value of a sequence
**Example statements (statements are shortened)**
```sql
INSERT INTO GEOCODE_RESULTS (SEARCH_ID, ADDRESS_ID, ...) VALUES (:search_id:, :address_id:, ...);
SELECT <some_sequence>.CURRVAL AS RESULT_ID FROM DUAL
```
#### PostgreSQL
For postgres this pattern is working even for connector calls of mode query:
```sql
INSERT INTO sometable (col1, col2) VALUES (:col1:, :col2:) RETURNING someid
```
will return (given, that sometable has a column 'someid' with a default like: nextval('some_id_seq'::regclass))
```json
{
  "result": [
    {
      "someid": 12
    }
  ]
}
```
### SQL Connector Call Modes

SQL Connector calls support the following execution modes, specified via the **`mode`** parameter:

#### 1. Simple Mode
**Parameter name:** `mode` with value `"simple"`

Supports a dynamic where clause (if the statement not yet has an appended where clause). See later example
how to configure this parameter at the end of this document.

**Use Cases**:
- DDL statements (CREATE, ALTER, DROP)
- Simple queries without dynamic values (SELECT)
- Administrative operations

**Example (Oracle - parameter datatypes are not listed completely):**
```json
{
  "name": "show_tables_fix",
  "description": "Showing all the tables of the oracle schema MCPTEST",
  "validateIn": true,
  "validateOut": true,
  "async": false,
  "connectorCallParameters": [
    {
      "name": "mode",
      "description": "",
      "isInput": true,
      "constValue": "simple",
      "dataType": {
        "id": "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
        "name": "String",
        "category": "base",
        "description": "BaseType for strings",
        "baseType": "String",
        "isStruct": ...
      },
      "optional": false,
      "position": 0
    },
    {
      "name": "request",
      "description": "",
      "isInput": true,
      "constValue": "SELECT table_name, num_rows, blocks, last_analyzed, owner FROM ALL_TABLES\nWHERE OWNER = 'MCPTEST'",
      "dataType": {
        "id": "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
        "name": "String",
        "category": ...
      },
      "optional": false,
      "position": 1
    },
    {
      "name": "/",
      "alias": "result",
      "description": "",
      "isInput": false,
      "dataType": {
        "id": "D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB",
        "name": "Any",
        "category": ...
      },
      "optional": false,
      "position": 2
    }
  ],
  "autoGenerated": false
}
```

#### 2. Query Mode
**Parameter name:** `mode` with value `"query"`

Query mode allows execution of arbitrary SELECT statements with parameter binding. 
**Attention:** in the SQL statement the parameters are prefixed and postfixed with a colon. The
names of the input parameters (e.g. "params/min") must match the name of the parameters in the
SQL statement e.g. ":min:". See example. The :variable: syntax in Simplifier is only for INPUT parameters, not OUTPUT parameters.
For all the parameters given like "params/<myParamName>" you also need to have a placeholder like :<myParamName>: in
the SQL statement of the call - otherwise you should remove this connectorCallParameter completely.

Supports a dynamic where clause (if the statement not yet has an appended where clause). See later example
how to configure this parameter at the end of this document.

**Use Cases**:
- Data retrieval operations
- Complex SELECT queries with filters
- Reporting queries
- Read-only operations (SELECT only)

**Example SELECT query: (parameter datatypes are not given so that the example is shorter)**
```json
{
    "name": "Select_TAB1_with_where_clause",
    "description": "Select from tab1 with min and max boundaries in where clause",
    "validateIn": true,
    "validateOut": false,
    "async": false,
    "connectorCallParameters": [
        {
            "name": "request",
            "isInput": true,
            "constValue": "SELECT MYTR FROM TAB1 where MYTR>:min: AND MYTR<:max:",
            "dataType": ...,
            "optional": false,
            "position": 0
        },
        {
            "name": "mode",
            "isInput": true,
            "constValue": "query",
            "dataType":  ...,
            "optional": false,
            "position": 1
        },
        {
            "name": "params/min",
            "alias": "min",
            "description": "",
            "isInput": true,
            "dataType": ...,
            "optional": false,
            "position": 2
        },
        {
            "name": "params/max",
            "alias": "max",
            "description": "",
            "isInput": true,
            "dataType": ...,
            "optional": false,
            "position": 3
        },
        {
            "name": "/",
            "isInput": false,
            "dataType": ...,
            "optional": false,
            "position": 4
        }
    ],
    "autoGenerated": false
}
```


#### 3. Execute Mode
**Parameter name:** `mode` with value `"execute"`

Execute mode is used for data modification statements (INSERT, UPDATE, DELETE) and DDL statements. It provides parameter binding for safe execution of write operations.
**Attention:** in the SQL statement the parameters are prefixed and postfixed with a colon. See example.
The :variable: syntax in Simplifier is only for INPUT parameters, not OUTPUT parameters.

Supports a dynamic where clause (if the statement not yet has an appended where clause). See later example
how to configure this parameter at the end of this document.

**Use Cases**:
- INSERT operations
- UPDATE operations
- DELETE operations
- Any statement that modifies data


**Example UPDATE statement: (datatypes have been skipped for being short)**
```json
{
  "name": "updateTab2",
  "description": "",
  "validateIn": true,
  "validateOut": true,
  "async": false,
  "connectorCallParameters": [
    {
      "name": "mode",
      "description": "",
      "isInput": true,
      "constValue": "execute",
      "dataType": ...,
      "optional": false,
      "position": 0
    },
    {
      "name": "request",
      "description": "",
      "isInput": true,
      "constValue": "update tab2 set my_int = :int: WHERE my_string_col = :string:",
      "dataType": ...,
      "optional": false,
      "position": 1
    },
    {
      "name": "params/int",
      "alias": "int",
      "description": "",
      "isInput": true,
      "dataType": ...,
      "optional": false,
      "position": 2
    },
    {
      "name": "params/string",
      "alias": "string",
      "description": "",
      "isInput": true,
      "dataType": ...,
      "optional": false,
      "position": 3
    },
    {
      "name": "/",
      "alias": "result",
      "description": "",
      "isInput": false,
      "dataType": ...,
      "optional": false,
      "position": 4
    }
  ],
  "autoGenerated": false
}
```

#### 4. Transaction Mode
**Parameter name:** `mode` with value `"transaction"`

Transaction mode allows execution of multiple SQL statements within a single database transaction.
All statements succeed or fail together, ensuring data consistency.

The delimiter parameter defines the delimiter character between the statements (usually the default semicolon is fine).

Does not support a dynamic where clause.

The result of each statement is returned. 

**Use Cases**:
- Multi-step data operations
- Batch updates requiring consistency
- Complex business logic requiring ACID properties


**Example transaction:**
```json
{
  "name": "updateTransactional",
  "description": "",
  "validateIn": true,
  "validateOut": true,
  "async": false,
  "connectorCallParameters": [
    {
      "name": "mode",
      "description": "",
      "isInput": true,
      "constValue": "transaction",
      "dataType": ...,
      "optional": false,
      "position": 0
    },
    {
      "name": "request",
      "description": "",
      "isInput": true,
      "constValue": "select * from tab2 where my_string_col = :string: ;\n\nupdate tab2 set my_int = :int: WHERE my_string_col = :string: ;\n\nselect * from TAB2 where my_string_col = :string: ;\n\nupdate tab2 set my_string_col = upper(:string:) WHERE my_string_col = :string: ;\n\nselect * from tab2 where my_string_col = upper(:string:) ;",
      "dataType": ...,
      "optional": false,
      "position": 1
    },
    {
      "name": "delimiter",
      "description": "",
      "isInput": true,
      "constValue": ";",
      "dataType": ...,
      "optional": false,
      "position": 2
    },
    {
      "name": "params/string",
      "alias": "string",
      "description": "",
      "isInput": true,
      "dataType": ...,
      "optional": false,
      "position": 3
    },
    {
      "name": "params/int",
      "alias": "int",
      "description": "",
      "isInput": true,
      "dataType": ...,
      "optional": false,
      "position": 4
    },
    {
      "name": "/",
      "alias": "result",
      "description": "",
      "isInput": false,
      "dataType": ...,
      "optional": false,
      "position": 5
    }
  ],
  "autoGenerated": false
}
```

**Example of result of executing a transaction sql connector call with 5 statements**
```json
{
  "result": {
    "results": [
      {
        "resultSet": [
          {
            "MY_INT": 14,
            "MY_STRING_COL": "four"
          }
        ]
      },
      {
        "affectedRows": 1
      },
      {
        "resultSet": [
          {
            "MY_INT": 4141,
            "MY_STRING_COL": "four"
          }
        ]
      },
      {
        "affectedRows": 1
      },
      {
        "resultSet": [
          {
            "MY_INT": 444,
            "MY_STRING_COL": "FOUR"
          },
          {
            "MY_INT": 4141,
            "MY_STRING_COL": "FOUR"
          }
        ]
      }
    ]
  }
}
```


#### 5. Repeatable Statement Mode
**Parameter name:** `mode` with value `"repeatableStatement"`

Repeatable Statement mode is optimized for bulk operations where the same SQL statement needs to be executed multiple 
times with different parameter sets.

Does not support a dynamic where clause.

The parameters are not given like e.g. "params/myint" but as "parameterCollection", which contains
a value, which is an array like this: [ { "myint": value1, "mystring": "mystring1" },  { "myint": value2, "mystring": "mystring2" }, ... ]

**Use Cases**:
- Bulk inserts
- Batch updates with different values
- Mass data operations


**Example bulk insert: (datatypes have been left out)**
```json
{
  "name": "insertTab2Bulk",
  "description": "",
  "validateIn": true,
  "validateOut": true,
  "async": false,
  "connectorCallParameters": [
    {
      "name": "mode",
      "description": "",
      "isInput": true,
      "constValue": "repeatableStatement",
      "dataType": ...,
      "optional": false,
      "position": 0
    },
    {
      "name": "request",
      "description": "",
      "isInput": true,
      "constValue": "INSERT into tab2 (my_int, my_string_col) values ( :int:, :string: )",
      "dataType": ...,
      "optional": false,
      "position": 1
    },
    {
      "name": "parameterCollection",
      "description": "",
      "isInput": true,
      "dataType": ...,
      "optional": false,
      "position": 2
    },
    {
      "name": "/",
      "alias": "result",
      "description": "",
      "isInput": false,
      "dataType": ...,
      "optional": false,
      "position": 3
    }
  ],
  "autoGenerated": false
}
```

**Example how to call a repeatable statement (datatypes are missing in this example)**
```json
{
  "parameters": [
    {
      "value": [
        {
          "int": 222,
          "string": "zwozwozwo"
        },
        {
          "int": 333,
          "string": "drei drei drei"
        }
      ],
      "name": "parameterCollection",
      "description": "",
      "dataType": ...,
      "optional": false,
      "transfer": true
    },
    {
      "constValue": "repeatableStatement",
      "value": "repeatableStatement",
      "name": "mode",
      "description": "",
      "dataType": ...,
      "optional": false,
      "transfer": true
    },
    {
      "constValue": "INSERT into tab2 (my_int, my_string_col) values ( :int:, :string: )",
      "value": "INSERT into tab2 (my_int, my_string_col) values ( :int:, :string: )",
      "name": "request",
      "description": "",
      "dataType": ...,
      "optional": false,
      "transfer": true
    }
  ]
}
```

### dynamic where clause
For modes, that support a dynamic where clause, one can add this additional parameter. It will only
work, if the statement of the connector call does not yet have a where clause itself.

#### Configuration example 
The index of position has to be adapted.
```json
{
  "name": "where",
  "alias": "WHERE",
  "description": "",
  "isInput": true,
  "dataType": {
    "id": "22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52",
    "name": "String",
    "category": "base",
    "description": "BaseType for string literals",
    "baseType": "String",
    "isStruct": false,
    "fields": [],
    "properties": [
      {
        "name": "Operators",
        "value": "==, !="
      }
    ],
    "editable": true,
    "tags": [],
    "assignedProjects": {
      "projectsBefore": [],
      "projectsAfterChange": []
    }
  },
  "optional": true,
  "position": 3
}
```
