# Simplifier MCP Server

An MCP (Model Context Protocol) server that enables integration with the **Simplifier Low Code Platform**. This server provides tools and capabilities for creating and managing Simplifier Connectors and BusinessObjects through the platform's REST API.

## Overview

The Simplifier MCP Server allows AI assistants to interact with the Simplifier Low Code Platform to:

- **Create and manage Simplifier Connectors**: Integration components that connect external systems
- **Create and manage BusinessObjects (BOs)**: Server-side executed JavaScript functions for business logic
- **Execute BusinessObjects**: Run JavaScript functions with parameters and retrieve results
- **Access platform resources**: Browse connectors, business objects, and system information


## Usage

### Example configuration for claude code to use the MCP
TODO update

### Configuration

Basic configuration is provided via environment variables or an optional **.env** file.

#### Environment Variables


**SIMPLIFIER_TOKEN** - A valid session token for the Simplifier Appserver

In order to obtain a Simplifier Token, log in at the instance, then go to your user profile and copy
the current token. This needs to be repeated every day, when you log out or the session expires.
Please note that all actions on the Simplifier instance are run on behalf of that user.

**Note**: The env variable *SIMPLIFIER_TOKEN* must be set. 


## Installation & Setup
### End user Installation
```bash
  npm install @simplifierag/simplifier-mcp
```

### Usage as CLI
```bash
  npx @simplifierag/simplifier-mcp
```
