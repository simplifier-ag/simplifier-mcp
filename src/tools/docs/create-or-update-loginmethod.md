# Create or update a Login Method

Create or update login methods for authenticating connectors with external systems.

**Supported Types:**
- **UserCredentials (BasicAuth)**: Username/password authentication
- **OAuth2**: OAuth2 client-based authentication

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
