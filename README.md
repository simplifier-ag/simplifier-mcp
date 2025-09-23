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
SIMPLIFIER_BASE_URL=https://your-simplifier-instance.com/api

# Optional: Development environment setting
NODE_ENV=development

# Future: SimplifierToken authentication (to be implemented)
# SIMPLIFIER_TOKEN=your-daily-token-here
```

### Authentication (Future Implementation)

**SimplifierToken Authentication** will be added in a future story:

- **Daily Token Refresh**: Users will need to obtain a SimplifierToken each day
- **Session-like Behavior**: The token acts as a session key with limited lifetime
- **Manual Configuration**: Users will configure the token in environment variables before starting the MCP server
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

### Testing Strategy

The project follows a comprehensive testing approach:

- **Unit Tests**: Test individual modules and functions in isolation
- **Integration Tests**: Test MCP protocol flow and component interactions
- **Mocked API**: External API calls are mocked for reliable testing
- **Type Safety**: TypeScript ensures type correctness across the codebase

## Current Status

**Initial Setup Phase** - The project is currently set up with:

✅ **Complete Infrastructure**:
- TypeScript configuration with strict typing
- Jest testing framework with full coverage setup
- ESLint for code quality
- Environment configuration with validation
- Comprehensive project structure

✅ **MCP Server Foundation**:
- Basic MCP server with protocol handling
- Empty capabilities arrays (tools, resources, prompts)
- Proper MCP message routing and error handling

✅ **API Client Structure**:
- REST client for Simplifier platform
- Type definitions for Connectors and BusinessObjects
- Placeholder for SimplifierToken authentication

✅ **Testing Foundation**:
- Unit tests for all modules
- Integration test structure
- Mocked external dependencies

## Planned Capabilities

### Tools (Future Implementation)
- `create_connector` - Create a new Simplifier Connector
- `update_connector` - Update an existing Connector
- `delete_connector` - Delete a Connector
- `list_connectors` - List all available Connectors
- `create_business_object` - Create a new BusinessObject
- `update_business_object` - Update an existing BusinessObject
- `delete_business_object` - Delete a BusinessObject
- `list_business_objects` - List all available BusinessObjects
- `execute_business_object` - Execute a BusinessObject with parameters
- `get_connector_status` - Check the status of a Connector
- `validate_business_object` - Validate BusinessObject JavaScript code

### Resources (Future Implementation)
- `simplifier://connectors` - List of all connectors with metadata
- `simplifier://connectors/{id}` - Specific connector details
- `simplifier://business-objects` - List of all business objects
- `simplifier://business-objects/{id}` - Specific business object with source
- `simplifier://api-docs` - Simplifier REST API documentation
- `simplifier://templates/*` - Configuration and code templates
- `simplifier://system/status` - Platform health information

### Prompts (Future Implementation)
- `create_connector_guide` - Step-by-step connector creation
- `business_object_template` - Generate BusinessObject templates
- `troubleshoot_connector` - Help diagnose connector issues
- `optimize_business_object` - Performance optimization suggestions
- `security_review` - Security best practices guidance

## License

MIT