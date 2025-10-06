# Authentication and Configuration

## Environment Variables

### Required Configuration
Either `SIMPLIFIER_TOKEN` OR `SIMPLIFIER_CREDENTIALS_FILE` must be set (not both).

#### SIMPLIFIER_BASE_URL
- Base URL for Simplifier REST API
- Example: `http://localhost:8080` (development)
- Example: `https://your-instance.simplifier.cloud` (production)

#### SIMPLIFIER_TOKEN
- SimplifierToken acts as a session key
- Must be obtained from Simplifier user profile
- Needs to be refreshed daily (depends on token settings)
- Location: User Profile → Copy current token
- All API actions run on behalf of the token's user

#### SIMPLIFIER_CREDENTIALS_FILE
- Alternative to SIMPLIFIER_TOKEN
- JSON file with login credentials
- Format: `{ "user": "username", "pass": "password" }`
- Example: `.credentials` file in project root

## Configuration Files

### .env (Local Development)
```bash
SIMPLIFIER_BASE_URL=http://localhost:8080
SIMPLIFIER_TOKEN=your-token-here
# OR
SIMPLIFIER_CREDENTIALS_FILE=./.credentials
```

### .credentials (Alternative Auth)
```json
{
  "user": "your-username",
  "pass": "your-password"
}
```

### .mcp.json (Claude Code Configuration)
Example configuration for using the MCP server with Claude Code:
```json
{
  "mcpServers": {
    "simplifier-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "SIMPLIFIER_BASE_URL": "http://localhost:8080",
        "SIMPLIFIER_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Configuration Validation
- Config validation happens in `src/config.ts`
- Uses Zod for schema validation
- Validates on server startup
- Throws errors for missing/invalid configuration

## Security Notes
- Never commit `.env` files (in .gitignore)
- Never commit `.credentials` files (in .gitignore)
- Never commit tokens to version control
- Token has session-like behavior - refresh regularly
