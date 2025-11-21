# OAuth2 Login Methods

OAuth2-based login methods with various source configurations.

**IMPORTANT:** When creating an OAuth2 login method with a client reference, the `oauth2ClientName` MUST match one of the existing OAuth2 clients configured in Simplifier. You can discover available clients using the `simplifier://oauthclients` resource before creating the login method.

## OAuth2 with Client Reference

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

## OAuth2 with Profile Reference

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

## OAuth2 with User Attribute Reference

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
