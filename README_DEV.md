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

Add the MCP to **.mcp.json** in claude's working directory:
```json
{
  "mcpServers":  {
    "simplifier-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["simplifier-mcp-installation-dir/index.js"],
      "cwd": "simplifier-mcp-installation-dir",
      "env": {
        "SIMPLIFIER_BASE_URL": "http://myinstance.simplifier.io",
        "SIMPLIFIER_TOKEN": "a602920506da20ac9ed..."
      }
    }
  }
}
```

### Configuration

Basic configuration is provided via environment variables or an optional **.env** file.

#### Environment Variables

**SIMPLIFIER_BASE_URL** -
The base address of the API on the Simplifier instance to connect to.

**SIMPLIFIER_TOKEN** - A valid session token for the Simplifier Appserver

In order to obtain a Simplifier Token, log in at the instance, then go to the Your user profile and copy
the current token. This needs to be repeated every day, when you log out or the session expires.
Please note that all actions on the Simplifier instance are run on behalf of that user.


**SIMPLIFIER_CREDENTIALS_FILE** - Log in credentials for the Simplifier instance. The json File must contain valid credentials
in the form of
```json
{ "user":  "fritz", "pass":  "*****" }
```

**Note**: Either *SIMPLIFIER_TOKEN* or *SIMPLIFIER_CREDENTIALS_FILE* must be set. But not both at once.


## Project Structure

```
simplifier-mcp/
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest testing configuration
├── .env.example            # Environment configuration template
├── .env                    # Local environment configuration
├── .gitignore              # Git ignore patterns
├── README.md               # This documentation
├── src/                    # Source code
│   ├── index.ts            # Main entry point with MCP server description
│   ├── server.ts           # MCP server implementation with protocol handling
│   ├── config.ts           # Environment configuration with validation
│   ├── client/             # Simplifier REST API client
│   ├── tools/              # MCP tools (currently empty)
│   ├── resources/          # MCP resources (currently empty)
│   └── prompts/            # MCP prompts (currently empty)
└── __tests__/              # Test suite
```

## Folder Structure Explanation

### `/src`
- **`index.ts`**: Main entry point that describes the MCP server's capabilities and starts the server
- **`server.ts`**: Core MCP server implementation handling protocol messages (list_tools, call_tool, etc.)
- **`config.ts`**: Environment configuration management with validation for required settings

### `/src/client`
- **`simplifier-client.ts`**: REST API client for communicating with Simplifier platform
- **`types.ts`**: TypeScript type definitions for Simplifier entities (Connectors, BusinessObjects)

### `/src/tools`, `/src/resources`, `/src/prompts`
The actual implementation of MCP capabilities

### `/__tests__`
- **Comprehensive test suite** covering all modules with unit and integration tests
- **Follows the same structure as `/src`** for easy navigation and maintenance
- **Includes placeholder tests** for future functionality to ensure continuous testing


## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Simplifier instance URL
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run the full test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run dev` - Run server in development mode with tsx
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Fix linting issues automatically

---

# CI/CD Pipeline Documentation

This section describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Simplifier MCP Server.

## Pipeline Overview

The Azure DevOps pipeline (`azure-pipelines.yml`) implements a two-stage process:

1. **Build_and_Test** - Validates code quality and functionality
2. **Publish_to_NPM** - Automatically publishes to npmjs.com with version management

## Pipeline Triggers

### Automatic Triggers
- **Branches**: `main`, `develop`, `feature/*`
- **Excluded Files**: README.md, CLAUDE.md, .gitignore

## Build and Test Stage

1. **Environment Setup**
   - Node.js 18.x installation
   - npm dependency caching for faster builds
   - npm ci for clean dependency installation

2. **Code Validation**
   - TypeScript compilation (`npm run build`)
   - Unit test execution with coverage (`npm test`)
   - MCP server functionality test

3. **Artifacts**
   - Publishes test results (JUnit format)
   - Creates build artifacts from `dist/` folder


## Publish to NPM Stage

### Conditional Execution
The publish stage only runs when:
- ✅ Build and test stage succeeded
- ✅ Not a pull request (`isNotPR = true`)
- ⚠️ Currently runs on all branches (not just main - TODO change this when done...)

### Automatic Version Bumping 

1. **Version Patch**: `npm version --force patch -m "chore: bump version to %s [skip ci]"`
   - Increments patch version (e.g., 0.9.10 → 0.9.11)
   - `--force` flag handles modified files (like .npmrc)
   - Commit message includes `[skip ci]` to prevent pipeline loops

2. **Git Operations**:
   - Commits version change to package.json
   - Creates version tag (e.g., `v0.9.11`)
   - Pushes commit and tag to Azure Repos

3. **NPM Publication**:
   - Currently in dry-run mode (`npm publish --dry-run`)
   - To enable real publishing, uncomment line 154 in pipeline

### Git Push Strategy

Due to Azure Pipeline's detached HEAD state, we use:
```bash
git push origin HEAD:$(Build.SourceBranch)
```

This explicitly pushes from the current HEAD to the source branch that triggered the build.

## NPM Publishing Configuration

### Authentication
- Uses azure service connection: `npm simplifierag simplifier mcp` to authenticate at npmjs.com 
- see also: https://pass.simplifier.io/app/passwords/view/6496bcb8-a8ec-4a3f-ae5a-ff7c947b10ca
- `.npmrc` file configured for registry authentication

### Package Configuration
- **Name**: `@simplifierag/simplifier-mcp`
- **Scope**: `@simplifierag` (organization scope)
- **Access**: Public (`--access public`)
- **Registry**: https://registry.npmjs.org/
