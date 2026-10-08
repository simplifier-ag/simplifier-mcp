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

### Supported Connector types

Currently only the following connector types are fully supported:

* REST
* SOAP
* SQL
* SAPRFC
* OData (proxy-only; does not support Connector Calls)

### Client compatibility

The Simplifier MCP server exposes its data through two parallel surfaces so that
every MCP client can use it in full, regardless of which parts of the MCP
protocol that client supports:

* Clients that implement MCP **Resources** (e.g. Claude Code, Claude Desktop,
  MCP Inspector) can browse and read Simplifier data through
  `simplifier://…` URIs — for example `simplifier://businessobjects`,
  `simplifier://connector/{name}`, or `simplifier://documentation/…`.
* Clients that only implement MCP **Tools** (e.g. OpenCode, Cursor, Cline,
  Continue, Windsurf) get equivalent read access through tools named
  `*-list`, `*-get`, `documentation-get` and `connector-wizard-rfc-search`.

Both surfaces share the same underlying implementation, so behavior is
identical. Where both are available, clients should prefer resources.


## Usage

Check out [Simplifier Community Docs](https://community.simplifier.io/doc/current-release/extend/setup-mcp-to-interact-with-ai-models/)
on how to use and set up the MCP server best.

### Authentication

The recommended way to authenticate (from Simplifier Version MC 26-11 or higher) is a **personal access token (PAT)**, provided via `SIMPLIFIER_APITOKEN`.
It is sent to Simplifier as `ApiToken` header and does not change with every login, so you configure it once
and don't have to renew it daily. All examples below use `SIMPLIFIER_APITOKEN`.

Alternatively you can use one of these environment variables instead:
- `SIMPLIFIER_TOKEN`: your current SimplifierToken. It changes with every login to Simplifier (see [After a new login to Simplifier](#after-a-new-login-to-simplifier)).
- `SIMPLIFIER_CREDENTIALS_FILE`: path to a JSON file with `user` and `pass`, used to log in to Simplifier on startup.

Only one of `SIMPLIFIER_APITOKEN`, `SIMPLIFIER_TOKEN` and `SIMPLIFIER_CREDENTIALS_FILE` may be set.

### Add the MCP to claude code ...

**Using node / npx:**
```
claude mcp add simplifier npx @simplifierag/simplifier-mcp@latest --env SIMPLIFIER_APITOKEN=<your personal access token> --env SIMPLIFIER_BASE_URL=https://<yourinstance>-dev.simplifier.cloud
```

**Using Docker:**
```
claude mcp add simplifier-docker docker -- run --rm -i --env SIMPLIFIER_APITOKEN=<your personal access token> --env SIMPLIFIER_BASE_URL=https://<yourinstance>-dev.simplifier.cloud simplifierag/simplifier-mcp:latest
```

If your Simplifier is hosted on premise, then the `SIMPLIFIER_BASE_URL` of your DEV instance will be different from the mentioned schema.

#### After a new login to Simplifier
This only applies if you use `SIMPLIFIER_TOKEN` instead of a personal access token.
With every login to Simplifier your SimplifierToken will change. So you will have to:
 - exit your AI agent (in this example claude),
 - then remove the configuration of the MCP
```
claude mcp remove simplifier
```
 - and then add the MCP again with `--env SIMPLIFIER_TOKEN=<your current simplifier token>` instead of `SIMPLIFIER_APITOKEN` (see upper command) and restart your AI agent

### ...or use this example configuration for claude code to use the MCP
e.g. in a file named .mcp.json placed in the directory, where claude is started.

**Using node / npx:**
```json
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
        "SIMPLIFIER_APITOKEN": "<your personal access token>"
      }
    }
  }
}
```

**Using Docker:**
```json
{
  "mcpServers": {
    "simplifier-docker": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env",
        "SIMPLIFIER_APITOKEN",
        "--env",
        "SIMPLIFIER_BASE_URL",
        "simplifierag/simplifier-mcp:latest"
      ],
      "env": {
        "SIMPLIFIER_BASE_URL": "https://<yourinstance>-dev.simplifier.cloud",
        "SIMPLIFIER_APITOKEN": "<your personal access token>"
      }
    }
  }
}
```

### Troubleshooting

If the MCP fails to connect to Simplifier on startup, an error page will open in
your browser with details on the failure and information on how to fix the
problem.
