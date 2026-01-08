---
paths: src/**/*.{ts,tsx}
---

# TypeScript Conventions

This project enforces strict TypeScript conventions through ESLint rules defined in `eslint.config.js`.

## Type Definitions

- **Always use `type`** instead of `interface` for type definitions
- **Use `import type`** for type-only imports to distinguish them from value imports

```typescript
// Good
import type { Preferences } from './types';
type FormValues = { name: string };

// Bad
import { Preferences } from './types';
interface FormValues { name: string }
```

## Modern TypeScript Features

- **Nullish coalescing (`??`)**: Prefer `??` over `||` for default values
- **Optional chaining (`?.`)**: Use `?.` to safely access nested properties

```typescript
// Good
const separator = preferences.numberingSeparator ?? '-';
const name = user?.profile?.name;

// Bad
const separator = preferences.numberingSeparator || '-';
const name = user && user.profile && user.profile.name;
```

## Unused Variables

Prefix unused variables with underscore `_` to indicate intentional non-use:

```typescript
// Good
const [_loading, setLoading] = useState(false);

// Bad (will trigger ESLint error)
const [loading, setLoading] = useState(false);
```
