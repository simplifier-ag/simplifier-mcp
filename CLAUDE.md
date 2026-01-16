# Claude Development Notes

This file contains development notes and instructions for Claude when working on this project.

## Project Overview

This is a Model Context Protocol (MCP) server for the Simplifier Low Code Platform. The server enables AI assistants to interact with Simplifier's REST API to create and manage:

- **Simplifier Connectors**: Integration components that connect external systems
- **BusinessObjects (BOs)**: Server-side executed JavaScript functions for business logic

## Key Implementation Details

### Authentication
- Simplifier uses **SimplifierToken** (not API keys)
- Token has session-like behavior and needs daily refresh (depending on token settings of Simplifier)
- User must obtain token daily and configure it in environment variables

### Configuration
- Base URL of Simplifiers REST API configured via `SIMPLIFIER_BASE_URL` environment variable
- Default development URL: `http://localhost:8080` (matches user's Simplifier server port)
- Configuration validation in `src/config.ts`

### Current Status
- **Infrastructure**: ✅ Complete (TypeScript, Jest, ESM, build system)
- **MCP Server**: ✅ Basic server with empty capabilities
- **API Client**: ✅ Structure in place with authentication placeholders
- **Tests**: ✅ All tests passing
- **Capabilities**: ❌ Empty arrays - tools, resources, prompts need implementation

### Testing
- Run tests: `pnpm test`
- Build project: `pnpm run build`
- Start server: `pnpm run dev` or `pnpm start`
- Test MCP protocol: `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js`

### File Structure Notes
- `src/tools/index.ts` - Empty tools array, ready for Simplifier tool implementations
- `src/resources/index.ts` - Empty resources array, ready for platform data access
- `src/prompts/index.ts` - Empty prompts array, ready for guided operations
- `src/client/` - API client with placeholder authentication
- `__tests__/` - Comprehensive test suite covering all modules

## Implemented Features

### ✅ Business Object Management
- **businessobject-update**: Create or update Business Objects
- **businessobject-function-update**: Create or update Business Object functions
- **businessobject-function-test**: Execute and test Business Object functions

## Next Development Steps

1. **Add Authentication**: Implement SimplifierToken handling in API client
2. **Add Resources**: Provide access to Simplifier platform data
3. **Add Prompts**: Create guided operations for users

## Development Commands

Use pnpm package manager rather than npm. 

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build project
pnpm run build

# Start server
pnpm start

# Development mode
pnpm run dev

# Test MCP server (with environment variables)
export SIMPLIFIER_BASE_URL=http://localhost:8087 && export SIMPLIFIER_CREDENTIALS_FILE=credentials.json && echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Important Notes for Claude

- Always run tests after making changes: `pnpm test`
- Follow existing TypeScript patterns and imports
- Keep SimplifierToken authentication as TODO comments until implementation story
- Maintain comprehensive test coverage for new features
- Use existing mocking patterns in tests
- Follow MCP protocol standards for tools, resources, and prompts