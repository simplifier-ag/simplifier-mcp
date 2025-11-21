import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export function registerUserApiDocumentation(server: McpServer): void {
  server.resource(
    "user-api-docs",
    "simplifier://documentation/server-businessobjects/api/User",
    {
      title: "Simplifier User API Documentation",
      mimeType: "text/markdown",
      description: "Complete reference for Simplifier.User methods available in server-side Business Objects"
    },
    async (uri): Promise<ReadResourceResult> => {
      const markdownContent = `# Simplifier User API Reference

The Simplifier User API provides comprehensive user management functionality within server-side Business Objects.

## Overview
Access user management methods via: \`Simplifier.User.<method>\`

## Get Users

### \`Simplifier.User.getAll()\`
Retrieves all users on the current Simplifier instance.
- **Input**: ()
- **Result**: Array(object)

\`\`\`javascript
[{
  id: Number,
  login: String,
  firstName: String,
  lastName: String,
  email: String,
  mobileNumber: String,
  salutation: String,
  activeFrom: String,
  activeTill: String,
  active: Boolean,
  blocked: Boolean,
  externalUser: Boolean,
  createdOn: String,
  lastLogin: String,
  preferredLanguage: String
}]
\`\`\`

### \`Simplifier.User.getById(id)\`
Retrieves the user with the given ID. Also retrieves the user's roles, groups and attributes.
- **Input**: (number)
- **Result**: object|null

\`\`\`javascript
var oMyUser = Simplifier.User.getById(12);
\`\`\`

### \`Simplifier.User.getByName(loginName)\`
Retrieves the user with the given login name. Also retrieves the user's roles, groups and attributes.
- **Input**: (string)
- **Result**: object|null

\`\`\`javascript
var oMyUser = Simplifier.User.getByName("MyUserLoginName");
\`\`\`

### \`Simplifier.User.getCurrentUser()\`
Retrieves the currently logged in user. Also retrieves the user's roles, groups and attributes.
- **Input**: ()
- **Result**: object|null

\`\`\`javascript
var oCurrentUser = Simplifier.User.getCurrentUser();
\`\`\`

**Response structure for getById/getByName/getCurrentUser:**
\`\`\`javascript
{
  id: Number,
  login: String,
  firstName: String,
  lastName: String,
  email: String,
  mobileNumber: String,
  salutation: String,
  activeFrom: String,
  activeTill: String,
  active: Boolean,
  blocked: Boolean,
  externalUser: Boolean,
  createdOn: String,
  lastLogin: String,
  preferredLanguage: String,
  attributes: [{
    name: String,
    category: String,
    value: String,
    description: String
  }],
  roles: [{
    id: String,
    name: String,
    description: String,
    active: Boolean
  }],
  groups: [{
    id: Number,
    name: String,
    description: String
  }]
}
\`\`\`

## Create, Update and Delete Users

### \`Simplifier.User.create(data)\`
Creates a new user.
- **Input**: (data: object)
- **Result**: object

\`\`\`javascript
var oNewUser = Simplifier.User.create({
  login: "janedoe",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@testmail.com",
  mobileNumber: "123456789",
  salutation: "Miss",
  roles: ["131702554218077DC71EBD1A569CC81025ADDE6D48F3000291192B88E2D64CA3"],
  groups: [1,2],
  attributes: [{
    name: "Department",
    category: "Company",
    value: "Berlin",
    description: "company departments"
  }]
});
\`\`\`

**Data object structure:**
\`\`\`javascript
{
  login: String,              // Required
  firstName: String,          // Required
  lastName: String,           // Required
  email: String,              // Required
  mobileNumber: String?,      // Optional
  salutation: String?,        // Optional
  activeFrom: String?,        // Optional
  activeTill: String?,        // Optional
  active: Boolean?,           // Optional
  blocked: Boolean?,          // Optional
  preferredLanguage: String?, // Optional
  roles: [String]?,           // Optional - Array of role IDs
  groups: [Number]?,          // Optional - Array of group IDs
  attributes: [{              // Optional
    name: String,
    category: String,
    value: String,
    description: String?
  }]?
}
\`\`\`

### \`Simplifier.User.update(loginName, data)\`
Updates the user identified by the login name.
- **Input**: (loginName: string, data: object)
- **Result**: object

\`\`\`javascript
var oUpdatedUser = Simplifier.User.update("janedoe", {
  firstName: "updatedFirstName",
  lastName: "updatedLastName",
  email: "updatedEmail",
  active: true,
  roles: ["15BEB553CC701C8C6488AD823E052BECD18F12969027EE286AE6F1294C8DF1E2"],
  groups: [2],
  attributes: [{
    name: "Department",
    category: "Company",
    value: "Munich",
    description: "company departments"
  }]
});
\`\`\`

### \`Simplifier.User.delete(id)\`
Deletes a user identified by the given ID.
- **Input**: (number)
- **Result**: ()

### \`Simplifier.User.checkLogin(login, password)\`
Checks whether a user can login with the given credentials.
- **Input**: (string, string)
- **Result**: (boolean)

## Role and Group Management

### \`Simplifier.User.assignRole(loginOrId, roleId)\`
Assigns a role to a user.
- **Input**: (string|number, string)
- **Result**: ()

\`\`\`javascript
Simplifier.User.assignRole(21, "131702554218077DC71EBD1A569CC81025ADDE6D48F3000291192B88E2D64CA3");
\`\`\`

### \`Simplifier.User.unassignRole(loginOrId, roleId)\`
Removes a role from a user.
- **Input**: (string|number, string)
- **Result**: ()

### \`Simplifier.User.assignGroup(loginOrId, groupId)\`
Assigns a group to a user.
- **Input**: (string|number, number)
- **Result**: ()

\`\`\`javascript
Simplifier.User.assignGroup("myUserLogin", 1);
\`\`\`

### \`Simplifier.User.unassignGroup(loginOrId, groupId)\`
Removes a group from a user.
- **Input**: (string|number, number)
- **Result**: ()

## Business Roles

### \`Simplifier.User.getBusinessRoles()\`
Retrieves all business roles of the current logged in user.
- **Input**: ()
- **Result**: Array(object)

### \`Simplifier.User.checkBusinessRole(projectID, roleName)\`
Checks if the current user has a specific business role within a project.
- **Input**: (string, string)
- **Result**: (boolean)

\`\`\`javascript
var bHasBusinessRole = Simplifier.User.checkBusinessRole("MYPROJECT", "administrator");
\`\`\`

### \`Simplifier.User.assignBusinessRole(loginName, projectID, roleName)\`
Assigns a business role to a user within a project.
- **Input**: (string, string, string)
- **Result**: ()

\`\`\`javascript
Simplifier.User.assignBusinessRole("myUserLogin", "MYPROJECT", "administrator");
\`\`\`

## User Attributes

### \`Simplifier.User.getAttributes(loginOrId)\`
Retrieves all attributes of a user.
- **Input**: (string|number)
- **Result**: Array(object)

### \`Simplifier.User.getAttribute(loginOrId, name, category)\`
Retrieves a specific attribute of a user.
- **Input**: (string|number, string, string)
- **Result**: (object | null)

\`\`\`javascript
var oAttribute = Simplifier.User.getAttribute("myUserLogin", "attributeName", "attributeCategory");
\`\`\`

### \`Simplifier.User.setAttribute(loginOrId, name, category, value)\`
Sets (adds or updates) an attribute of a user.
- **Input**: (string|number, string, string, string)
- **Result**: ()

### \`Simplifier.User.deleteAttribute(loginOrId, name, category)\`
Deletes an attribute of a user.
- **Input**: (string|number, string, string)
- **Result**: ()

## Password Management

### \`Simplifier.User.resetPasswordWithEmailTemplate(loginOrId, emailData)\`
Sends a password reset email with custom template.
- **Input**: (string|number, object)
- **Result**: ()

### \`Simplifier.User.setPassword(oneTimeHash, newPassword)\`
Sets a user password using a one-time hash.
- **Input**: (string, string)
- **Result**: ()

## Supported Language Codes

For \`preferredLanguage\` field:
\`bg_BG, ca_ES, hr_HR, cs_CZ, da_DK, nl_NL, en_US, et_EE, fi_FI, fr_FR, de_DE, el_GR, hi_IN, hu_HU, it_IT, ja_JP, kk_KZ, ko_KR, lv_LV, lt_LT, ms_MY, mt_MT, no_NO, pl_PL, pt_PT, ro_RO, ru_RU, zh_CN, sk_SK, sl_SL, es_ES, sv_SE, th_TH, zh_TW, tr_TR, uk_UA, vi_VN\`

## Common Use Cases

### Authentication Check
\`\`\`javascript
var currentUser = Simplifier.User.getCurrentUser();
if (!currentUser) {
  output.error = "User not authenticated";
  return output;
}
\`\`\`

### User Management
\`\`\`javascript
// Create user with specific attributes
var newUser = Simplifier.User.create({
  login: input.username,
  firstName: input.firstName,
  lastName: input.lastName,
  email: input.email,
  active: true,
  attributes: [{
    name: "Department",
    category: "Organization",
    value: input.department
  }]
});

// Assign role based on department
if (input.department === "IT") {
  Simplifier.User.assignRole(newUser.id, "IT_ADMIN_ROLE_ID");
}
\`\`\`

### Business Role Validation
\`\`\`javascript
// Check permissions before executing sensitive operations
var hasAdminRole = Simplifier.User.checkBusinessRole("MYPROJECT", "administrator");
if (!hasAdminRole) {
  output.error = "Insufficient permissions";
  return output;
}
\`\`\`
`;

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