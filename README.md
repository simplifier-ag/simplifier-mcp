# Simplifier MCP Server

An MCP (Model Context Protocol) server that enables integration with the **Simplifier Low Code Platform**. This server provides tools and capabilities for creating and managing Simplifier Connectors and BusinessObjects through the platform's REST API.

## Overview

The Simplifier MCP Server allows AI assistants to interact with the Simplifier Low Code Platform to:

- **Create and manage Simplifier Connectors**: Integration components that connect external systems
- **Create and manage BusinessObjects (BOs)**: Server-side executed JavaScript functions for business logic
- **Execute BusinessObjects**: Run JavaScript functions with parameters and retrieve results
- **Access platform resources**: Browse connectors, business objects, and system information

## Project Structure

```
simplifier-mcp/
├── package.json              # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest testing configuration
├── .env.example             # Environment configuration template
├── .env                     # Local environment configuration
├── .gitignore              # Git ignore patterns
├── README.md               # This documentation
├── src/                    # Source code
│   ├── index.ts            # Main entry point with MCP server description
│   ├── server.ts           # MCP server implementation with protocol handling
│   ├── config.ts           # Environment configuration with validation
│   ├── client/             # Simplifier REST API client
│   │   ├── simplifier-client.ts  # API client with placeholder for SimplifierToken auth
│   │   └── types.ts        # TypeScript types for Simplifier API entities
│   ├── tools/              # MCP tools (currently empty)
│   │   └── index.ts        # Tools for creating/managing connectors and BOs
│   ├── resources/          # MCP resources (currently empty)
│   │   └── index.ts        # Resources for accessing platform data
│   └── prompts/            # MCP prompts (currently empty)
│       └── index.ts        # Prompts for guided operations
└── __tests__/              # Test suite
    ├── setup.ts            # Jest setup and configuration
    ├── server.test.ts      # MCP server protocol tests
    ├── config.test.ts      # Configuration validation tests
    ├── client/             # API client tests
    │   └── simplifier-client.test.ts  # REST API client tests
    ├── tools/              # Tools tests
    │   └── tools.test.ts   # Individual tool tests (placeholder)
    ├── resources/          # Resources tests
    │   └── resources.test.ts  # Resource access tests (placeholder)
    ├── prompts/            # Prompts tests
    │   └── prompts.test.ts # Prompt generation tests (placeholder)
    └── integration/        # Integration tests
        └── mcp-server.integration.test.ts  # Full MCP flow tests
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
- **Currently empty** - These modules will contain the actual MCP capabilities in future implementations
- Each module exports arrays that will be populated with MCP tools, resources, and prompts respectively

### `/__tests__`
- **Comprehensive test suite** covering all modules with unit and integration tests
- **Follows the same structure as `/src`** for easy navigation and maintenance
- **Includes placeholder tests** for future functionality to ensure continuous testing

## Configuration

### Environment Variables

The server requires the following environment configuration:

```env
# Required: Base URL for Simplifier REST API
SIMPLIFIER_BASE_URL=https://your-simplifier-instance.com

# Optional: Development environment setting
NODE_ENV=development

# Future: SimplifierToken authentication (to be implemented)
# SIMPLIFIER_TOKEN=your-daily-token-here
```

### Authentication (Future Implementation)

**SimplifierToken Authentication** will be added in a future story:

- **Daily Token Refresh**: Users will need to obtain a SimplifierToken each day
- **Session-like Behavior**: The token acts as a session key with limited lifetime
- **Manual Configuration**: Users will configure the token in environment variables in env file
- **Automatic Handling**: The client will include the token in API request headers

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

