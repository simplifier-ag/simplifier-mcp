# Simplifier MCP Server

An MCP (Model Context Protocol) server that enables integration with the **[Simplifier Low Code Platform](simplifier.io/platform/)**. This server provides tools and capabilities for creating and managing Simplifier Connectors and BusinessObjects through the platform's REST API.


## Overview

The Simplifier MCP Server allows AI assistants to interact with the Simplifier Low Code Platform to:

- **Manage Connectors and Logins**: Integration components that connect external systems
- **Manage Business Objects**: Server-side executed JavaScript functions for business logic
- **Manage Data Types**: Data structures for interacting with Connectors and internal objects
- **Execute Business Object Functions**: Run JavaScript functions with parameters and retrieve results
- **Execute Connector Calls**: Call external systems via Simplifier Connector
- **Access platform resources**: Browse connectors, business objects, and system information

See also [community.simplifier.io](https://community.simplifier.io/doc/getting-started/basic-concept-technology/ai/)


## Usage

### Add the MCP to claude code ...
```
claude mcp add simplifier npx @simplifierag/simplifier-mcp@latest --env SIMPLIFIER_TOKEN=<your current simplifier token> --env SIMPLIFIER_BASE_URL=https://<yourinstance>-dev.simplifier.cloud
```
If your Simplifier is hosted on premise, then the `SIMPLIFIER_BASE_URL` of your DEV instance will be different from the mentioned schema.
#### After a new login to Simplifier
With every login to Simplifier your SimplifierToken will change. So you will have to:
 - exit your AI agent (in this example claude),
 - then remove the configuration of the MCP
```
claude mcp remove simplifier
```
 - and then add the MCP again with the new token (see upper command) and restart your AI agent

### ...or use this example configuration for claude code to use the MCP
e.g. in a file named .mcp.json placed in the directory, where claude is started.
```
{
  "mcpServers":  {
    "simplifier-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [ 
        "@simplifierag/simplifier-mcp@latest"
      ],
      "env": {
        "SIMPLIFIER_BASE_URL": "https://<yourinstance>-dev.simplifier.cloud",
        "SIMPLIFIER_TOKEN": "<your current simplifier token>"
      }
    }
  }
}
```





