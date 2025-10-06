# Project Overview

## Purpose
This is a Model Context Protocol (MCP) server for the **Simplifier Low Code Platform**. It enables AI assistants to interact with Simplifier's REST API to:
- Create and manage **Simplifier Connectors** (integration components connecting external systems)
- Create and manage **BusinessObjects (BOs)** (server-side JavaScript functions for business logic)
- Create and manage **DataTypes** (custom data structures)
- Execute BusinessObject functions with parameters and retrieve results
- Access platform resources (browse connectors, business objects, system information)

## Tech Stack
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Node.js ≥18.0.0
- **Module System**: ESM (ES Modules)
- **Testing**: Jest with ts-jest
- **Protocol**: Model Context Protocol (MCP) via @modelcontextprotocol/sdk
- **API Client**: Native fetch API for HTTP requests
- **Validation**: Zod for schema validation
- **Environment**: dotenv for configuration

## Package Information
- **Name**: @simplifierag/simplifier-mcp
- **Version**: 0.9.15
- **Published to**: npmjs.com under @simplifierag organization
- **License**: - (proprietary)
