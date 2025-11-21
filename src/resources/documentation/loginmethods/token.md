# Token Login Methods

Token-based login methods for API authentication, including SimplifierToken support.
Can be used for API-KEYs or for tokens, that you have received with former Simplifier Auth Clients
and stored in the UserProfile or in the UserAttributes.
In case you have received a token from a former connector call, you might want to add the token
with every call in a header via a connector call input parameter.

## Token with Default Source

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

## Token with SystemReference Source

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

## Token with Provided Source

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

## Token with Custom Header

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

## Token with Profile Reference

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

## Token with User Attribute Reference

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
