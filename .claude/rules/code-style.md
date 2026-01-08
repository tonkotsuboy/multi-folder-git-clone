# Code Style

This project uses Prettier for consistent code formatting. Configuration is in `.prettierrc`.

## Formatting Rules

- **Semicolons**: Required at end of statements
- **Quotes**: Single quotes for strings
- **Line width**: Maximum 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Trailing commas**: ES5-compatible (objects, arrays)

## Applying Formatting

```bash
# Auto-fix with Prettier via ESLint
npm run fix-lint
```

## General Style Guidelines

- Use `const` by default, only use `let` when reassignment is necessary
- Never use `var`
- Console logs are allowed in Raycast extensions (logging is necessary for debugging)
