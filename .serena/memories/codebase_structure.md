# Codebase Structure

## Directory Layout
```
/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point (starts MCP server)
│   ├── server.ts                 # MCP server implementation (SimplifierMCPServer class)
│   ├── config.ts                 # Environment configuration and validation
│   ├── client/                   # Simplifier REST API client
│   │   ├── simplifier-client.ts  # SimplifierClient class
│   │   ├── types.ts              # TypeScript type definitions
│   │   └── basicauth.ts          # Authentication helpers
│   ├── tools/                    # MCP tools implementation
│   │   ├── index.ts              # Tool registration
│   │   ├── server-businessobject-tools.ts
│   │   ├── server-datatype-tools.ts
│   │   └── toolresult.ts         # Helper types/functions
│   ├── resources/                # MCP resources implementation
│   │   ├── index.ts              # Resource registration
│   │   ├── server-businessobject-resources.ts
│   │   ├── connector-resources.ts
│   │   ├── datatypes-resources.ts
│   │   ├── resourcesresult.ts
│   │   └── documentation/        # API documentation resources
│   └── prompts/                  # MCP prompts (currently empty)
├── __tests__/                    # Comprehensive test suite
│   ├── setup.ts                  # Jest setup with mocks
│   ├── config.test.ts
│   ├── server.test.ts
│   ├── client/                   # Client tests
│   ├── tools/                    # Tool tests
│   ├── resources/                # Resource tests
│   └── integration/              # Integration tests
├── dist/                         # Build output (TypeScript compilation)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest configuration
├── .env.example                  # Environment template
├── README.md                     # End-user documentation
├── README_DEV.md                 # Developer documentation
└── CLAUDE.md                     # Claude-specific development notes
```

## Key Components

### Entry Point (`src/index.ts`)
- Main function that starts the MCP server

### Server (`src/server.ts`)
- `SimplifierMCPServer` class implementing MCP protocol
- Handles tool calls, resource access, and prompts

### Client (`src/client/`)
- `SimplifierClient` class for Simplifier REST API communication
- Handles authentication (SimplifierToken or credentials file)
- Type definitions for all API entities

### Tools (`src/tools/`)
- MCP tools for creating/updating Business Objects, functions, data types
- Tool registration functions

### Resources (`src/resources/`)
- MCP resources for browsing connectors, BOs, data types
- Documentation resources for API references
