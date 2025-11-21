# Connector type 'SOAP'

## Endpoint settings

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

## Call settings

A SOAP Connector call defines a SOAP operation to be invoked on the configured WSDL service endpoint of the Connector.
You can retrieve the configured WSDL for a connector using the resource simplifier://connector/{connectorName}/wsdl

Call parameters may define the following:

### Binding Name
Parameter name: **`bindingName`**

Type: String

The binding name identifies the specific service binding to use from the WSDL specification.

The parameter is mandatory.


### Operation Name
Parameter name: **`operationName`**

Type: String

The operation name specifies which SOAP operation to invoke from the binding.

The parameter is mandatory.

### Operation parameters

Parameter name: **`soap/<operationName>/<parameterName>`**

Type: depends on operation

Example: `soap/_-ITIZ_-BUS2038_CREATE/index`

Operation parameters contains the SOAP request parameters according to the
operation's input schema defined in the WSDL.



### URL parameters
Parameter name: **`queryParams/<query-param-name>`**

Type: String

Optional parameters can be added as query parameters appended to the SOAP request URL.

Example:
To set a URL parameter like in "http://soap-service.com?version=1.0", define a parameter with the name "queryParams/version" and give it a value "1.0".


### Output parameters

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
