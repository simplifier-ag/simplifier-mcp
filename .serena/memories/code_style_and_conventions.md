# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext (ES Modules)
- **Strict Mode**: Enabled with comprehensive strict checks
- **No Implicit Any**: true
- **No Unused Locals/Parameters**: true
- **No Implicit Returns**: true
- **Exact Optional Property Types**: true

## Code Style
- **Module System**: ES Modules (ESM) - use `.js` extensions in imports
- **File Extensions**: `.ts` for TypeScript files
- **Imports**: Always include `.js` extension in relative imports (e.g., `from './config.js'`)

## Naming Conventions
- **Classes**: PascalCase (e.g., `SimplifierClient`, `SimplifierMCPServer`)
- **Functions**: camelCase (e.g., `getBaseUrl`, `validateConfig`)
- **Constants**: camelCase for config objects, UPPER_SNAKE_CASE for true constants
- **Types/Interfaces**: PascalCase (e.g., `SimplifierApiResponse`, `Config`)
- **Files**: kebab-case for multi-word files (e.g., `simplifier-client.ts`)

## Documentation
- **JSDoc Comments**: Used for public API methods and complex functions
- **Type Annotations**: Always explicit, never rely on inference for public APIs
- **Comments**: Explain "why" not "what" - code should be self-documenting

## Code Organization
- **One class per file** for main classes
- **Export patterns**: Named exports preferred over default exports
- **Imports order**: External modules first, then internal modules (with `.js` extension)

## Error Handling
- Use try-catch for async operations
- Provide meaningful error messages
- Include context in error objects

## Testing Conventions
- Test files mirror source structure: `__tests__/client/simplifier-client.test.ts`
- Use descriptive test names: `describe('SimplifierClient', () => { it('should...', () => {}) })`
- Mock external dependencies in `__tests__/setup.ts`
- Aim for comprehensive coverage

## Git Conventions
- Commit messages: `type: description [skip ci]` for version commits
- Branch names: `feature/`, `bugfix/`, `main`, `develop`
