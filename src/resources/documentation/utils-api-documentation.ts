import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export function registerUtilsApiDocumentation(server: McpServer): void {
  server.resource(
    "utils-api-docs",
    "simplifier://documentation/server-businessobjects/api/Utils",
    {
      title: "Simplifier Utils API Documentation",
      mimeType: "text/markdown",
      description: "Complete reference for Simplifier.Utils methods available in server-side Business Objects"
    },
    async (uri): Promise<ReadResourceResult> => {
      const markdownContent = `# Simplifier Utils API Reference

The Simplifier Utils API provides essential utility functions for data conversion and transformation within server-side Business Objects.

## Overview
Access utility methods via: \`Simplifier.Utils.<method>\`

## Base64 Encoding and Decoding

### \`Simplifier.Utils.base64Encode(data)\`
Encodes data to Base64 format.
- **Input**: (string)
- **Result**: string

\`\`\`javascript
var encodedData = Simplifier.Utils.base64Encode("Hello World!");
// Result: "SGVsbG8gV29ybGQh"
\`\`\`

**Use Cases:**
- Encoding binary data for transmission
- Preparing data for API calls requiring Base64 format
- Storing binary content in text-based systems

### \`Simplifier.Utils.base64Decode(encodedData)\`
Decodes Base64 encoded data back to original format.
- **Input**: (string)
- **Result**: string

\`\`\`javascript
var decodedData = Simplifier.Utils.base64Decode("SGVsbG8gV29ybGQh");
// Result: "Hello World!"
\`\`\`

**Use Cases:**
- Decoding received Base64 data
- Processing encoded file content
- Converting Base64 images for processing

## XML and JSON Conversion

### \`Simplifier.Utils.xmlToJson(xmlString)\`
Converts XML string to JSON object.
- **Input**: (string)
- **Result**: object

\`\`\`javascript
var xmlData = '<root><name>John</name><age>30</age></root>';
var jsonResult = Simplifier.Utils.xmlToJson(xmlData);
// Result: { root: { name: "John", age: "30" } }
\`\`\`

**Use Cases:**
- Processing XML responses from external APIs
- Converting XML configuration files
- Transforming SOAP response data
- Integrating with legacy XML systems

### \`Simplifier.Utils.jsonToXml(jsonObject)\`
Converts JSON object to XML string.
- **Input**: (object)
- **Result**: string

\`\`\`javascript
var jsonData = { root: { name: "John", age: 30 } };
var xmlResult = Simplifier.Utils.jsonToXml(jsonData);
// Result: "<root><name>John</name><age>30</age></root>"
\`\`\`

**Use Cases:**
- Generating XML for SOAP requests
- Creating XML configuration files
- Preparing data for XML-based APIs
- Converting structured data for legacy systems

## Common Usage Patterns

### Data Transformation Pipeline
\`\`\`javascript
function processExternalData(rawData) {
  // Step 1: Decode Base64 received data
  var decodedData = Simplifier.Utils.base64Decode(rawData);

  // Step 2: Parse XML to JSON for easier manipulation
  var jsonData = Simplifier.Utils.xmlToJson(decodedData);

  // Step 3: Process the data
  if (jsonData.response && jsonData.response.status === "success") {
    return jsonData.response.data;
  }

  return null;
}
\`\`\`

### API Integration Example
\`\`\`javascript
function sendXMLRequest(requestData) {
  // Convert JSON to XML for SOAP API
  var xmlPayload = Simplifier.Utils.jsonToXml({
    soap: {
      body: {
        request: requestData
      }
    }
  });

  // Encode for transmission
  var encodedPayload = Simplifier.Utils.base64Encode(xmlPayload);

  // Send to external system
  var response = Simplifier.Connector.ExternalAPI.sendRequest({
    payload: encodedPayload,
    format: "xml"
  });

  return response;
}
\`\`\`

### File Processing Workflow
\`\`\`javascript
function processUploadedXMLFile(base64FileContent) {
  try {
    // Decode the file content
    var xmlContent = Simplifier.Utils.base64Decode(base64FileContent);

    // Convert XML to JSON for processing
    var jsonData = Simplifier.Utils.xmlToJson(xmlContent);

    // Validate structure
    if (!jsonData.document || !jsonData.document.records) {
      output.error = "Invalid XML structure";
      return output;
    }

    // Process records
    var processedRecords = [];
    var records = Array.isArray(jsonData.document.records.record)
      ? jsonData.document.records.record
      : [jsonData.document.records.record];

    records.forEach(function(record) {
      if (record.id && record.name) {
        processedRecords.push({
          id: record.id,
          name: record.name,
          processedAt: new Date().toISOString()
        });
      }
    });

    output.processedCount = processedRecords.length;
    output.records = processedRecords;

    return output;
  } catch (error) {
    output.error = "Failed to process XML file: " + error.message;
    return output;
  }
}
\`\`\`

## Error Handling Best Practices

### Base64 Operations
\`\`\`javascript
function safeBase64Decode(encodedData) {
  try {
    var decodedData = Simplifier.Utils.base64Decode(encodedData);
    return { success: true, data: decodedData };
  } catch (error) {
    Simplifier.Log.error("Base64 decode failed", {
      input: encodedData.substring(0, 50) + "...",
      error: error.message
    });
    return { success: false, error: "Invalid Base64 format" };
  }
}
\`\`\`

### XML/JSON Conversion
\`\`\`javascript
function safeXmlToJson(xmlString) {
  try {
    // Validate XML is not empty
    if (!xmlString || xmlString.trim().length === 0) {
      throw new Error("XML string is empty");
    }

    var jsonResult = Simplifier.Utils.xmlToJson(xmlString);

    // Validate conversion result
    if (!jsonResult || typeof jsonResult !== 'object') {
      throw new Error("XML conversion resulted in invalid JSON");
    }

    return { success: true, data: jsonResult };
  } catch (error) {
    Simplifier.Log.error("XML to JSON conversion failed", {
      xmlPreview: xmlString.substring(0, 100) + "...",
      error: error.message
    });
    return { success: false, error: "XML parsing failed: " + error.message };
  }
}
\`\`\`

## Performance Considerations

### Large Data Handling
\`\`\`javascript
function processLargeXMLFile(base64Content) {
  var startTime = Date.now();

  // Log processing start for large files
  if (base64Content.length > 1000000) { // > 1MB
    Simplifier.Log.info("Processing large XML file", {
      size: base64Content.length + " characters",
      estimatedMB: Math.round(base64Content.length / 1048576 * 100) / 100
    });
  }

  try {
    var xmlContent = Simplifier.Utils.base64Decode(base64Content);
    var jsonData = Simplifier.Utils.xmlToJson(xmlContent);

    var processingTime = Date.now() - startTime;

    // Log performance metrics
    Simplifier.Log.info("XML processing completed", {
      processingTimeMs: processingTime,
      inputSizeChars: base64Content.length,
      outputObjects: Object.keys(jsonData).length
    });

    return jsonData;
  } catch (error) {
    var processingTime = Date.now() - startTime;
    Simplifier.Log.error("Large XML processing failed", {
      processingTimeMs: processingTime,
      inputSizeChars: base64Content.length,
      error: error.message
    });
    throw error;
  }
}
\`\`\`

### Memory Optimization
\`\`\`javascript
function batchProcessXMLRecords(xmlData) {
  var batchSize = 100;
  var jsonData = Simplifier.Utils.xmlToJson(xmlData);

  if (jsonData.records && jsonData.records.record) {
    var records = Array.isArray(jsonData.records.record)
      ? jsonData.records.record
      : [jsonData.records.record];

    var processedBatches = 0;
    var totalRecords = records.length;

    for (var i = 0; i < totalRecords; i += batchSize) {
      var batch = records.slice(i, i + batchSize);

      // Process batch
      processBatch(batch);

      processedBatches++;

      if (processedBatches % 10 === 0) {
        Simplifier.Log.debug("Batch processing progress", {
          processedBatches: processedBatches,
          totalRecords: totalRecords,
          progress: Math.round((i / totalRecords) * 100) + "%"
        });
      }
    }
  }
}
\`\`\`

## Security Considerations

### Input Validation
\`\`\`javascript
function validateAndProcessXML(xmlInput) {
  // Validate input is not empty
  if (!xmlInput || typeof xmlInput !== 'string') {
    output.error = "Invalid XML input";
    return output;
  }

  // Check for potentially dangerous XML patterns
  var dangerousPatterns = [
    '<!DOCTYPE',
    '<!ENTITY',
    '&xxe;'
  ];

  for (var i = 0; i < dangerousPatterns.length; i++) {
    if (xmlInput.indexOf(dangerousPatterns[i]) !== -1) {
      Simplifier.Log.warn("Potentially dangerous XML pattern detected", {
        pattern: dangerousPatterns[i],
        blocked: true
      });
      output.error = "XML contains restricted patterns";
      return output;
    }
  }

  // Process safe XML
  try {
    var jsonResult = Simplifier.Utils.xmlToJson(xmlInput);
    output.data = jsonResult;
    return output;
  } catch (error) {
    output.error = "XML processing failed";
    return output;
  }
}
\`\`\`

## Integration Examples

### SOAP Service Integration
\`\`\`javascript
function callSOAPService(operation, parameters) {
  // Create SOAP envelope
  var soapRequest = {
    'soap:Envelope': {
      'soap:Header': {},
      'soap:Body': {}
    }
  };

  soapRequest['soap:Envelope']['soap:Body'][operation] = parameters;

  // Convert to XML
  var xmlRequest = Simplifier.Utils.jsonToXml(soapRequest);

  // Send to SOAP service
  var response = Simplifier.Connector.SOAPService.call({
    body: xmlRequest,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': operation
    }
  });

  // Parse response
  if (response && response.body) {
    var responseJson = Simplifier.Utils.xmlToJson(response.body);
    return responseJson;
  }

  return null;
}
\`\`\`

### File Export Functionality
\`\`\`javascript
function exportDataAsXML(dataArray) {
  // Structure data for XML
  var xmlStructure = {
    export: {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: dataArray.length
      },
      records: {
        record: dataArray
      }
    }
  };

  // Convert to XML
  var xmlContent = Simplifier.Utils.jsonToXml(xmlStructure);

  // Encode for download
  var base64Content = Simplifier.Utils.base64Encode(xmlContent);

  output.downloadData = base64Content;
  output.filename = "export_" + new Date().toISOString().split('T')[0] + ".xml";
  output.contentType = "application/xml";

  return output;
}
\`\`\`

This comprehensive Utils API documentation provides all the essential utility functions for data conversion and transformation, complete with practical examples, error handling patterns, and security considerations for robust Business Object implementations.`;

      return {
        contents: [{
          uri: uri.href,
          text: markdownContent,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}