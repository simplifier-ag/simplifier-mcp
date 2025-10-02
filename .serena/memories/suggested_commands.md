# Suggested Commands

## Development Commands

### Building
- `npm run build` - Compile TypeScript to JavaScript (output: `dist/`)
- Build is required before running with `npm start`

### Testing
- `npm test` - Run full test suite with Jest
- `npm run test:watch` - Run tests in watch mode (auto-rerun on changes)
- `npm run test:coverage` - Run tests with coverage report

### Running
- `npm start` - Start MCP server (requires build first)
- `npm run dev` - Run server in development mode with tsx (no build needed)
- `npm run inspect` - Run MCP inspector tool for debugging

### Code Quality
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Fix linting issues automatically

## Testing MCP Server
```bash
# Test MCP server with environment variables
export SIMPLIFIER_BASE_URL=http://localhost:8080 && \
export SIMPLIFIER_CREDENTIALS_FILE=.credentials && \
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Git Commands (Standard)
- `git status` - Check current status
- `git add <files>` - Stage files
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote
- `git pull` - Pull from remote
- `git branch` - List branches
- `git checkout <branch>` - Switch branches

## System Commands (Linux)
- `ls` - List files in directory
- `cd <path>` - Change directory
- `grep <pattern> <files>` - Search for pattern
- `find <path> -name <pattern>` - Find files by name
- `cat <file>` - Display file contents
- `curl` - Make HTTP requests

## Environment Setup
1. Copy environment template: `cp .env.example .env`
2. Edit `.env` with your Simplifier instance URL and token
3. Install dependencies: `npm install`
4. Build project: `npm run build`
5. Run tests: `npm test`
