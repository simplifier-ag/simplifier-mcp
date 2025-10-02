# Task Completion Checklist

When completing a development task, follow these steps:

## 1. Build
```bash
npm run build
```
Ensure TypeScript compiles without errors.

## 2. Lint
```bash
npm run lint
```
Check for code style issues. Fix with:
```bash
npm run lint:fix
```

## 3. Test
```bash
npm test
```
Ensure all tests pass. For specific test coverage:
```bash
npm run test:coverage
```

## 4. Manual Testing (if applicable)
Test the MCP server with:
```bash
npm run inspect
```
or
```bash
npm run dev
```

## 5. Git Workflow
```bash
git status                    # Check changes
git add <files>              # Stage changes
git commit -m "description"  # Commit
git push                     # Push to remote
```

## Important Notes
- **Always run tests** after making changes
- **Never skip the build step** - it catches TypeScript errors
- **Check git status** before committing to avoid unwanted files
- **Follow commit message conventions**: Clear, descriptive messages
- **CI/CD Pipeline**: Automatically runs on push to `main`, `develop`, `feature/*` branches
  - Excludes: README.md, CLAUDE.md, .gitignore changes
  - Auto-publishes to npm from `main` branch with version bump

## For New Features
1. Add implementation
2. Add/update tests in `__tests__/`
3. Run full test suite
4. Update documentation if needed (README_DEV.md)
5. Build and verify no errors
6. Commit and push
