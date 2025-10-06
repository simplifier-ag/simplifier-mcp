# Simplifier MCP Server

An MCP (Model Context Protocol) server that enables integration with the **Simplifier Low Code Platform**. This server provides tools and capabilities for creating and managing Simplifier Connectors and BusinessObjects through the platform's REST API.

## Overview

The Simplifier MCP Server allows AI assistants to interact with the Simplifier Low Code Platform to:

- **Create and manage Simplifier Connectors**: Integration components that connect external systems
- **Create and manage BusinessObjects (BOs)**: Server-side executed JavaScript functions for business logic
- **Execute BusinessObjects**: Run JavaScript functions with parameters and retrieve results
- **Access platform resources**: Browse connectors, business objects, and system information

## Usage

### Add the MCP to claude code
```
claude mcp add --env SIMPLIFIER_TOKEN=<your current simplifier token> --env SIMPLIFIER_BASE_URL=https://<yourinstance>-dev.simplifier.cloud -- simplifier npx @simplifierag/simplifier-mcp@latest
```

### or use this example configuration for claude code to use the MCP
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





