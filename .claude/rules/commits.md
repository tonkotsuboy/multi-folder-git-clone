# Commit Conventions

## Commit Granularity

Split commits into fine-grained, logical units. Each commit should represent a single, coherent change.

```bash
# Good - separate commits
git commit -m "Add TypeScript type definitions"
git commit -m "Implement path collision detection"
git commit -m "Add preview path display"

# Bad - bundling unrelated changes
git commit -m "Add types, path detection, and preview"
```

## Commit Message Language

Write all commit messages in **English**.

## Commit Message Format

Use clear, descriptive commit messages in imperative mood:

```bash
# Good
"Add automatic numbering for duplicate clones"
"Fix path collision in parallel clone operations"
"Update preferences to support custom separators"

# Bad
"Added feature"
"Fixed bug"
"Changes"
```
