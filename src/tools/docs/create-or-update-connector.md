# Create or update a Connector

This tool allows to
* create new connectors
* modify existing connectors

**Attention:** When updating a Connector, allways fetch the existing resource first to ensure operating on the latest version.
Existing tags and endpoints have to be resent when doing an update - otherwise they would be cleared.


## Common settings

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

## Type-specific settings

Each connector type requires different settings, check the corresponding resource:

- REST: simplifier://documentation/connector-type/rest
- SOAP: simplifier://documentation/connector-type/soap
- SAP RFC: simplifier://documentation/connector-type/rfc
- SQL: simplifier://documentation/connector-type/sql
