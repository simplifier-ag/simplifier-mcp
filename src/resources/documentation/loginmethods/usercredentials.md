# UserCredentials (BasicAuth)

A basic authentication login method with various source types.

## UserCredentials with Provided Source (Default)

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

## UserCredentials with Profile Reference

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

## UserCredentials with User Attribute Reference

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
