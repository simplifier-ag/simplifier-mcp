# Simplifier MCP Server

Simplifier is the leading low-code platform in the SAP ecosystem. Build custom
apps in a full-stack low-code cloud development environment, reducing your
dependency on full-scale coding. Integrate with ERP, CRM and other systems
easily using standardised connectors.

Find more information in our [community](https://community.simplifier.io) or try
Simplifier [for free](https://community.simplifier.io/start-for-free).

---

This repository contains an MCP server (Model Context Protocol) that enables
integration of AI assistants with the **[Simplifier Low Code Platform](https://simplifier.io/platform/)**.
It provides tools and resources for creating and managing Simplifier Connectors and BusinessObjects.

## Overview

The Simplifier MCP Server allows to interact with a Simplifier instance to:

- **Manage Connectors and Logins**: Integration components that connect external systems
- **Manage Business Objects**: Server-side executed JavaScript functions for business logic
- **Manage Data Types**: Data structures for interacting with Connectors and internal objects
- **Execute Business Object Functions**: Run JavaScript functions with parameters and retrieve results
- **Execute Connector Calls**: Call external systems via Simplifier Connector
- **Access platform resources**: Browse connectors, business objects, and system information



## Usage

Check out [Simplifier Community Docs](https://community.simplifier.io/doc/current-release/extend/setup-mcp-to-interact-with-ai-models/)
on how to use and set up the MCP server best.

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

### Troubleshooting

If the MCP fails to connect to Simplifier on startup, an error page will open in
your browser with details on the failure and information on how to fix the
problem.
