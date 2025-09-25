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
- Run tests: `npm test`
- Build project: `npm run build`
- Start server: `npm run dev` or `npm start`
- Test MCP protocol: `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js`

### File Structure Notes
- `src/tools/index.ts` - Empty tools array, ready for Simplifier tool implementations
- `src/resources/index.ts` - Empty resources array, ready for platform data access
- `src/prompts/index.ts` - Empty prompts array, ready for guided operations
- `src/client/` - API client with placeholder authentication
- `__tests__/` - Comprehensive test suite covering all modules

## Next Development Steps

1. **Implement Tools**: Add actual MCP tools for Connector and BusinessObject management
2. **Add Authentication**: Implement SimplifierToken handling in API client
3. **Add Resources**: Provide access to Simplifier platform data
4. **Add Prompts**: Create guided operations for users

## Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build

# Start server
npm start

# Development mode
npm run dev

# Test MCP server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Important Notes for Claude

- Always run tests after making changes: `npm test`
- Follow existing TypeScript patterns and imports
- Keep SimplifierToken authentication as TODO comments until implementation story
- Maintain comprehensive test coverage for new features
- Use existing mocking patterns in tests
- Follow MCP protocol standards for tools, resources, and prompts