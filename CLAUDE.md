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

## Implemented Features

### ✅ Business Object Management
- **businessobject-update**: Create or update Business Objects
- **businessobject-function-update**: Create or update Business Object functions
- **businessobject-function-test**: Execute and test Business Object functions

### ✅ Data Type Support
All common base data types with their IDs:
- String: `22ED1F787B6B0926AB0577860AF7543705341C053EB1B4A74E7CC199A0645E52`
- Integer: `B9B1191E0B70BA0845CF4F6A4F4C017594F8BA84FD2F1849966081D53A8C836D`
- Boolean: `2788FB5AA776C62635F156C820190D0FD3D558765201881A77382093F7248B39`
- Date: `06A9841478D7BE17C423F11C38CD6829E372093DBEC144F2A85FC7165BE8CD80`
- Float: `C09139C72F5A8A7E0036BA66CE301748BD617F463683EE03F92EDAAAA4AF8BC7`
- Any: `D31053204B4A612390A2D6ECDF623E979C14ADC070A7CB9B08B2099C3011BCAB`

## Next Development Steps

1. **Add Authentication**: Implement SimplifierToken handling in API client
2. **Add Resources**: Provide access to Simplifier platform data
3. **Add Prompts**: Create guided operations for users

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

# Test MCP server (with environment variables)
export SIMPLIFIER_BASE_URL=http://localhost:8087 && export SIMPLIFIER_CREDENTIALS_FILE=credentials.json && echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Important Notes for Claude

- Always run tests after making changes: `npm test`
- Follow existing TypeScript patterns and imports
- Keep SimplifierToken authentication as TODO comments until implementation story
- Maintain comprehensive test coverage for new features
- Use existing mocking patterns in tests
- Follow MCP protocol standards for tools, resources, and prompts