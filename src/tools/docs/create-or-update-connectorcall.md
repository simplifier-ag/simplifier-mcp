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
