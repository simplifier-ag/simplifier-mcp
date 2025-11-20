# SAP-SSO Login Methods

SAP-SSO login methods for API authentication.
Can be used for users authenticated against a SAP authentication method or with
a constant value or one stored in the UserProfile or in the UserAttributes.

## SAP-SSO with Default Source

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

## SAP-SSO with Provided Source

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

## SAP-SSO with Profile Reference

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

## SAP-SSO with User Attribute Reference

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
