# Create or update a Login Method

Create or update login methods for authenticating connectors with external systems.

**Supported Types:**
- **UserCredentials (BasicAuth)**: Username/password authentication
- **OAuth2**: OAuth2 client-based authentication
- **Token**: Token-based authentication (API keys, SimplifierToken)
- **SAPSSO**: SAP-Single Sign on via Logon Ticket

Note that the type of a login method cannot be changed later. If you need to
change the type, create a new login method instead.

## UserCredentials (BasicAuth)

Creates or updates a basic authentication login method with various source types.

### UserCredentials with Provided Source (Default)

Stores username and password directly in the login method.

**Configuration:**
- **loginMethodType**: "UserCredentials"
- **sourceType**: "Provided" (source ID: 1) - default
- **Target**: Default (target ID: 0) - standard authentication header

**Example - Creating BasicAuth:**
```json
{
  "loginMethodType": "UserCredentials",
  "sourceType": "Provided",
  "name": "MyBasicAuth",
  "description": "Basic auth for API",
  "username": "admin",
  "password": "secretPassword"
}
```

**Example - Updating BasicAuth password:**
```json
{
  "loginMethodType": "UserCredentials",
  "sourceType": "Provided",
  "name": "MyBasicAuth",
  "description": "Updated description",
  "username": "admin",
  "password": "newPassword",
  "changePassword": true
}
```

### UserCredentials with Profile Reference

References a key in the user's profile.

**Example:**
```json
{
  "loginMethodType": "UserCredentials",
  "sourceType": "ProfileReference",
  "name": "MyBasicAuth",
  "description": "BasicAuth from user profile",
  "profileKey": "credentialsKey"
}
```

### UserCredentials with User Attribute Reference

References a user attribute by name and category.

**Example:**
```json
{
  "loginMethodType": "UserCredentials",
  "sourceType": "UserAttributeReference",
  "name": "MyBasicAuth",
  "description": "BasicAuth from user attribute",
  "userAttributeName": "myAttrName",
  "userAttributeCategory": "myAttrCat"
}
```

## OAuth2 Login Methods

Creates or updates OAuth2-based login methods with various source configurations.

**IMPORTANT:** When creating an OAuth2 login method with a client reference, the `oauth2ClientName` MUST match one of the existing OAuth2 clients configured in Simplifier. You can discover available clients using the `simplifier://oauthclients` resource before creating the login method.

### OAuth2 with Client Reference

Uses a configured OAuth2 client from Simplifier.
**Discover available clients:** Use `simplifier://oauthclients` resource

**Configuration:**
- **loginMethodType**: "OAuth2"
- **sourceType**: "ClientReference"
- **Target**: 0 = default header, 1 = custom header, 2 = query parameter

**Example - Default header:**
```json
{
  "loginMethodType": "OAuth2",
  "sourceType": "ClientReference",
  "name": "MyOAuth",
  "description": "OAuth with infraOIDC",
  "oauth2ClientName": "infraOIDC",
  "targetType": "Default"
}
```

**Example - Custom header:**
```json
{
  "loginMethodType": "OAuth2",
  "sourceType": "ClientReference",
  "name": "MyOAuth",
  "description": "OAuth with custom header",
  "oauth2ClientName": "infraOIDC",
  "targetType": "CustomHeader",
  "customHeaderName": "X-Custom-Auth"
}
```

**Example - Query parameter:**
```json
{
  "loginMethodType": "OAuth2",
  "sourceType": "ClientReference",
  "name": "MyOAuth",
  "description": "OAuth as query param",
  "oauth2ClientName": "infraOIDC",
  "targetType": "QueryParameter",
  "queryParameterKey": "authToken"
}
```

### OAuth2 with Profile Reference

References a key in the user's profile.

**Example:**
```json
{
  "loginMethodType": "OAuth2",
  "sourceType": "ProfileReference",
  "name": "MyOAuth",
  "description": "OAuth from user profile",
  "profileKey": "oauthToken",
  "targetType": "Default"
}
```

### OAuth2 with User Attribute Reference

References a user attribute by name and category.

**Example:**
```json
{
  "loginMethodType": "OAuth2",
  "sourceType": "UserAttributeReference",
  "name": "MyOAuth",
  "description": "OAuth from user attribute",
  "userAttributeName": "myAttrName",
  "userAttributeCategory": "myAttrCat",
  "targetType": "Default"
}
```

## Token Login Methods

Creates or updates Token-based login methods for API authentication, including SimplifierToken support.
Can be used for API-KEYs or for tokens, that you have received with former Simplifier Auth Clients
and stored in the UserProfile or in the UserAttributes.
In case you have received a token from a former connector call, you might want to add the token
with every call in a header via a connector call input parameter.

### Token with Default Source

Uses an empty configuration (no credentials stored). Typically used as a placeholder.

**Configuration:**
- **loginMethodType**: "Token"
- **sourceType**: "Default" (source ID: 0)
- **Target**: 0 = default header, 1 = custom header

**Example:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "Default",
  "name": "MyTokenDefault",
  "description": "Token with default source",
  "targetType": "Default"
}
```

### Token with SystemReference Source

Uses the SimplifierToken for authentication. This is the primary use case for authenticating Simplifier apps accessing the REST API.

**Configuration:**
- **loginMethodType**: "Token"
- **sourceType**: "SystemReference" (source ID: 3)
- **Target**: 0 = default header, 1 = custom header

**Example:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "SystemReference",
  "name": "SimplifierTokenAuth",
  "description": "Uses SimplifierToken",
  "targetType": "Default"
}
```

### Token with Provided Source

Stores a token value directly in the login method. Useful for API keys.

**Configuration:**
- **loginMethodType**: "Token"
- **sourceType**: "Provided" (source ID: 1)
- **Target**: 0 = default header, 1 = custom header

**Example - Creating Token:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "Provided",
  "name": "MyAPIKey",
  "description": "API key authentication",
  "token": "mySecretToken123",
  "targetType": "Default"
}
```

**Example - Updating Token value:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "Provided",
  "name": "MyAPIKey",
  "description": "Updated API key",
  "token": "newSecretToken456",
  "changeToken": true
}
```

**Example - Updating description only (without changing token):**
```json
{
  "loginMethodType": "Token",
  "sourceType": "Provided",
  "name": "MyAPIKey",
  "description": "Updated description only",
  "token": "<not relevant>",
  "changeToken": false
}
```

### Token with Custom Header

Place the token in a custom HTTP header.

**Example:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "Provided",
  "name": "MyAPIKeyHeader",
  "description": "Token in custom header",
  "token": "myToken123",
  "targetType": "CustomHeader",
  "customHeaderName": "X-API-Token"
}
```

### Token with Profile Reference

References a token stored in the user's profile.

**Example:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "ProfileReference",
  "name": "MyTokenFromProfile",
  "description": "Token from user profile",
  "profileKey": "apiTokenKey",
  "targetType": "Default"
}
```

### Token with User Attribute Reference

References a token from a user attribute.

**Example:**
```json
{
  "loginMethodType": "Token",
  "sourceType": "UserAttributeReference",
  "name": "MyTokenFromAttr",
  "description": "Token from user attribute",
  "userAttributeName": "tokenAttribute",
  "userAttributeCategory": "security",
  "targetType": "Default"
}
```

## SAP-SSO Login Methods

Creates or updates SAP-SSO login methods for API authentication.
Can be used for users authenticated against a SAP authentication method or with
a constant value or one stored in the UserProfile or in the UserAttributes.

### SAP-SSO with Default Source

Uses an empty configuration (no credentials stored). Uses the SAP Logon Ticket
from the user, which needs to be logged in using SAP-SSO.

**Configuration:**
- **loginMethodType**: "SAPSSO"
- **sourceType**: "Default" (source ID: 0)
- **Target**: 0 = default

**Example:**
```json
{
  "loginMethodType": "SAPSSO",
  "sourceType": "Default",
  "name": "MySAPSSODefault",
  "description": "SAPSSO with default source",
  "targetType": "Default"
}
```

### SAP-SSO with Provided Source

Stores a logon ticket value directly in the login method. Useful for API keys.

**Configuration:**
- **loginMethodType**: "SAPSSO"
- **sourceType**: "Provided" (source ID: 1)
- **Target**: 0 = default header, 1 = custom header

**Example - Creating SAP-SSO:**
```json
{
  "loginMethodType": "SAPSSO",
  "sourceType": "Provided",
  "name": "MyAPIKey",
  "description": "SAP-SSO with constant logon ticket authentication",
  "ticket": "mySecretToken123",
  "targetType": "Default"
}
```

**Example - Updating ticket value:**
```json
{
  "loginMethodType": "SAPSSO",
  "sourceType": "Provided",
  "name": "MyAPIKey",
  "description": "SAP-SSO with constant logon ticket authentication",
  "ticket": "newSecretToken456",
  "changeToken": true
}
```

**Example - Updating description only (without changing ticket):**
```json
{
  "loginMethodType": "SAPSSO",
  "sourceType": "Provided",
  "name": "MyAPIKey",
  "description": "Updated description only",
  "ticket": "<not relevant>",
  "changeToken": false
}
```

### SAP-SSO with Profile Reference

References a ticket stored in the user's profile.

**Example:**
```json
{
  "loginMethodType": "SAPSSO",
  "sourceType": "ProfileReference",
  "name": "MyTicketFromProfile",
  "description": "Ticket from user profile",
  "profileKey": "apiTicket",
  "targetType": "Default"
}
```

### SAP-SSO with User Attribute Reference

References a ticket from a user attribute.

**Example:**
```json
{
  "loginMethodType": "SAPSSO",
  "sourceType": "UserAttributeReference",
  "name": "MyTicketFromAttr",
  "description": "Ticket from user attribute",
  "userAttributeName": "ticketAttribute",
  "userAttributeCategory": "security",
  "targetType": "Default"
}
```
