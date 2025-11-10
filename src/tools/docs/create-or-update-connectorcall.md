# Create or update a Connector call

This tool allows to
* create new connector calls
* modify existing connector calls

**Attention:** When updating a call, allways fetch the existing resource first to ensure operating on the latest version.
Existing parameters have to be resent when doing an update - otherwise they would be cleared.

## Connector Types

### Connector type 'REST'

A REST Connector call defines a HTTP request to the configured endpoint address of the Connector.

Call parameters may define the following:

#### HTTP Method
Parameter name: **`verb`**

Type: String

Possible Values: GET, POST, PUT, PATCH, DELETE, HEAD, OPTION

The parameter is mandatory. If not specified differently, use constValue "GET".


#### Request body format
Parameter name: **`postFormat`**

Type: String

Possible Values: JSON, PLAIN, FORM, XML


#### Request Body
Parameter name: **`body`**

It can have an arbitrary data type. The data is converted and *Content-Type* header is set according to the parameter **`format`**.


#### Request Headers
Parameter name: **`headParams/<http-header-name>`**

Type: String

Example:
To add a header "X-TEST", define a parameter with the name "headParams/X-TEST".


#### Path parameters
Parameter name: **`pathParams[<n>]`**

Type: Array[String]  - that means it must always be given with array index, i.e. pathParams[0].

To form the URL of the call with complete path, all components of the array are joined by "/" and appended to the endpoint URL or the connector.

Defining a path is optional. If omitted, just the endpoint URL is called.

Examples: (assume endpoint URL is http://test-api.com)
* If pathParams[0] is "data", the address of the call is "http://test-api.com/data".
* If pathParams[0]="data" and pathParams[1]="customer", the address of the call is "http://test-api.com/data/customer".


#### URL parameters

Parameter name: **`queryParams/<query-param-name>`** (Type: String)

Example:
To set the url parameter like in "http://test-api.com?level=4", define a parameter with the name "queryParams/level" and give it a value 4.


#### Output parameters

A REST Connector must have at least one output parameter

An empty parameter name, or "/" refers to the whole output object.

Use alias "data" for the whole output object.


### Connector type 'SOAP'

A SOAP Connector call defines a SOAP operation to be invoked on the configured WSDL service endpoint of the Connector.

Call parameters may define the following:

#### Binding Name
Parameter name: **`bindingName`**

Type: String

The binding name identifies the specific service binding to use from the WSDL specification.

The parameter is mandatory.


#### Operation Name
Parameter name: **`operationName`**

Type: String

The operation name specifies which SOAP operation to invoke from the binding.

The parameter is mandatory.

#### Operation parameters

Parameter name: **`soap/<operationName>/<parameterName>`**

Type: depends on operation

Example: `soap/_-ITIZ_-BUS2038_CREATE/index`

Operation parameters contains the SOAP request parameters according to the
operation's input schema defined in the WSDL.



#### URL parameters
Parameter name: **`queryParams/<query-param-name>`**

Type: String

Optional parameters can be added as query parameters appended to the SOAP request URL.

Example:
To set a URL parameter like in "http://soap-service.com?version=1.0", define a parameter with the name "queryParams/version" and give it a value "1.0".


#### Output parameters

Parameter name: **`soap/<response-message-name>/<element>`**

An empty parameter name, or "/" refers to the whole output object.

Use alias "data" for the whole output object.

The output typically contains the SOAP response parsed according to the operation's output schema defined in the WSDL.

For example, given the following WSDL operation:

```xml
<wsdl:operation name="InputOutput">
    <wsp:Policy>
        <wsp:PolicyReference URI="#OP___-ITIZ_-DRAW_READ_ORIGINAL_FILE" />
    </wsp:Policy>
    <wsdl:input message="tns:InputOutput" />
    <wsdl:output message="tns:InputOutputResponse" />
</wsdl:operation>
```
With the corresponding message and element definitions:
```xml
<wsdl:message name="InputOutputResponse">
    <wsdl:part name="parameter" element="tns:InputOutputResponse" />
</wsdl:message>
```

```xml
<xsd:element name="InputOutputResponse">
    <xsd:complexType>
        <xsd:sequence>
            <xsd:element name="InputOutput" type="xsd:base64Binary" />
        </xsd:sequence>
    </xsd:complexType>
</xsd:element>
```

the resulting object for the `/` output parameter would look like this:
```json
{
  "soap": {
    "InputOutputResponse": {
      "InputOutput": "some value here"
    }
  }
}
```
To get the relevant field only, the output parameter name would be `/soap/InputOutputResponse/InputOutput`


### Connector type 'SQL'

A SQL Connector call defines a database operation to be executed on the configured SQL database endpoint. The Simplifier platform supports different modes for SQL operations, each optimized for specific use cases.

#### Supporting the user to create connector calls

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

#### SQL Connector Call Modes

SQL Connector calls support the following execution modes, specified via the **`mode`** parameter:

##### 1. Simple Mode
**Parameter name:** `mode` with value `"simple"`

Supports a dynamic where clause (if the statement not yet has an appended where clause) TODO see later example

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

##### 2. Query Mode
**Parameter name:** `mode` with value `"query"`

Query mode allows execution of arbitrary SELECT statements with parameter binding. 
**Attention:** in the SQL statement the parameters are prefixed and postfixed with a colon. The
names of the input parameters (e.g. "params/min") must match the name of the parameters in the
SQL statement e.g. ":min:". See example. The :variable: syntax in Simplifier is only for INPUT parameters, not OUTPUT parameters.

Supports a dynamic where clause (if the statement not yet has an appended where clause) TODO see later example

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


##### 3. Execute Mode
**Parameter name:** `mode` with value `"execute"`

Execute mode is used for data modification statements (INSERT, UPDATE, DELETE) and DDL statements. It provides parameter binding for safe execution of write operations.
**Attention:** in the SQL statement the parameters are prefixed and postfixed with a colon. See example.
The :variable: syntax in Simplifier is only for INPUT parameters, not OUTPUT parameters.

Supports a dynamic where clause (if the statement not yet has an appended where clause) TODO see later example

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

##### 4. Transaction Mode
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


##### 5. Repeatable Statement Mode
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
