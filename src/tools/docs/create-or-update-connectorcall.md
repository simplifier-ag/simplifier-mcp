# Create or update a Connector call

This tool allows to
* create new connector calls
* modify existing connector calls

**Attention:** When updating a call, allways fetch the existing resource first to ensure operating on the latest version.
Existing parameters have to be resent when doing an update - otherwise they would be cleared.

Each connector type requires different call configuration, check the corresponding resource:

- REST: simplifier://documentation/connector-type/rest
- SOAP: simplifier://documentation/connector-type/soap
- SAP RFC: simplifier://documentation/connector-type/rfc
- SQL: simplifier://documentation/connector-type/sql